import Phaser from 'phaser';
import { game } from './LoginScene'
import $ from 'jquery';

export class menuScene extends Phaser.Scene {
    constructor(){
        super({key: "menu_scene_key"});
    }

    init(data) {
      this.player_name = data.player_name;
    }

    preload() {
        this.load.html("mode_menu", "/assets/dom/html/modeMenu.html");
        this.load.image("pic_menu", "/assets/orange_back.jpg");
        this.load.audio('intro_audio', ['assets/audio/pacman_beginning.wav']);

    }

    create(){
        const { centerX, centerY } = this.cameras.main;
        this.add.image(600, 500, 'pic_menu');
        var menu = this.add.dom(centerX-(540/3), centerY).createFromCache('mode_menu');
        printPlayerName(this.player_name);
        var single_player_button = menu.getChildByID("single_layer_button");
        var multi_player_button = menu.getChildByID( "multi_player_button");
        var score_button = menu.getChildByID("score_button")
        var music;
        var name = this.player_name;
       multi_player_button.addEventListener('click',function(){
         var mode = "multi_player_mode"
         singleMultiButton(name, mode);
        
        }, false);
          
          single_player_button.addEventListener('click', function() {
            var mode = "single_player_mode";
            singleMultiButton(name, mode);
          }, false);

          score_button.addEventListener('click', function(){
            ScoreButton();
          }, false);

          music = this.sound.add('intro_audio');
          music.play();
    }
}


function printPlayerName(name) {
  $('#welcome').html('welcome ' + name + '!');
}


function singleMultiButton(name, mode) {
  var data = { "mode": mode, "player_name": name }
  game.scene.stop("menu_scene_key");
  game.scene.start("Game_scene_key", data);
}

function ScoreButton(){
  game.scene.stop("menu_scene_key");
  game.scene.start("Game_over_scene_key");
}