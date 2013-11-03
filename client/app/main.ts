window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


module Utils {
    export  function radiansToDegrees(radians){
        return radians * (180 / Math.PI);
    }

    export function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

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

    export class Ball extends Sprite {
        color : string = "#fff";
        radius : number;

        constructor(radius) {
            super(0, 0, 0, 0);
            this.radius = radius;
        }

        draw(context) {
            super.draw();
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
            context.closePath();
            context.fill();
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
            this.x = x
            this.y = y
            this.width = width
            this.height = height
        }

        move(x : number, y : number, adjustToCanvas = false) {
            this.x += x;
            this.y += y;

            if(adjustToCanvas){
                this.x = (this.x >= Game.CANVAS_WIDTH) ? (Game.CANVAS_WIDTH - this.width) : this.x;
                this.x = (this.x <= 0) ? 1 : this.x;
                this.y = (this.y >= Game.CANVAS_HEIGHT) ? (Game.CANVAS_HEIGHT - this.height) : this.y;
                this.y = (this.y <= 0) ? 1 : this.y;
            }

            this.sprite.setPosition(this.x, this.y);
        }

        setPosition(x : number = 0, y : number = 0) {
            this.x = x;
            this.y = y;

            this.sprite.setPosition(this.x, this.y);
        }

        setSprite(sprite : Drawing.Sprite) {
            if(sprite !== null){
                this.sprite = sprite;
            }
        }

        public collide(gameObject : GameObject) {
            return  this.x <= gameObject.x && 
                    this.right() >= gameObject.x &&
                    this.y <= gameObject.y &&
                    this.bottom() >= gameObject.y;
        }

        public collideWithCanvas(x = 0, y = 0) {
            return this.x + x <= 0 || this.y + y <= 0 ||
            this.right() + x >= Game.CANVAS_WIDTH || this.bottom() + y >= Game.CANVAS_HEIGHT;
        }

        public collideWithTopBottomCanvas(y = 0){
            return this.y + y <= 0 || this.bottom() + y >= Game.CANVAS_HEIGHT;
        }

        public collideWithLeftRightCanvas(x = 0){
            return this.x + x <= 0 || this.right() + x >= Game.CANVAS_WIDTH;
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

        constructor(data) {
            super(0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(2,2);
            _.extend(this, data);

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

        constructor(data) {
            super(0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;

            this.setSprite(new Drawing.Paddle());
            this.move(Game.CANVAS_WIDTH-Drawing.Paddle.PADDLE_WIDTH - 1,2);

            _.extend(this, data);
        }
    }

    export class Ball extends GameObject {
        static BALL_RADIUS : number = 10;
        movementSpeed : number = 500;
        minAngle : number = Utils.degreesToRadians(-20);
        maxAngle : number = Utils.degreesToRadians(20);
        vAngle : number = Utils.degreesToRadians(0);
        xDirection : number = 1;
        yDirection : number = 1;

        constructor() {
            super(1,1, Ball.BALL_RADIUS * 2, Ball.BALL_RADIUS * 2);
            this.setSprite(new Drawing.Ball(Ball.BALL_RADIUS));
            this.initialPos = {
                x : Game.CANVAS_WIDTH / 2 - Ball.BALL_RADIUS, 
                y : Game.CANVAS_HEIGHT / 2 - Ball.BALL_RADIUS
            };

            this.move(this.initialPos.x, this.initialPos.y);
        }

        update() {
            this.calculateVelocity();
            
            if(this.collideWithTopBottomCanvas(this.vY))
                this.yDirection = -this.yDirection;

            if(this.collideWithLeftRightCanvas(this.vX)){
                this.xDirection = -this.xDirection;
            }

            if(this.collideWithCanvas(this.vX, this.vY)){
                this.calculateVelocity();
                this.calculateAngle();
            }

            this.move(this.vX, this.vY, true);
        }

        collideWithCanvas(x = 0, y = 0) {
            return this.x + x - Ball.BALL_RADIUS <= 0 || this.y + y - Ball.BALL_RADIUS <= 0 ||
            this.right() + x + Ball.BALL_RADIUS >= Game.CANVAS_WIDTH || this.bottom() + y + Ball.BALL_RADIUS >= Game.CANVAS_HEIGHT;
        }

        public collideWithTopBottomCanvas(y = 0){
            return this.y - Ball.BALL_RADIUS + y <= 0 || this.bottom() + Ball.BALL_RADIUS + y >= Game.CANVAS_HEIGHT;
        }

        public collideWithLeftRightCanvas(x = 0){
            return this.x - Ball.BALL_RADIUS + x <= 0 || this.right() + Ball.BALL_RADIUS + x >= Game.CANVAS_WIDTH;
        }

        calculateAngle() {
            var angle = 0,
                avoidMin = Utils.degreesToRadians(-5),
                avoidMax = Utils.degreesToRadians(5);

            while(angle == 0 || (angle >= avoidMin && angle <= avoidMax)){
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;
                console.log(angle)
            }

            this.vAngle = angle;
        }

        calculateVelocity() {
            var elapsedMs = (Game.getElapsedTime() / 1000);
            this.vX = (elapsedMs * this.movementSpeed * Math.cos(this.vAngle)) * this.xDirection;
            this.vY = (elapsedMs * this.movementSpeed * Math.sin(this.vAngle)) * this.yDirection;
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

module Game {
    export var CANVAS_WIDTH = 600;
    export var CANVAS_HEIGHT = 400;

    var context,
        lastTime,
        currentTime,
        player,
        opponent,
        elapsedTime : number = 0;

    export function getElapsedTime(){
        return elapsedTime;
    }

    export function init(gameId, nickname) {
        var objectRepo = Models.ObjectRepository.getInstance();
    
        context = $("#canvas")[0].getContext("2d");
        objectRepo.addObject(new Models.Player());
        objectRepo.addObject(new Models.Ball());

        run(); 
    }

    function run() {
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

    function update() {
        var objects = Models.ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    function draw() {
        context.beginPath();
        context.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.closePath();
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
    $canvasContainer;
    $gameId;
    $nickname;
    $connect;
    $newGame;
    $existingGame;
    $error;

    constructor() {
        var that = this,
            existingGame = true;

        this.$canvasContainer = $("#canvas-container");
        this.$gameId = $("#gameId");
        this.$nickname = $("#nickname");
        this.$connect = $("#connect");
        this.$newGame = $("#newGame");
        this.$existingGame = $("#existingGame");
        this.$connectMenu = $("#connect-menu");
        this.$gameInfo = $("#game-info");
        this.$error = $("#error");

        $(document).find("button").on('click', function(){
            that.$error.text("");
        });
 
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

        this.$connect.on('click', function(e){
            e.preventDefault();
        });

        function processError(actionData){
            if(_.isString(actionData.error)){
                that.$error.text(actionData.error)
                return true;
            }

            return false;
        }

        Game.init((existingGame ? that.$gameId.val() : null), that.$nickname.val());
    }
}

new GameUI();