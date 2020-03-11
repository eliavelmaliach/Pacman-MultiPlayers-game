//####  We use package.json file to keep track of all the packages that our project depends on.

//created a new instance of express and called it app.


var express = require('express');
var Bundler = require("parcel-bundler");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);//referenced the socket.io module and had it listen to our server object.
var fs = require('fs');
bodyParser = require('body-parser');

const router = express.Router();
// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/app", router);
//updated the server to render our static files using express.static built-in middleware function in Express.
app.use("/assets", express.static("public/assets"));

var bundler = new Bundler("public/index.html", {
  cache: true,
  minify: false,
  target: "browser",
  watch: process.env.NODE_ENV !== "production"
});

app.use("/", bundler.middleware());

var player_number = 0;
var room = {}
room[0] = 0;
var room_number = 0;
var turn = 'g';
var players = {};//this object keep track of all the players that are currently in the game. 
var num_of_players_ready = {};
var dots = 256;
//updated the server to render our static files using express.static built-in middleware function in Express.

//had the server start listening on port 8081
const port = process.env.PORT || 3000;

//=====================================================================================================
//the port to listen
server.listen(port, function () {
  console.log(`Listening on localhost:${server.address().port}`);
});

//=====================================================================================================
//logic to listen for connections and disconnections.
io.on('connection', (socket) => {
  socket.on('update_server_for_disconnected_client', function (player_num) {
    console.log('user disconnected', player_num);
    delete players[player_num];
    socket.broadcast.emit('change_other_player_status', false);
  });

  //=====================================================================================================
  socket.on('update_server_by_client_play_mode', function (is_client_in_single_player_mode) {
    if (is_client_in_single_player_mode === true) {
      turn = 'g';
    }
    if (turn == 'g') {
      turn = 'y';
      initialize(turn, room_number, player_number);
      socket.emit('update_client_for_initialize_info', turn, room_number, player_number);
    }
    else {
      turn = 'g';
      initialize(turn, room_number, player_number);
      socket.emit('update_client_for_initialize_info', turn, room_number, player_number);
    }
    if (is_client_in_single_player_mode === true) {
      room_number++;
    }
    else {
      if (room[room_number] == 1) {
        room[room_number]++;
        room_number++;
        room[room_number] = 0;
      }
      else {
        room[room_number]++;
      }
    }
    player_number++;
  });

  //=====================================================================================================
  // player ready for play and watit for other player
  socket.on('update_server_that_player_is_ready', function (room_num) {
    if (num_of_players_ready[room_num] === 1) {
      socket.broadcast.emit('change_other_player_status', room_num, true);
      socket.emit('change_other_player_status', room_num, true);
    }
    else {
      num_of_players_ready[room_num] = 1;
    }
  });

  //=====================================================================================================
  //update the other client that the ghost in the mastar moved
  socket.on('update_the_server_for_ghost_movment', function (room_num, ghostColor, x, y, veloX, veloY, velo) {
    socket.broadcast.emit('update_the_client_for_ghost_movment', room_num, ghostColor, x, y, veloX, veloY, velo);
  });

  //=====================================================================================================
  //update the other client that the pacman moved
  socket.on('update_the_server_for_pacman_position', function (room_num, x, y, veloX, veloY, velo, angle) {
    socket.broadcast.emit('update_the_client_for_pacman_position', room_num, x, y, veloX, veloY, velo, angle);
  });

  //=====================================================================================================
  // update score in the other side and remove the dot on the screen
  socket.on('update_server_for_score', function (room_num, new_score, t, tileX, tileY) {
    dots--;
    socket.broadcast.emit("RemoveDot", room_num, t, tileX, tileY, new_score, dots);
  });

  //=====================================================================================================
  //no more life update for game over
  socket.on('update_server_for_game_over', function (room_num) {
    socket.broadcast.emit("update_client_for_game_over", room_num);
    socket.emit("update_client_for_game_over", room_num);
  });

  //=====================================================================================================
  // update the other client that pac lost life
  socket.on('update_server_pac_lost_life', function (room_num, t) {
    socket.broadcast.emit("update_client_pac_lost_life", room_num, t);
  });

  //=====================================================================================================
  // update the other client that pac lost life and move to question scene
  socket.on('update_server_for_eating_power_dot', function (room_num, data, x, y) {
    let answers = [];
    for (let i = 0; i < 3; i++) {
      answers.push(data.results[0].incorrect_answers[i]);
    }
    answers.push(data.results[0].correct_answer)
    answers.sort(() => Math.random() - 0.5);
    socket.broadcast.emit('update_client_for_eating_power_dot', room_num, data.results[0].question, JSON.stringify(answers), data.results[0].correct_answer, x, y);
    socket.emit('update_client_for_eating_power_dot', room_num, data.results[0].question, JSON.stringify(answers), data.results[0].correct_answer, x, y);
  });
});
// initialize new player
function initialize(turn, room_num, player_number) {
  players[player_number] = {
    room_number: room_num,
    t: turn,
  };
}

//=====================================================================================================
//handle post request with "/update_score" path. the function get user name and score in request body and write them
// to scores.JSON file.
router.post("/update_score", (req, res) => {
  const body = req.body;
  console.log('Path of file in parent dir:', require('path').resolve(__dirname, '../app.js'));
  const content = fs.readFileSync("./scores.JSON");
  const users = JSON.parse(content);
  users.items.push(body)
  fs.writeFileSync("scores.JSON", JSON.stringify(users));
})

//=====================================================================================================
//handle post request with "/register" path. get user name and password check if exist in system.
//if the user exist in the system return 302 else return 201.
router.post("/register", (req, res) => {
  const body = req.body;

  const content = fs.readFileSync("./UserRegister.JSON");
  var name = body['Name'];
  var pass = body['Pass'];
  var ret = _isContains(content, name, pass);
  if (ret === "same_user" || ret === "confirm") {
    res.status(302).send("registered");
  } else {
    res.status(201).send("not registered");
    const users = JSON.parse(content);
    users.items.push(body);
    fs.writeFileSync("UserRegister.JSON", JSON.stringify(users));
  }
})

//=====================================================================================================
//handle post request with "/login" path. get user name and password check if user name and password confirmed.
//if the user confirmed return 302 else return 201.
router.post("/login", (req, res) => {
  const body = req.body;
  console.log(req.body);
  const content = fs.readFileSync("./UserRegister.JSON");
  var name = body['Name'];
  var pass = body['Pass'];
  var ret = _isContains(content, name, pass);
  if (ret === "confirm") {
    res.status(302).send("exist");
  } else {
    res.status(201).send("does not exist");
  }
})

//=====================================================================================================
//handle post request with "/get_json" path. return the content of scores.JSON file. 
router.get("/get_json", (req, res) => {
  const content = fs.readFileSync("./scores.JSON");
  let obj = JSON.parse(content);
  res.json(obj);
})

//=====================================================================================================
//this function check if user name and password confirmed.
//if user name and password are confirmed return "confirm", else, if user name exist in system return "same_user"
// else return "new_user".
function _isContains(json, name, pass) {
  //var data = fs.readFileSync('./UserRegister.JSON');
  var json_data = JSON.parse(json);
  //var json_str = JSON.stringify(json_data);
  for (var i = 0; i < json_data.items.length; i++) {
    var user = json_data.items[i];
    if (user['Name'] === name) {
      var same_user = true;
      if (user['Pass'] === pass) {
        return "confirm";
      }
      return "same_user"
    }
  }
  return "new_user";
}