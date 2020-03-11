import { layer_for_ghosts } from "./game"

//this class represents a ghost in the game
export default class Ghost {
    constructor(image, game) {
        this.game = game;
        this.image = image;
        //definition of directions to go for the ghosts
        this.left = 1;
        this.right = 3;
        this.up = 2;
        this.down = 0;
        //for fixing the position
        this.modX = 0;
        this.modY = 0;
        this.vulnerable = false;
        this.prev_direction = this.down;
        //defining the  ghost sprite cofiguration
        var config2 = {
            key: image,
            frames: game.anims.generateFrameNumbers(image, { start: 0, end: 3, first: 0 }),
            frameRate: 5,
            repeat: -1
        };
        //creating an animation of the ghost   
        game.anims.create(config2);
        //our game with the sprite
        this.ghost = game.physics.add.sprite(300, 625, image);
        //playing the animation of the ghost moving
        this.ghost.anims.play(image);
    }
    //=====================================================================================================
    //return ghost sprite
    getGhostImg() {
        return this.ghost;
    }
    //=====================================================================================================
    // fix the position for the ghost to enter the right row / col
    fix_position(need_to_fix_x, need_to_fix_y) {
        if (need_to_fix_y) {
            this.modY = (this.ghost.y % 12);
            if (this.modY > 6) {
                this.ghost.y = this.ghost.y + (12 - this.modY);
            }
            else {
                this.ghost.y = this.ghost.y - this.modY;
            }
        }
        if (need_to_fix_x) {
            this.modX = (this.ghost.x % 12);
            if (this.modX > 6) {
                this.ghost.x = this.ghost.x + (12 - this.modX);
            }
            else {
                this.ghost.x = this.ghost.x - this.modX;
            }
        }
    }
    //=====================================================================================================
    //ghosts movenent
    move(secTime) {
        var dirrection
        // the current_tile tile
        const current_tile = layer_for_ghosts.getTileAtWorldXY(this.ghost.x, this.ghost.y, true);
        if (current_tile == null) {
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
        }
        //pass to the other side of the screen
        if (current_tile.x == 27 && current_tile.y == 14) {
            this.ghost.x = 400;
            this.ghost.y = 312;
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
        }
        else if (current_tile.x == 0 && current_tile.y == 14) {
            this.ghost.x = 843;
            this.ghost.y = 312;
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
        }
        //cant go down to the cage again
        else if (current_tile.x == 14 && current_tile.y ==11) {
            dirrection = [
                { wall: layer_for_ghosts.getTileAt(current_tile.x, current_tile.y - 1), direction: this.up },
                { wall: layer_for_ghosts.getTileAt(current_tile.x + 1, current_tile.y), direction: this.right },
                { wall: layer_for_ghosts.getTileAt(current_tile.x - 1, current_tile.y), direction: this.left },
            ]
        }
        else {
            dirrection = [
                { wall: layer_for_ghosts.getTileAt(current_tile.x, current_tile.y - 1), direction: this.up },
                { wall: layer_for_ghosts.getTileAt(current_tile.x, current_tile.y + 1), direction: this.down },
                { wall: layer_for_ghosts.getTileAt(current_tile.x + 1, current_tile.y), direction: this.right },
                { wall: layer_for_ghosts.getTileAt(current_tile.x - 1, current_tile.y), direction: this.left }
            ]
        }
        // cant go back from where you come and cant go to the wall direction
        dirrection = dirrection.filter(tmp => tmp.wall.isInteresting(true, false) == false)
            .filter(tmp => this.prev_direction != (tmp.direction + 2) % 4)
        // rand the available direction
        var rand = Math.floor(Math.random() * dirrection.length);
        rand = dirrection[rand].direction;
        this.prev_direction = rand;
        // timer for the ghost to go out the cage in diff time
        if (this.image == "green") {
            if (secTime < 2) {
                rand = this.up;
            }
        }
        else if (this.image == "pink") {
            if (secTime < 2) {
                return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
            }
            if (secTime >= 2 && secTime <= 4) {
                rand = this.up;
            }
        }
        else if (this.image == "red") {
            if (secTime < 4) {
                return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
            }
            if (secTime >= 4 && secTime <= 6) {
                rand = this.up;
            }
        }
        else if (this.image == "purple") {
            if (secTime <= 6) {
                return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": false, "velo": 0 }
            }
            if (secTime > 6 && secTime < 8) {
                6
                rand = this.up;
            }
        }
        var velo = 60;
        // move the direction
        if ((rand == this.left)) {
            this.ghost.setVelocityX(-velo);
            this.ghost.setVelocityY(0);
            this.fix_position(false, true);
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": true, "veloY": false, "velo": -velo }
        }
        if ((rand == this.right)) {
            this.ghost.setVelocityX(velo);
            this.ghost.setVelocityY(0);
            this.fix_position(false, true);
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": true, "veloY": false, "velo": velo }
        }
        if ((rand == this.up)) {
            this.ghost.setVelocityY(-velo);
            this.ghost.setVelocityX(0);
            this.fix_position(true, false);
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": true, "velo": -velo }
        }
        if (rand == this.down) {
            this.ghost.setVelocityY(velo);
            this.ghost.setVelocityX(0);
            this.fix_position(true, false);
            return { "x": this.ghost.x, "y": this.ghost.y, "veloX": false, "veloY": true, "velo": velo }
        }
    }
    //=====================================================================================================
    //positioning the ghosts when starting the game
    gameStart() {
        this.ghost.destroy();
        this.ghost = this.game.physics.add.sprite(625, 300, this.image);
        this.ghost.anims.play(this.image);
        this.game.physics.add.collider(this.ghost, layer_for_ghosts);
    }
    //=====================================================================================================
    //echo the "master" pacman
    setPosition(x, y, is_veloX, is_veloY, velo) {
        this.ghost.x = x;
        this.ghost.y = y;
        if (is_veloX) {
            this.ghost.setVelocityY(0);
            this.ghost.setVelocityX(velo);
        }
        if (is_veloY) {
            this.ghost.setVelocityY(velo);
            this.ghost.setVelocityX(0);
        }
    }
    //=====================================================================================================
    getPosition() {
        return { "x": this.ghost.x, "y": this.ghost.y }
    }
    //=====================================================================================================
    is_vulnerable() {
        return this.vulnerable;
    }
    //=====================================================================================================
    set_vulnerable(vulnerablity) {
        this.vulnerable = vulnerablity;
    }
}