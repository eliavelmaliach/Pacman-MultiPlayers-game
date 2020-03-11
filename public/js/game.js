import Phaser from 'phaser';
import io from 'socket.io-client'
import { game } from './LoginScene'
import Ghost from './ghost';
import Pacman from './pacman';
import $ from 'jquery';

//global variable 
//defining characters
var singlePlayerMode;
var pac;
var pac2;
var green;
var pink;
var red;
var purple;
//variable for mute button
var music;
var mute = true;
//defining the layers of the game
export var layer_for_pacman;
export var layer_for_ghosts;
var layer_for_other_pacman;
//defining the key pressed variable
var cursors;
//counts the number of updates- for ghosts speed regulation 
var gameCounter = 0;
//the yellow_score text and green score text
var yellow_score_text;
var green_score_text;
var YellowLifeImage;
var GreenLifeImage;
//the yellow_score of the player in the game
var yellow_score = 0;
var green_score = 0;
//the number of lives left text
var yellow_life_text;
var green_life_text;
//the time passed text
var timeText;
var wait_for_other_player_text;
var wrong_answer_text;
var right_answer_text;
var question_timer_text;
//at first pacman has 3 lives
var yellow_life = 3;
var green_life = 3;
//the yellow_score added to pacman for eating a dot
var scoreForDot = 10;
//for calculation of time
var startTime, endTime, timeDiff;
var secTime = 0;
var show_question_result_timer = 0;
var question_timer = 0;
//flag for whether the game ended
var socket = io();
var turn = 'Error';
var is_other_player_active = false;
//for echo player
var ghost_movement;
var pac_movment;

var is_vulnerable_mode = false;
var dots = 252;
var correct_answer_ghost;
var user_name;
var player_room;
var player_number;
var room_number_text;

//=====================================================================================================
//update the state of the other
socket.on('change_other_player_status', function (room_num, status) {
  if (room_num != player_room)
    return;
  if (false === is_other_player_active && status) {
    startTime = new Date();
  }
  is_other_player_active = status;
});

//=====================================================================================================
socket.on('update_the_client_for_pacman_position', function (room_num, x, y, veloX, veloY, velo, angle) {
  if (room_num != player_room)
    return;
  pac2.setPosition(x, y, veloX, veloY, velo, angle);
});

//=====================================================================================================
socket.on('update_client_for_eating_power_dot', function (room_num, question, answers_json, correct_answer, x, y, t) {
  if (room_num != player_room)
    return;
  if (t != turn) {
    layer_for_pacman.removeTileAt(x, y);
  }
  var answers = JSON.parse(answers_json);
  var obj = {
    "question": question,
    "answers": answers,
    "correct_answer": correct_answer
  }
  set_ghosts_invulnerable();
  var correct_answer_idx = answers.indexOf(correct_answer);
  correct_answer_ghost = get_correct_answer_ghost(correct_answer_idx);
  correct_answer_ghost.set_vulnerable(true);
  game.scene.pause('Game_scene_key');
  game.scene.run('Question_scene_key', obj);

  setTimeout(() => {
    game.scene.stop('Question_scene_key');
    game.scene.resume('Game_scene_key');
    is_vulnerable_mode = true;
    question_timer = secTime + 24;

  }, 9000);
});

//=====================================================================================================
socket.on('update_client_pac_lost_life', function (room_num, t) {
  if (room_num != player_room)
    return;
  if (t == 'g' && turn == 'y') {
    green_life--;
    green_life_text.setText('\n\n\ngreen_life: ' + green_life);
  }
  else {
    yellow_life--;
    yellow_life_text.setText('\n\n\nyellow_life: ' + yellow_life);
  }
});

//=====================================================================================================
socket.on('update_client_for_game_over', function (room_num) {
  var cur_score;
  if (room_num != player_room)
    return;
  if (turn === "y") {
    cur_score = yellow_score;
    update_json({ Name: user_name, Score: yellow_score });
  }
  if (turn === "g") {
    cur_score = green_score;
    update_json({ Name: user_name, Score: green_score });
  }
  var data = { "player": user_name, "score": cur_score };
  game.scene.stop("Game_scene_key");
  game.scene.start('Game_over_scene_key', data);
  socket.emit('update_server_for_disconnected_client', player_number);
});

