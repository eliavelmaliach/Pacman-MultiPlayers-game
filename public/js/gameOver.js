import Phaser from 'phaser';
import {game} from './LoginScene';
import $ from 'jquery';


var user;
var score;
export class GameOver extends Phaser.Scene {
    constructor(){
        
        super({key: "Game_over_scene_key"});
    }

    init(data) {
        user = data.player;
        score = data.score;
        console.log(user);

    }
    preload() {

        this.load.html("HTML_score", '/assets/dom/html/score/score.html');
        this.load.image("game_over", '/assets/end_game.jpg')

    }
    create(){
        const { centerX, centerY } = this.cameras.main;
        this.add.image(centerX, centerY, 'game_over');
        this.updateTable();
        var element = this.add.dom(600, 50).createFromCache('HTML_score');
        
        var playAgainButton = element.getChildByID("PlayAgainButton");
        var logOutButton = element.getChildByID("logout");
        playAgainButton.addEventListener('click', function() {
            game.scene.stop("Game_over_scene_key");
            game.scene.start("menu_scene_key" );
          }, false);

          logOutButton.addEventListener('click', function() {
            game.scene.stop("Game_over_scene_key");
            game.scene.start("login_scene_key" );
          }, false);

    }
    updateTable(){
        getJson();
    }
}



function getJson() {
    fetch("/app/get_json", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(res=> {
        return res.json();
    }).then(data=> {
        var file = JSON.stringify(data.items);
        var scores = data.items.slice(",");
        scores.sort((a, b) => (a['Score'] > b['Score']) ? -1 : 1);
        for (var i = 0; i < scores.length; i++) {
            if (i < 5) {
                $('#name_index_' + i).html(scores[i]['Name']);
                $('#score_index_' + i).html(scores[i]['Score']);
            }
            if(scores[i]['Name'] === user && scores[i]['Score'] === score) {
                $('#current_player').html(user);
                $('#current_score').html(score);
                $('#current_rank').html(i);
            }

       }

    }).catch(err => {

    });
}
