window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

module Drawing {
    export class Sprite {
        public x : number;
        public y : number;
        public width : number;
        public height : number;

        constructor(x : number, y : number, width : number, height : number) {
            this.setPosition(x, y);
            this.setDimensions(width, height);
        }

        setPosition(x : number, y : number) {
            this.x = x || 0;
            this.y = y || 0;
        }

        setDimensions(width : number, height : number) {
            this.width = width || 0;
            this.height = height || 0;
        }

        draw(context) {

        }
    }

    export class Paddle extends Sprite {
        COLOR : string = "#fff";
        public static PADDLE_HEIGHT : number = 75;
        public static PADDLE_WIDTH : number = 20;

        constructor(x : number, y : number) {
            super(x, y, Paddle.PADDLE_WIDTH, Paddle.PADDLE_HEIGHT);
        }

        draw(context) {
            super.draw();
            context.fillStyle = this.COLOR;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

module Models {
    export class GameObject {
        x : number;
        y : number;
        width : number;
        height : number;
        sprite : Drawing.Sprite;

        constructor(x : number, y : number, width : number, height : number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        move(x : number, y : number) {
            this.x += x;
            this.y += y;

            this.sprite.setPosition(this.x, this.y);
        }

        setSprite(sprite : Drawing.Sprite) {
            if(sprite !== null){
                this.sprite = sprite;
            }
        }

        public getSprite() : Drawing.Sprite {
            return this.sprite;
        }

        public bottom() : number {
            return this.y + this.height;
        }

        public right() : number {
            return this.x + this.width;
        }

        update() {
        }
    }

    export class Player extends GameObject {
        MIN_Y : number = 2;
        VELOCITY : number =  500;

        constructor() {
            super(0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(2,2);


            $(document).bind('keypress.a', function(){
                var moveDistance = that.getDistance();
                var move = (that.y - moveDistance < that.MIN_Y) ? 0 : -moveDistance;
                that.move(0, move);
            });

            $(document).bind('keypress.s', function(){
                var moveDistance = that.getDistance();
                var move = (that.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance;
                that.move(0, move);
            });
        }

        getDistance() : number {
            return (Game.getElapsedTime() / 1000) * this.VELOCITY;
        }
    }

    export class Opponent extends GameObject {

        constructor() {
            super(0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(Game.CANVAS_WIDTH-Drawing.Paddle.PADDLE_WIDTH - 1,2);
        }
    }

    export class ObjectRepository {
        static instance : ObjectRepository;
        objects : GameObject[];

        public static getInstance() : ObjectRepository {
            if(ObjectRepository.instance == null){
                ObjectRepository.instance = new ObjectRepository();
            }

            return ObjectRepository.instance;
        }

        constructor() {
            this.objects = [];
        }

        public addObject(object : GameObject) {
            if(object == null) return;

            this.objects.push(object);

            return this;
        }

        public getObjects() {
            return this.objects;
        }
    }
}

class GameServerConnection {

    static connect(gameId, nickname) {
        this.socket = io.connect('http://localhost:8000');
        this.socket.on('message', function(message){
            console.log(message);
        });

        this.socket.emit('message', {
            action : 'connectToGame',
            data : {
                nickname : nickname,
                gameId : gameId
            }
        });
    }
}

module Game {
    export var CANVAS_WIDTH : number = $("#canvas").width();
    export var CANVAS_HEIGHT : number = $("#canvas").height();

    var context,
        lastTime,
        currentTime,
        elapsedTime : number = 0;

    export function getElapsedTime(){
        return elapsedTime;
    }

    export function init(gameId, nickname) {
        var objectRepo = Models.ObjectRepository.getInstance();
        
        context = $("#canvas")[0].getContext("2d");
        GameServerConnection.connect(gameId, nickname);
    }

    run() {
        lastTime = currentTime = Date.now();
        requestAnimFrame(runLoop);

        function runLoop(){
            lastTime = currentTime;
            currentTime = Date.now();
            elapsedTime = currentTime - lastTime;

            update();
            draw();
            requestAnimFrame(runLoop);
        }
    }

    update() {
        var objects = Models.ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    draw() {
        context.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.fillStyle = "#000";
        context.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

        var objects = Models.ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++){
            var sprite = objects[i].getSprite();

            if(sprite)
                sprite.draw(context);
        }
    }
}

class GameUI {
    $canvas;
    $gameId;
    $nickname;
    $connect;
    $newGame;
    $existingGame;

    constructor() {
        var that = this,
            existingGame = false;

        this.$canvas = $("#canvas").width($(window).width()).height($(window).height() - 30);
        this.$gameId = $("#gameId");
        this.$nickname = $("#nickname");
        this.$connect = $("#connect");
        this.$newGame = $("#newGame");
        this.$existingGame = $("#existingGame");

        this.$newGame.on('click', function(){
            that.$gameId.removeAttr("required").hide();
            that.$newGame.hide();
            that.$existingGame.show();
            existingGame = false;
        });

        this.$existingGame.on('click', function(){
            that.$gameId.attr("required", "required").show();
            that.$newGame.show();
            that.$existingGame.hide();
            existingGame = true;
        });

        $this.$connect.on('click', function(){
            $(this).preventDefault();
            Game.init((existingGame ? $gameId.val() : null), $nickname.val());
        });
    }
}

new GameUI();