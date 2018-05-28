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
        this.load.image("obs1", "/assets/oil.png");
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
       
 
        /*this.spr0 = this.add.sprite(this.world.randomX, 0, 'obs1');
        this.physics.arcade.enableBody(this.spr0);
        this.spr0.body.velocity.y = 150;*/

        this.obstacles = game.add.group();
        this.obstacles.enableBody = true;
        

        var spr0 = this.obstacles.create(this.world.randomX, 0, 'obs1');
        spr0.name = "obs" + 1;
        this.physics.arcade.enableBody(spr0);
        spr0.body.velocity.y = 150;
        this.physics.arcade.overlap(this.player, this.obstacles, this.collisionHandler, null, this);

    },
    collisionHandler : function(player, obs) {
        obs.kill();
        alert("ICI");
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
    },
    gas: function() {
        this.player.body.velocity.y = -GAS;
    
    },
    generateObs: function(){
      
       
        var obst = this.obstacles;
        var w = this.world
        var physics = this.physics;

        var i = 0;
        
            /*var spr0 = obst.create(w.randomX, 0, 'obs1');
            spr0.name = "obs" + w.randomX;
            physics.arcade.enableBody(spr0);
            spr0.body.velocity.y = 150;
            spr0.outOfBoundsKill = true;*/
          


    }
  
};

var game = new Phaser.Game(
    500,
    568,
    Phaser.AUTO,
    'game',
    state
);



