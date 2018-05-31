/**
 *
 * This is a simple state template to use for getting a Phaser game up
 * and running quickly. Simply add your own game logic to the default
 * state object or delete it and make your own.
 *   
 */

var state = {
    init: function() {
        // Delete this init block or replace with your own logic.



    },
    updateText: function() {
        // Delete this init block or replace with your own logic.

        //this.text.setText(this.measured);

    },
    preload: function() {
        this.load.image('bg', 'assets/bg.png');
        this.load.image('boat', 'assets/boat.png');
        this.load.image('t17', 'assets/tile_17.png');
        this.load.image("window", "assets/grey_panel.png"); 
        this.cursors = this.input.keyboard.createCursorKeys()
        this.high = false
        this.measured = 0
        this.vel = 0
       
    
    },
    create: function(){
        this.physics.startSystem(Phaser.Physics.ARCADE);
      // State create logic goes here
    
      this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');
      this.backgroundRight = this.add.tileSprite(this.world.width - 40, 0, this.world.width - 40, this.world.height, 't17')
      this.player = this.add.sprite(20, 400, 'boat')
      this.player.scale.setTo(2.5, 2.5)
      this.player.angle += 270
      this.text = this.add.text(5, 5, String(this.measured))

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
    update: function() {
    
        let instruc = "pull"
        
        if(this.vel > 0){
            this.vel -= 1
        }
        if(this.high){
            // go to 0
            if(this.measured < 5){
                this.high = !this.high
                instruc = "push"
                this.vel = 100
            }
                
        }
        else if (!this.high){
            if(this.measured > 15){
                this.high = !this.high
                this.vel = 100
            }
            else {
                instruc = "push"
            }
        }

        if(this.cursors.down.isDown && this.measured > 0){
            this.measured -= 1
        }


        if(this.cursors.up.isDown && this.measured < 100){
            this.measured += 1
        }

        this.text.setText(this.measured + "             " + instruc);
        this.player.body.velocity.x = this.vel
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