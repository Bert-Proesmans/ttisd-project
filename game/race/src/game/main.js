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
    },
    create: function(){
        this.background = this.add.tileSprite(0,0, this.world.width, this.world.height, 'bg');
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.player = this.add.sprite(0,0,'blue_car');
        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;
        this.player.reset(this.world.width / 4, this.world.centerY);

    },
    update: function(){

        let cursors = this.input.keyboard.createCursorKeys();
        //  Reset the player, then check for movement keys
        this.player.body.velocity.setTo(0, 0);

        if (cursors.left.isDown)
        {
            this.player.body.velocity.x = -200;
        }
        else if (cursors.right.isDown)
        {
            this.player.body.velocity.x = 200;
        }
        else if(cursors.down.isDown){
            this.player.body.velocity.y = 200;
        }
        else if(cursors.up.isDown){
            this.player.body.velocity.y = -200;
        }
    },
    gas: function() {
        this.player.body.velocity.y = -GAS;
    
    }
};

var game = new Phaser.Game(
    320,
    568,
    Phaser.AUTO,
    'game',
    state
);