//=====================================================================================================
socket.on('update_client_for_initialize_info', function (t, rn, pn) {
  turn = t;
  player_room = rn;
  player_number = pn;
});

//=====================================================================================================
socket.on('RemoveDot', function (room_num, t, tileX, tileY, new_score, CountDots) {
  if (room_num != player_room)
    return;
  if (CountDots == 0)
    socket.emit('update_server_for_game_over');
  if (turn != t) {
    layer_for_pacman.removeTileAt(tileX, tileY);
  }
  if (t == 'y' && turn == 'g') {
    yellow_score = new_score;
    yellow_score_text.setText('opponent\nscore: ' + yellow_score);
  }
  else if (t == 'g' && turn == 'y') {
    green_score = new_score;
    green_score_text.setText('opponent\nscore: ' + green_score);
  }
});


//=====================================================================================================
// get from the server the "master" ghost location  
socket.on('update_the_client_for_ghost_movment', function (room_num, ghostColor, x, y, veloX, veloY, velo) {
  if (room_num != player_room)
    return;
  if (ghostColor == 'green') {
    green.setPosition(x, y, veloX, veloY, velo);
  }
  if (ghostColor == 'pink') {
    pink.setPosition(x, y, veloX, veloY, velo);
  }
  if (ghostColor == 'red') {
    red.setPosition(x, y, veloX, veloY, velo);
  }
  if (ghostColor == 'purple') {
    purple.setPosition(x, y, veloX, veloY, velo);
  }
});

//=====================================================================================================
//when pacman touches a ghost
function startOver() {
  if (turn == 'y') {
    yellow_life--;
    yellow_life_text.setText('\n\nyellow_life: ' + yellow_life);
  }
  else if (turn == 'g') {
    green_life--;
    green_life_text.setText('\n\n\ngreen_life: ' + green_life);
  }
  if (singlePlayerMode == false) {
    socket.emit('update_server_pac_lost_life',player_room, turn);
  }
  if (green_life == 0 || yellow_life == 0) {
    socket.emit('update_server_for_game_over', player_room);
  }
  pac.gameStart();
}
//=====================================================================================================
//the result of eating a food
function eatDot(sprite, tile) {
  layer_for_pacman.removeTileAt(tile.x, tile.y);
  if (turn == 'y') {
    yellow_score += scoreForDot;
    yellow_score_text.setText('yellow player: ' + user_name + "\n score: " + yellow_score);
  }
  else if (turn == 'g') {
    green_score += scoreForDot;
    green_score_text.setText('green player: ' + user_name + "\n score: " + green_score);
  }
  if (this.is_single_player_mode === true) {
    dots--;
    if (dots == 0)
      socket.emit('update_server_for_game_over', player_room);
  }
  if (false === this.is_single_player_mode) {
    if (turn == 'y') {
      socket.emit('update_server_for_score', player_room, yellow_score, turn, tile.x, tile.y);
    }
    else if(turn == 'g'){
      socket.emit('update_server_for_score', player_room, green_score, turn, tile.x, tile.y);
    }
  }

}
//=====================================================================================================
//the result of eating a power up
function eatPowerUp(sprite, tile) {
  layer_for_pacman.removeTileAt(tile.x, tile.y);
  $.ajax({
    type: 'GET',
    url: "https://opentdb.com/api.php?amount=1&type=multiple",
    data: { get_param: 'value' },
    dataType: 'json',
    success: function (data) {
      socket.emit('update_server_for_eating_power_dot', player_room, data, tile.x, tile.y);
    }
  });
}

//=====================================================================================================
function update_json(obj) {
  //const user = {'Name' :name, 'Score':score};
  var path = "/app/update_score";
  fetch(path, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(obj)
  }).then(res => {
    return res.json();
  }).then(data => {
    console.log(data);
  }).catch(err => {
    console.log(err);
  });
}

//=====================================================================================================
//calculating time
function calculateTime() {
  endTime = new Date();
  timeDiff = endTime - startTime; //in ms
  secTime = Math.round(timeDiff / 1000);
}

