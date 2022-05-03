// This section contains some game constants
var GAME_WIDTH = 975;
var GAME_HEIGHT = 554;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 8;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

var High_Score = 0;
var Start_game = 0;
var lives = 3;
var game_over = 0;
var level = 1;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var UP_ARROW_CODE = 38;
var DOWN_ARROW_CODE = 40;
var ENTER_CODE = 13;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';
var MOVE_UP = 'up';
var MOVE_DOWN = 'down';

// Preload game images
var images = {};
['enemy.png','stars.png', 'player.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});



class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

class Enemy extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}


class Player extends Entity{
    constructor() {
        super();
        this.x = 6 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
        else if (direction === MOVE_UP && this.y > PLAYER_HEIGHT) {
            this.y = this.y - PLAYER_HEIGHT;
        }
        else if (direction === MOVE_DOWN && this.y < GAME_HEIGHT - 2*PLAYER_HEIGHT) {
            this.y = this.y + PLAYER_HEIGHT;
        }
    }  
}





/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (!(enemySpot+1) || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === UP_ARROW_CODE) {
                this.player.move(MOVE_UP);
            }
            else if (e.keyCode === DOWN_ARROW_CODE) {
                this.player.move(MOVE_DOWN);
            }
            else if (e.keyCode === ENTER_CODE){
                if(game_over){
                    lives = 3;
                }
                Start_game = 1;
                this.score = 0;
                this.player.x = 6 * PLAYER_WIDTH;
                this.player.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
                MAX_ENEMIES = 8;
                level = 1;
                if(game_over === 1 || Start_game === 0){
                    this.gameLoop();
                }
                game_over = 0;
                
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */

    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        if(Start_game != 0 || game_over != 1){
            this.score += timeDiff;

            // Call update on all enemies
            this.enemies.forEach(enemy => enemy.update(timeDiff));
        }
        
        

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        
        if(Start_game != 0 || game_over != 1){
            this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
            this.player.render(this.ctx); // draw the player
        }

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();
        

        // Check if player is dead
        if ((Start_game != 0) && (this.isPlayerDead())) {
            // If they are dead, then it's game over!
            game_over = 1;
            this.ctx.drawImage(images['stars.png'], 0, 0);
            this.ctx.font = 'bold 50px Impact';
            this.ctx.fillStyle = '#ffffff';
            if(this.score > High_Score){
                High_Score = this.score;
                this.ctx.fillText('New High Score!', 370, 200);
            } else {
                this.ctx.fillText('Game Over', 370, 200);
            }
            this.ctx.fillText('Score: ' + this.score, 370, 250);
            this.ctx.fillText('High Score: ' + High_Score, 370, 300)
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillText('Press enter to play again', 370, 350);
            this.ctx.drawImage(images['Explosion.gif'], 0, 0);
            
        }
        else{
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            if(Start_game != 0){
                this.ctx.fillText('Score: ' + this.score, 5, 30);
                if(this.score > 50000){
                    MAX_ENEMIES = 13;
                    level = 6;
                }
                else if(this.score > 40000){
                    MAX_ENEMIES = 12;
                    level = 5;
                }
                else if(this.score > 30000){
                    MAX_ENEMIES = 11;
                    level = 4;
                }
                else if(this.score > 20000){
                    MAX_ENEMIES = 10;
                    level = 3;
                }
                else if(this.score > 10000){
                    MAX_ENEMIES = 9
                    level = 2;
                }
                
                if(High_Score < this.score){
                    High_Score = this.score;
                }
                this.ctx.fillText('High Score: ' + High_Score, 5, 60);
                this.ctx.fillText('Level: ' + level, 5, 90);
                this.ctx.fillText('Lives Remaining: ' + lives, 740, 30);
            } else {
                this.ctx.fillText('Press Enter To Begin', 375, 300);
                this.ctx.font = 'bold 50px Impact';
                this.ctx.fillText('Exploding Kittens', 320, 250);

            }

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
       // TODO: fix this function!
       //Checks if the player is overlaping an enemy and ends game if they are
       var column = this.player.x/PLAYER_WIDTH;
       if((this.enemies[column]) && ((this.player.y + PLAYER_HEIGHT) <= (this.enemies[column].y + ENEMY_HEIGHT)) && (this.player.y >= this.enemies[column].y)){
           delete this.enemies[column];
           lives = lives - 1;
           if(lives <= 0){
            return true;
           }
           else {
            return false;
           }
           
       } else {
           return false;
       }
        
    }
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();

