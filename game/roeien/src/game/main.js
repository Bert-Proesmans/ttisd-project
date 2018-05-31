/**
 *
 * This is a simple state template to use for getting a Phaser game up
 * and running quickly. Simply add your own game logic to the default
 * state object or delete it and make your own.
 *   
 */
const POSITION_DOWN = 1;
const POSITION_UP = 0;
const TIMEOUT = 10; // # updates to wait before performing next movement
const VELOCITY = 70;

var wsConnection = null;
var lastAccel = null;

var state = {
    updateText: function () {
        // Delete this init block or replace with your own logic.

        //this.text.setText(this.measured);

    },
    preload: function () {
        // /dist comes from integration with the site
        this.load.image('bg', '/dist/assets/bg.png');
        this.load.image('boat', '/dist/assets/boat.png');
        this.load.image('t17', '/dist/assets/tile_17.png');
        this.load.image("window", "/dist/assets/grey_panel.png");
        this.cursors = this.input.keyboard.createCursorKeys();
        this.high = POSITION_DOWN;
        this.timeout = 0;
        this.vel = 0;
        this.instruction = "Push to get started";
        //this.game.paused = false;

        init();
    },
    create: function () {
        this.physics.startSystem(Phaser.Physics.ARCADE);
        // State create logic goes here

        this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');
        this.backgroundRight = this.add.tileSprite(this.world.width - 40, 0, this.world.width - 40, this.world.height, 't17');
        this.physics.enable(this.backgroundRight, Phaser.Physics.ARCADE);
        this.player = this.add.sprite(20, 400, 'boat');
        this.player.scale.setTo(2.5, 2.5);
        this.player.angle += 270;
        this.text = this.add.text(5, 5, String(this.measured));

        this.physics.arcade.enableBody(this.player);
        this.physics.arcade.enableBody(this.backgroundRight);
        this.physics.enable(this.player, Phaser.Physics.ARCADE);
        this.physics.enable(this.backgroundRight, Phaser.Physics.ARCADE); 
        game.input.onDown.add(this.stg, self);
    },
    collisionHandler: function () { 
        this.sprEnd = game.add.sprite(250, 300, 'window'); 
        this.txtEnd = game.add.text(310, 310, "You reached the other side!", { align: "center" }); 
        this.restartGameEnd = game.add.text(310, 390, "Click to restart game", { align: "center" }) 
        this.sprEnd.scale.setTo(4, 4) 
 
 
        this.game.paused = true; 
    }, 
    stg: function () {
        if (this.game.paused === true) {
            location.reload();

            //this.txtEnd.destroy();
            //this.sprEnd.destroy();
            //this.restartGameEnd.destroy();
            //this.scoreEnd.destroy()
        }
        else{
            console.log("Not ending")
        }

    },
    update: function () {
        this.timeout -= 1;
        // logger({ timeout: this.timeout });

       
 
        if (lastAccel > 0) {
            lastAccel = 0;
            this.instruction = "";
            if (this.timeout <= 0) { // Allow velocity reset
                this.vel = VELOCITY;
                this.timeout = TIMEOUT;
            } else {
                this.instruction = "Too fast, slow down!";
            }

            if (this.high == POSITION_DOWN) {
                this.high = POSITION_UP;
                this.instruction += "\tpull";
            } else {
                this.high = POSITION_DOWN;
                this.instruction += "\tpush";
            }
        }

        // Decrease velocity every update.
        if (this.vel > 0) {
            this.vel -= 1;
        }

        /*
        if (this.high) {
            // go to 0
            if (this.measured < 5) {
                this.high = !this.high;
                instruc = "push";
                this.vel = 100;
            }

        }
        else if (!this.high) {
            if (this.measured > 15) {
                this.high = !this.high;
                this.vel = 100;
            }
            else {
                instruc = "push";
            }
        }

        if (this.cursors.down.isDown && this.measured > 0) {
            this.measured -= 1;
        }


        if (this.cursors.up.isDown && this.measured < 100) {
            this.measured += 1;
        }
        */

        this.text.setText(this.instruction);
        this.player.body.velocity.x = this.vel;

        this.physics.arcade.collide(this.player, this.backgroundRight, this.collisionHandler, null, this); // check collission 
    }
}


var game = new Phaser.Game(
    800,
    800,
    Phaser.AUTO,
    'game',
    state
);

function logger(data) {
    console.log(data);
}

function init_ws() {
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    var wsUrl = 'wss://' + location.hostname + (location.port ? ':' + location.port : '');
    // var wsUrl = 'wss://192.168.16.119:3000';
    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = ws_on_open;
    wsConnection.onerror = ws_on_error;
    wsConnection.onmessage = ws_on_message;
}

function ws_on_open() {
    wsConnection.send("ANNOUNCE: VIEW");
    logger({ message: "WS opened" });
}

function ws_on_error(error) {
    // Just print to console
    logger(error);
}

function ws_on_message(message) {
    // Delegate string command
    if (typeof message.data !== 'string') {
        logger({ message: "Unrecognized message type", type: typeof message.data });
        return;
    }

    // logger({ dbg: true, action: "on_message", data: message });

    switch (message.data) {
        case "PING":
            logger({ operation: "PING" });
            wsConnection.send(JSON.stringify({ status: "OK" }));
            break;
        // default:
        //     logger({ message: "Unrecognized command", command: message.data });
        //     break;
    }

    // Message could be JSON-encoded payload
    var obj;
    try {
        obj = JSON.parse(message.data);
        if (!obj.type)
            throw new SyntaxError("No type key found");
    } catch (e) {
        logger({ message: "Failed to parse message", error: e });
        return;
    }

    switch (obj.type) {
        case "RUNNING":
            // logger({ event: "RUNNING", acceleration: obj.data.acceleration });
            if (obj.data.acceleration > 0) {
                lastAccel = obj.data.acceleration;
            }
            break;
    }
}

function init() {
    "use strict";
    init_ws();

    /**
     * This method is optional. If the server wasn't able to
     * respond to the in 3 seconds then show some error message 
     * to notify the user that something is wrong.
     */
    var intervalId = null;
    intervalId = setInterval(function () {
        if (wsConnection.readyState !== 1) {
            alert('Health check of websocket failed, shutting down');
            logger({ message: "WebSocket was in error state, closing down" });
            clearInterval(intervalId);
            //
            wsConnection = null;
        }
    }, 3000);

    /*
     * Send new values every 50 ms.
     */
    // setInterval(function () {
    //     var buffer = new Float32Array(3);
    //     buffer[0] = Sensor.getX();
    //     buffer[1] = Sensor.getY();
    //     buffer[2] = Sensor.getZ();
    //     // 
    //     connection.send(buffer);
    //     // console.log(Array.apply([], new Uint8Array(buffer.buffer)).join(","));
    // }, 50);
}