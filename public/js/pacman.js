import { layer_for_pacman } from "./game"
//this class represents pacman in the game
export default class Pacman {
    constructor(x, y, image, game) {
        //for fix the direction
        this.modX = x;
        this.modY = y;

        this.game = game;
        this.image = image;
        //defining the pacman sprite cofiguration
        this.config = {
            key: image,
            frames: this.game.anims.generateFrameNumbers(image, { start: 0, end: 2, first: 0 }),
            frameRate: 10,
            repeat: -1
        };
        //creating an animation of the pacman
        this.game.anims.create(this.config);
        //our game with the sprite
        this.pac = game.physics.add.sprite(x, y, image);
        this.pac.anims.play(image);

    }
    //=====================================================================================================
    //return pacman sprite
    getPacImg() {
        return this.pac;
    }
    //=====================================================================================================
    // fix the position for the pac to enter the right row / col
    fix_position(need_to_fix_x, need_to_fix_y) {
        if (need_to_fix_y) {
            this.modY = (this.pac.y % 12);
            if (this.modY > 6) {
                this.pac.y = this.pac.y + (12 - this.modY);
            }
            else {
                this.pac.y = this.pac.y - this.modY;
            }
        }
        if (need_to_fix_x) {
            this.modX = (this.pac.x % 12);
            if (this.modX > 6) {
                this.pac.x = this.pac.x + (12 - this.modX);
            }
            else {
                this.pac.x = this.pac.x - this.modX;
            }
        }
    }
    //=====================================================================================================
    //pacman moves according to the key that was pressed
    move(cursors) {
        //for geting to the other side
        const current_tile = layer_for_pacman.getTileAtWorldXY(this.pac.x, this.pac.y, true);
        if (current_tile.x == 27 && current_tile.y == 14) {
            this.pac.x = 420;
            this.pac.y = 312;
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": false, "is_veloY": false,
                "velo": 0, "angle": this.pac.angle
            }
        }
        else if (current_tile.x == 0 && current_tile.y == 14) {
            this.pac.x = 830;
            this.pac.y = 312;
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": false, "is_veloY": false,
                "velo": 0, "angle": this.pac.angle
            }
        }
        //pacman's velocity when reacting to key pressed
        var velo = 75;
        //pacman goes left 
        if (cursors.left.isDown) {
            this.pac.setVelocityX(-velo);
            this.pac.setVelocityY(0);
            this.pac.angle = 180;
            this.fix_position(false, true);
            if (this.pac.y == 108)
                this.pac.y = 105
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": true, "is_veloY": false,
                "velo": -velo, "angle": this.pac.angle
            };
        }
        //pacman goes right
        else if (cursors.right.isDown) {
            this.pac.setVelocityX(velo);
            this.pac.setVelocityY(0);
            this.pac.angle = 0;
            this.fix_position(false, true);
            if (this.pac.y == 108)
                this.pac.y = 105
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": true, "is_veloY": false,
                "velo": velo, "angle": this.pac.angle
            };
        }
        //pacman goes up
        else if (cursors.up.isDown) {
            this.pac.setVelocityX(0);
            this.pac.setVelocityY(-velo);
            this.pac.angle = 270;
            this.fix_position(true, false);
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": false, "is_veloY": true,
                "velo": -velo, "angle": this.pac.angle
            };
        }
        //pacman goes down 
        else if (cursors.down.isDown) {
            this.pac.setVelocityX(0);
            this.pac.setVelocityY(velo);
            this.pac.angle = 90;
            this.fix_position(true, false);
            return {
                "x": this.pac.x, "y": this.pac.y, "is_veloX": false, "is_veloY": true,
                "velo": velo, "angle": this.pac.angle
            };
        }
        return {
            "x": this.pac.x, "y": this.pac.y, "is_veloX": false, "is_veloY": false,
            "velo": 0, "angle": this.pac.angle
        };

    }
    //=====================================================================================================
    //positioning pacman when starting the game
    gameStart() {
        this.pac.destroy();
        //creating an animation of the pacman
        this.game.anims.create(this.config);
        //our game with the sprite
        this.pac = this.game.physics.add.sprite(630, 360, this.image);
        //playing the animation of pacman moving
        this.pac.anims.play(this.image);
        //defining collision between pacman and the tilemap,first layer
        this.game.physics.add.collider(this.pac, layer_for_pacman);
    }
    //=====================================================================================================
    // for echo from the other pacman
    setPosition(x, y, is_veloX, is_veloY, velo, angle) {
        this.pac.x = x;
        this.pac.y = y;
        this.pac.angle = angle;
        if (is_veloX) {
            this.pac.setVelocityY(0);
            this.pac.setVelocityX(velo);
        }
        if (is_veloY) {
            this.pac.setVelocityY(velo);
            this.pac.setVelocityX(0);
        }
    }
}