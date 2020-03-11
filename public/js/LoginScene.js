import Phaser from 'phaser';
import { QuestionScene } from "./questionScene";
import { GameOver } from "./gameOver";
import { GameScene } from "./game";
import { menuScene } from "./menuScene";

export class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: "login_scene_key" }); // login scene key
    }

    //=====================================================================================================
    preload() {
        //load html page and background image
        this.load.html("login_page", "/assets/dom/html/new_index.html");
        this.load.image('pic', 'assets/Webp.net-resizeimage.jpg');
    }

    //=====================================================================================================
    create() {
        //add html page and background image
        const { centerX, centerY } = this.cameras.main;
        this.add.image(centerX, centerY, 'pic');
        var page = this.add.dom(centerX, (centerY + 150)).createFromCache('login_page');

        //get the user name and password fields from login div 
        var inputUsername = page.getChildByName('username');
        var inputPassword = page.getChildByName('password');

        //get login button from html page
        var login_button = page.getChildByID("loginButton");

        //when login button clicked send user name and password to "login" function
        login_button.addEventListener('click', function () {
            var obj = { 'Name': inputUsername.value, 'Pass': inputPassword.value };
            login(obj);
        }, false);


        //get the user name and password fields from register div 
        var regInputUsername = page.getChildByName('reg_username');
        var regInputPassword = page.getChildByName('reg_password');

        //get login button from html page
        var register_button = page.getChildByID("registerButton");

        //when register button clicked send user name and password to "register" function
        register_button.addEventListener('click', function () {
            var obj = { 'Name': regInputUsername.value, 'Pass': regInputPassword.value };
            register(obj);
        }, false);

        // get the "to register" button
        var to_reg = page.getChildByID("to_reg");

        // when "to register" button clicked the switch visible between login div and register div
        to_reg.addEventListener('click', function () {
            switchVisible();
        }, false);

        // get the "to login" button
        var to_log = page.getChildByID("to_log");
        to_log.addEventListener('click', function () {
            switchVisible();
        }, false);
    }
}

//=====================================================================================================
// this function send post request to server, and put the user name and password in the body of the request
function login(obj) {
    fetch("/app/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
    }).then(res => {
        //if the server return status 302 it means that the user and password confirmed
        if (res.status === 302) {
            var user = { "player_name": obj['Name'] };
            game.scene.stop("login_scene_key");
            game.scene.start("menu_scene_key", user);
        }

        // if the server return status 201 it means that this user or password are incorrect
        if (res.status === 201) {
            alert("The user doesn't exist in the system");
        }
        return res.json();
    }).then(data => {
        console.log(data);
    }).catch(err => {
    });
}

//=====================================================================================================
// this function send post request to server, and put the user name and password in the body of the request
function register(obj) {
    fetch("/app/register", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
    }).then(res => {
        //if the server return status 302 it means that the user is already in the system
        if (res.status === 302) {
            alert("The user is already registered in the system");
        }

        // if the server return status 201 it means that the user is new 
        if (res.status === 201) {
            var user = { "player_name": obj['Name'] };
            game.scene.stop("login_scene_key");
            game.scene.start("menu_scene_key", user);
        }

        return res.json();
    }).then(data => {
        console.log(data);
    }).catch(err => {
        console.log(err);
    });
}

//=====================================================================================================
//this function switch visible between login div and register div
function switchVisible() {
    if (document.getElementById('log')) {
        //if login div is not visible
        if (document.getElementById('log').style.display == 'none') {
            document.getElementById('log').style.display = 'block';
            document.getElementById('reg').style.display = 'none';
        } else { //if login div is visible
            document.getElementById('log').style.display = 'none';
            document.getElementById('reg').style.display = 'block';
        }
    }
}

//=====================================================================================================
//the configr for the game
var config = {
    type: Phaser.AUTO,
    parent: 'body',
    width: 1300,
    height: 600,
    scene: [LoginScene, menuScene, GameScene, QuestionScene, GameOver],
    dom: { createContainer: true },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
};
//=====================================================================================================
//the game object
export var game = new Phaser.Game(config);
