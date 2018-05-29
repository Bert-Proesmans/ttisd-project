var SPEED = 200;
var GRAVITY = 900;
var GAS = 42;

var key1;
var key2;
var key3;
var key4;
var state = {
    preload: function(){
        this.load.image("blue_car", "/assets/car_blue_1.png");
        this.load.image("bg", "/assets/land_dirt12.png");
        this.load.image("obs1", "/assets/mcycle.png");
        this.load.image("window", "/assets/grey_panel.png");
        this.totalScore = 0;
    },
    create: function(){
        this.cursors = this.input.keyboard.createCursorKeys();
        this.background = this.add.tileSprite(0,0, this.world.width, this.world.height, 'bg');
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.player = this.add.sprite(0,0,'blue_car');
        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;
        this.player.reset(this.world.width / 4, this.world.centerY);
        this.camera.follow(this.player);
        
        this.scoreText = game.add.text(0, 0, "Score: 0", {align: "center"});
    
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
    collisionHandler : function(player, obs) {
 

        this.sprEnd = game.add.sprite(250, 300, 'window');
        this.txtEnd = game.add.text(310, 310, "Game over", {align: "center"});
        this.scoreEnd = game.add.text(310, 350, "Score:" + this.totalScore, {align: "center"})
        this.restartGameEnd = game.add.text(310, 390, "Restart", {align: "center"})
        this.sprEnd.scale.setTo(3, 2)

        
        this.game.paused = true;

     


        
     
        },
        stg : function(){
            if(this.game.paused === true){
                location.reload();
                
                //this.txtEnd.destroy();
                //this.sprEnd.destroy();
                //this.restartGameEnd.destroy();
                //this.scoreEnd.destroy()
            }

        },
        
    update: function(){
        
        let cursors = this.cursors
        //  Reset the player, then check for movement keys
        this.player.body.velocity.setTo(0, 0);
        

        if (cursors.left.isDown)
        {
            this.player.body.velocity.x = -200;
        }
         if (cursors.right.isDown)
        {
            this.player.body.velocity.x = 200;
        }
         if(cursors.down.isDown){
            this.player.body.velocity.y = 200;
        }
         if(cursors.up.isDown){
            this.player.body.velocity.y = -200;
        }
        this.physics.arcade.overlap(this.player, this.obstacles, this.collisionHandler, null, this);
    },
    gas: function() {
        this.player.body.velocity.y = -GAS;
    
    },
    generateObs: function(){
    
       
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