//=====================================================================================================
function set_ghosts_invulnerable() {
  green.set_vulnerable(false);
  pink.set_vulnerable(false);
  red.set_vulnerable(false);
  purple.set_vulnerable(false);
}

//=====================================================================================================
//calculating time
function get_correct_answer_ghost(idx) {
  if (idx == 0)
    return red;
  else if (idx == 1)
    return purple;
  else if (idx == 2)
    return pink;
  else return green;
}
//=====================================================================================================
function try_to_eat_ghost(ghost) {
  if (ghost.is_vulnerable()) {
    ghost.gameStart()
    right_answer_text.setText("ʘ‿ʘ RIGHT ANSWER ʘ‿ʘ");
    if (turn == 'y') {
      yellow_score += 500;
      yellow_score_text.setText('yellow_score: ' + yellow_score);
    }
    else if(turn == 'g') {
      green_score += 500;
      green_score_text.setText('green_score: ' + green_score);
    }
  }
  else {
    startOver()
    pac.gameStart();
    wrong_answer_text.setText("ʘ⌒ʘ WRONG ANSWER ʘ⌒ʘ");
  }
  correct_answer_ghost.set_vulnerable(false);
  question_timer = 0;
  show_question_result_timer = secTime + 2;
  is_vulnerable_mode = false;
}

