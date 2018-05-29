var SPEED = 200;
var GRAVITY = 900;
var GAS = 42;
var wsConnection = null;
var lastInput = null;

var key1;
var key2;
var key3;
var key4;
var state = {
    preload: function () {
        // TODO; Reposition to dist folder for release
        // this.load.image("blue_car", "/dist/assets/car_blue_1.png");
        // this.load.image("bg", "/dist/assets/land_dirt12.png");
        this.load.image("blue_car", "/dist/assets/car_blue_1.png");
        this.load.image("bg", "/dist/assets/land_dirt12.png");
        this.load.image("obs1", "/dist/assets/mcycle.png");
        this.load.image("window", "/dist/assets/grey_panel.png");
        this.totalScore = 0;
        // Load websockets
        init();
    },
    create: function () {
        this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.player = this.add.sprite(0, 0, 'blue_car');
        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;
        this.player.reset(this.world.width / 4, this.world.centerY);
        this.camera.follow(this.player);

        this.scoreText = game.add.text(0, 0, "Score: 0", { align: "center" });

        this.time.events.repeat(Phaser.Timer.SECOND, 9999, this.generateObs, this);

        /*this.spr0 = this.add.sprite(this.world.randomX, 0, 'obs1');
        this.physics.arcade.enableBody(this.spr0);
        this.spr0.body.velocity.y = 150;*/

        this.obstacles = game.add.group();
        this.obstacles.enableBody = true;


        var spr0 = this.obstacles.create(this.world.randomX, 0, 'obs1');
        spr0.name = "obs" + 1;
        this.physics.arcade.enableBody(spr0);
        spr0.body.velocity.y = 150;

        game.input.onDown.add(this.stg, self);


    },
    collisionHandler: function (player, obs) {
        this.sprEnd = game.add.sprite(250, 300, 'window');
        this.txtEnd = game.add.text(310, 310, "Game over", { align: "center" });
        this.scoreEnd = game.add.text(310, 350, "Score:" + this.totalScore, { align: "center" })
        this.restartGameEnd = game.add.text(310, 390, "Restart", { align: "center" })
        this.sprEnd.scale.setTo(3, 2)


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

    },

    update: function () {
        // let cursors = this.cursors
        // let cursors = this.input.keyboard.createCursorKeys();
        //  Reset the player, then check for movement keys
        this.player.body.velocity.setTo(0, 0);


        if (lastInput) {
            this.player.body.velocity.x = -lastInput.speedLeft + lastInput.speedRight;
            this.player.body.velocity.y = lastInput.speedBackward + -lastInput.speedForward;
        }

        this.physics.arcade.overlap(this.player, this.obstacles, this.collisionHandler, null, this);

        //     if (cursors.left.isDown)
        //     {
        //         this.player.body.velocity.x = -200;
        //     }
        //      if (cursors.right.isDown)
        //     {
        //         this.player.body.velocity.x = 200;
        //     }
        //      if(cursors.down.isDown){
        //         this.player.body.velocity.y = 200;
        //     }
        //      if(cursors.up.isDown){
        //         this.player.body.velocity.y = -200;
        //     }
    },
    gas: function () {
        this.player.body.velocity.y = -GAS;
    },
    generateObs: function () {


        var obst = this.obstacles;
        var w = this.world
        var physics = this.physics;

        var i = 0;

        var spr0 = this.obstacles.create(this.world.randomX, 0, 'obs1');
        spr0.name = "obs" + this.world.randomX;
        this.physics.arcade.enableBody(spr0);
        spr0.body.velocity.y = 150;

        this.totalScore += 5;
        this.scoreText.setText("Score: " + this.totalScore);
    }

};

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

    logger({ dbg: true, action: "on_message", data: message });

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
            lastInput = {
                speedLeft: obj.data.ratioLeft * SPEED,
                speedRight: obj.data.ratioRight * SPEED,
                speedForward: obj.data.ratioForward * SPEED*2,
                speedBackward: obj.data.ratioBackward * SPEED,
            };
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