//=====================================================================================================
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "Game_scene_key" });
  }
  init(data) {
    if (data.mode === "single_player_mode") {
      this.is_single_player_mode = true;
      singlePlayerMode = true;

    }
    else {
      this.is_single_player_mode = false;
      singlePlayerMode = false;

    }
    this.player_name = data.player_name;
    user_name = this.player_name;
  }
  //=====================================================================================================
  preload() {
    yellow_life = 3;
    green_life = 3;
    green_score=0;
    yellow_score=0;
    dots=252;

    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', { font: '20px monospace', fill: '#ffffff' });
    this.loadingText.setOrigin(0.5, 0.5);

    this.percentText = this.add.text(width / 2, height / 2, "0%", { font: '18px monospace', fill: '#ffffff' });
    this.percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      this.percentText.setText(parseInt(value * 100) + '%');
    });
    //loading images
    this.load.image('dot', 'assets/dot.png');
    this.load.image('tiles', 'assets/image.png');
    //loading the pacman sprite (animation) size of pacman is 15*15
    this.load.spritesheet('pacman', 'assets/pacman.png', { frameWidth: 15, frameHeight: 15 });
    this.load.spritesheet('otherPacman', 'assets/other-pacman.png', { frameWidth: 15, frameHeight: 15 });

    this.load.tilemapTiledJSON('map', 'assets/pacman-map.json');
    this.load.tilemapTiledJSON('map2', 'assets/pacman-map2.json');
    this.load.tilemapTiledJSON('map3', 'assets/pacman-map2.json');

    //loading the green ghost sprite (animation) size of green ghost  is 15*15
    this.load.spritesheet('green', 'assets/green.png', { frameWidth: 15, frameHeight: 15 });
    //loading the pink ghost  sprite (animation) size of pink ghost  is 15*15
    this.load.spritesheet('pink', 'assets/pink.png', { frameWidth: 15, frameHeight: 15 });
    //loading the purple ghost  sprite (animation) size of purple ghost  is 15*15
    this.load.spritesheet('purple', 'assets/purple.png', { frameWidth: 15, frameHeight: 15 });
    //loading the red ghost  sprite (animation) size of red ghost  is 15*15
    this.load.spritesheet('red', 'assets/red.png', { frameWidth: 15, frameHeight: 15 });
    //loading mute and unmute image.
    this.load.image('mute_button', 'assets/buttons/pause.png');
    this.load.image('Unmute_button', 'assets/buttons/play.png');
    //loading lifa image for yellow pac.
    this.load.image('one_life_yellow', 'assets/life/one_yellow.png');
    this.load.image('tow_life_yellow', 'assets/life/tow_yellow.png');
    this.load.image('three_life_yello', 'assets/life/three_yellow.png');
    //loading lifa image for green pac.
    this.load.image('one_life_green', 'assets/life/one_green.png');
    this.load.image('tow_life_green', 'assets/life/tow_green.png');
    this.load.image('three_life_green', 'assets/life/three_green.png');

    //the % for ready
    for (let i = 0; i < 200; i++) {
      this.load.image(`BACKGROUND_SPRITE_${i}`, "assets/dot.png");
    }
    this.load.audio('panther_audio', ['assets/audio/The_Pink_Panther.wav']);
    socket.emit('update_server_by_client_play_mode', this.is_single_player_mode);
  }
  //=====================================================================================================
  //the creation of the game
  create() {
    //defining a map (for the walls)- for 2 layers
    var map = this.make.tilemap({ key: 'map' });
    var map2 = this.make.tilemap({ key: 'map2' });
    var map3 = this.make.tilemap({ key: 'map3' });
    //add an image to the map -for 2 layers
    var tiles = map.addTilesetImage('pacman-tiles', 'tiles');
    var tiles2 = map2.addTilesetImage('pacman-tiles', 'tiles');
    var tiles3 = map3.addTilesetImage('pacman-tiles', 'tiles');
    //put the map on the canvas as a dynamic layer-for 2 layers
    layer_for_other_pacman = map3.createDynamicLayer("Pacman2", tiles3, 400, 80);
    layer_for_ghosts = map2.createDynamicLayer("Pacman2", tiles2, 400, 80);
    layer_for_pacman = map.createDynamicLayer("Pacman", tiles, 400, 80);

    green = new Ghost('green', this);
    pink = new Ghost('pink', this);
    red = new Ghost('red', this);
    purple = new Ghost('purple', this);

    //defining cursors: for when some key is pressed
    cursors = this.input.keyboard.createCursorKeys();
    //set the ghost
    purple.gameStart();
    green.gameStart();
    pink.gameStart();
    red.gameStart();
    //set the pacmans
    if (this.is_single_player_mode === false) {
      if (turn == 'y') {
        pac = new Pacman(660, 360, 'pacman', this);
        pac2 = new Pacman(600, 360, 'otherPacman', this);
      }
      else if(turn == 'g') {
        pac = new Pacman(600, 360, 'otherPacman', this);
        pac2 = new Pacman(660, 360, 'pacman', this);
      }
      this.physics.add.collider(pac2.getPacImg(), layer_for_other_pacman);
    }
    else {
      pac = new Pacman(630, 360, 'otherPacman', this);
    }
    //pacman will collide with everything besides layer_for_ghosts-the dots,17-power ups, and 14-blank spot
    layer_for_pacman.setCollision([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
    //layer 2 for ghosts(so they don't eat dots)
    layer_for_ghosts.setCollision([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
    layer_for_other_pacman.setCollision([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);

    //defining collision between pacman and the tilemap,first layer
    this.physics.add.collider(pac.getPacImg(), layer_for_pacman);

    //defining collision between the ghost and the tilemap,second layer
    this.physics.add.collider(green.getGhostImg(), layer_for_ghosts);
    this.physics.add.collider(pink.getGhostImg(), layer_for_ghosts);
    this.physics.add.collider(red.getGhostImg(), layer_for_ghosts);
    this.physics.add.collider(purple.getGhostImg(), layer_for_ghosts);

    if (false === this.is_single_player_mode) {
      //adding text: yellow_score and yellow_life
      if (turn == 'y') {
        yellow_score_text = this.add.text(16, 16, yellow_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_score_text.setText('yellow player: ' + this.player_name + "\nscore: " + yellow_score);
        yellow_life_text = this.add.text(16, 30, yellow_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_life_text.setText('\n\nyellow_life: ' + yellow_life);
        YellowLifeImage = this.add.sprite(50, 200, 'three_life_yello');
        /////////////////////////////
        green_score_text = this.add.text(960, 16, green_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_score_text.setText('opponent\nscore: ' + green_score);
        green_life_text = this.add.text(960, 30, green_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_life_text.setText('\n\ngreen_life: ' + green_life);
        GreenLifeImage = this.add.sprite(994, 200, 'three_life_green');
      } else if (turn == 'g') {
        green_score_text = this.add.text(960, 16, green_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_score_text.setText('green player: ' + this.player_name + "\nscore: " + green_score);
        green_life_text = this.add.text(960, 30, green_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_life_text.setText('\n\n\ngreen_life: ' + green_life);
        GreenLifeImage = this.add.sprite(994, 200, 'three_life_green');
        //////////////////
        yellow_score_text = this.add.text(16, 16, yellow_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_score_text.setText('opponent\nscore: ' + yellow_score);
        yellow_life_text = this.add.text(16, 30, yellow_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_life_text.setText('\n\nyellow_life: ' + yellow_life);
        YellowLifeImage = this.add.sprite(50, 200, 'three_life_yello');
      }
    } else {
      if (turn == 'y') {
        yellow_score_text = this.add.text(16, 16, yellow_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_score_text.setText('yellow player: ' + this.player_name + "\nscore: " + yellow_score);
        yellow_life_text = this.add.text(16, 30, yellow_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        yellow_life_text.setText('\n\nyellow_life: ' + yellow_life);
        YellowLifeImage = this.add.sprite(50, 200, 'three_life_yello');
      } else if (turn == 'g') {
        green_score_text = this.add.text(960, 16, green_score, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_score_text.setText('green player: ' + this.player_name + "\nscore: " + green_score);
        green_life_text = this.add.text(960, 30, green_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
        green_life_text.setText('\n\n\ngreen_life: ' + green_life);
        GreenLifeImage = this.add.sprite(994, 200, 'three_life_green');
      }
    }
    room_number_text = this.add.text(16, 30, green_life, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
    room_number_text.setText('\n\n\n\n\nroom number: ' + player_room);
    //calculating time
    calculateTime();
    //showing time
    timeText = this.add.text(16, 0, secTime, { fontSize: '32px', fontFamily: 'Arial', fill: '#0080ff' });
    timeText.setText('\n\n\n\nTime: ' + secTime);
    //add the "-Waiting for other player-" text
    wait_for_other_player_text = this.add.text(300, 300, "-Waiting for other player-", {
      font: "65px Arial",
      fill: "#ff0044",
      align: "center"
    });
    wrong_answer_text = this.add.text(500, 30, "", {
      font: "32px Arial",
      fill: "#ff0000",
      align: "center"
    });
    right_answer_text = this.add.text(500, 30, "", {
      font: "32px Arial",
      fill: "#00ff00",
      align: "center"
    });
    question_timer_text = this.add.text(615, 30, "", {
      font: "32px Arial",
      fill: "#00ff00",
      align: "center"
    });

    //send to the server that you are ready for the game
    if (false === this.is_single_player_mode) {
      socket.emit('update_server_that_player_is_ready', player_room);
    }
    else {
      startTime = new Date();
    }
    music = game.sound.add('panther_audio');
    music.play();
    var muteButton = this.add.sprite(100, 500, 'mute_button').setInteractive();
    muteButton.on('pointerdown', function () {
      if (mute == true) {
        muteButton.setTexture('Unmute_button');
        mute = false;
        music.pause();
      }
      else {
        muteButton.setTexture('mute_button');
        mute = true;
        music.resume();
      }
    });
  }
  //=====================================================================================================
  update() {
    //not starting to play until there is 2 players  
    if (is_other_player_active || this.is_single_player_mode) {
      calculateTime();
      timeText.setText('\n\n\n\nTime: ' + secTime);
      if (secTime === show_question_result_timer) {
        wrong_answer_text.setText('');
        right_answer_text.setText('');
      }
      if (secTime >= question_timer) {
        question_timer_text.setText('');
        set_ghosts_invulnerable();
        is_vulnerable_mode = false;
      }
      else {
        question_timer_text.setText(question_timer - secTime);
      }
      //make the wait for other player invisible
      wait_for_other_player_text.setText('');
      //pac movment
      pac_movment = pac.move(cursors);
      if (false == this.is_single_player_mode) {
        //echo to the other client
        socket.emit('update_the_server_for_pacman_position', player_room, pac_movment.x, pac_movment.y, pac_movment.is_veloX,
          pac_movment.is_veloX, pac_movment.velo, pac_movment.angle);
      }
      //when pacman and a ghost collide
      if (false === is_vulnerable_mode) {
        this.physics.world.collide(pac.getPacImg(), green.getGhostImg(), startOver);
        this.physics.world.collide(pac.getPacImg(), pink.getGhostImg(), startOver);
        this.physics.world.collide(pac.getPacImg(), red.getGhostImg(), startOver);
        this.physics.world.collide(pac.getPacImg(), purple.getGhostImg(), startOver);
      }
      else {
        this.physics.world.collide(pac.getPacImg(), green.getGhostImg(), function () { try_to_eat_ghost(green) });
        this.physics.world.collide(pac.getPacImg(), pink.getGhostImg(), function () { try_to_eat_ghost(pink) });
        this.physics.world.collide(pac.getPacImg(), red.getGhostImg(), function () { try_to_eat_ghost(red) });
        this.physics.world.collide(pac.getPacImg(), purple.getGhostImg(), function () { try_to_eat_ghost(purple) });
      }
      //when pacman hits a dot-tile number 7, he activates the function eatDot   
      layer_for_pacman.setTileIndexCallback(7, eatDot, this);
      //when pacman hits a dot-tile number 17, he activates the function eatPowerUp
      layer_for_pacman.setTileIndexCallback(17, eatPowerUp, this);
      //if counter reached max, reset
      if (gameCounter == Number.MAX_SAFE_INTEGER) {
        gameCounter = 0;
      }
      gameCounter += 1;
      if (turn == 'y' || this.is_single_player_mode) {
        //ghosts can move only by certain speed(so they don't move like crazy)
        if (gameCounter % 20 == 0) {
          ghost_movement = green.move(secTime, layer_for_ghosts);
          socket.emit('update_the_server_for_ghost_movment', player_room, 'green', ghost_movement.x, ghost_movement.y, ghost_movement.veloX, ghost_movement.veloY, ghost_movement.velo);
          ghost_movement = pink.move(secTime, layer_for_ghosts);
          socket.emit('update_the_server_for_ghost_movment', player_room, 'pink', ghost_movement.x, ghost_movement.y, ghost_movement.veloX, ghost_movement.veloY, ghost_movement.velo);
          ghost_movement = red.move(secTime, layer_for_ghosts);
          socket.emit('update_the_server_for_ghost_movment', player_room, 'red', ghost_movement.x, ghost_movement.y, ghost_movement.veloX, ghost_movement.veloY, ghost_movement.velo);
          ghost_movement = purple.move(secTime, layer_for_ghosts);
          socket.emit('update_the_server_for_ghost_movment', player_room, 'purple', ghost_movement.x, ghost_movement.y, ghost_movement.veloX, ghost_movement.veloY, ghost_movement.velo);
        }
        else {
          ghost_movement = purple.getPosition();
          socket.emit('update_the_server_for_ghost_movment', player_room, 'purple', ghost_movement.x, ghost_movement.y, false, false, 60);
          ghost_movement = red.getPosition();
          socket.emit('update_the_server_for_ghost_movment', player_room, 'red', ghost_movement.x, ghost_movement.y, false, false, 60);
          ghost_movement = pink.getPosition();
          socket.emit('update_the_server_for_ghost_movment', player_room, 'pink', ghost_movement.x, ghost_movement.y, false, false, 60);
          ghost_movement = green.getPosition();
          socket.emit('update_the_server_for_ghost_movment', player_room, 'green', ghost_movement.x, ghost_movement.y, false, false, 60);
        }
      }
    }
    else {
      wait_for_other_player_text.setText("-Waiting for other player-");
    }
    if (yellow_life == 2)
      YellowLifeImage.setTexture('tow_life_yellow');
    else if (yellow_life == 1)
      YellowLifeImage.setTexture('one_life_yellow');
    if (green_life == 2)
      GreenLifeImage.setTexture('tow_life_green');
    else if (green_life == 1)
      GreenLifeImage.setTexture('one_life_green');
  }
}
//=====================================================================================================
