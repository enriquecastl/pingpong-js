window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

declare var $: any; 
declare module Backbone {
    export class Model {
        constructor (attr? , opts? );
        get(name: string): any;
        set(name: string, val: any): void;
        set(obj: any): void;
        save(attr? , opts? ): void;
        destroy(): void;
        bind(ev: string, f: Function, ctx?: any): void;
        toJSON(): any;
    }
    export class Collection {
        constructor (models? , opts? );
        bind(ev: string, f: Function, ctx?: any): void;
        collection: Model;
        length: number;
        create(attrs, opts? ): Collection;
        each(f: (elem: any) => void ): void;
        fetch(opts?: any): void;
        last(): any;
        last(n: number): any[];
        filter(f: (elem: any) => any): Collection;
        without(...values: any[]): Collection;
    }
    export class View {
        constructor (options? );
        $(selector: string): any;
        el: HTMLElement;
        $el: any;
        model: Model;
        remove(): void;
        delegateEvents: any;
        make(tagName: string, attrs? , opts? ): View;
        setElement(element: HTMLElement, delegate?: bool): void;
        tagName: string;
        events: any;

        static extend: any;
    }
}


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

var Key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    isDown: function(keyCode) {
        return this._pressed[keyCode];
    },

    onKeydown: function(event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function(event) {
        delete this._pressed[event.keyCode];
    }
};

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

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
        score : number = 0;

        constructor(x = 2, y = 2, width = Drawing.Paddle.PADDLE_WIDTH, height = Drawing.Paddle.PADDLE_HEIGHT) {
            super(x, y, width, height);
            var that = this,
                serverConn = GameServerConnection.getInstance();
            this.setSprite(new Drawing.Paddle());

            serverConn.sendPosition(_.pick(that, 'x', 'y'));
        }

        update(){
            var serverConn = GameServerConnection.getInstance(),
                moveDistance = this.getDistance(),
                move;

            if(Key.isDown(Key.UP)) 
                move = (this.y - moveDistance < this.MIN_Y) ? 0 : -moveDistance;
            else if(Key.isDown(Key.DOWN))
                move = (this.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance;
            else
                return;

            this.move(0, move);
            serverConn.sendPosition(_.pick(this, 'x', 'y'));
        }

        getDistance() : number {
            return (Game.getElapsedTime() / 1000) * this.VELOCITY;
        }
    }

    export class Opponent extends GameObject {

        score : number = 0;

        constructor(x = 0, y = 0) {
            super(x, y, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this,
                serverConn = GameServerConnection.getInstance();

            this.setSprite(new Drawing.Paddle());
            this.setPosition(Game.CANVAS_WIDTH-Drawing.Paddle.PADDLE_WIDTH - 1, 2);
            serverConn.on('change:opponentPosition', function(model, position){
                that.setPosition(that.x, position.y);
            });
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
            var serverConn = GameServerConnection.getInstance();
            this.calculateVelocity();
            
            if(this.collideWithTopBottomCanvas())
                this.yDirection = -this.yDirection;

            if(this.collideWithLeftRightCanvas()){
                this.xDirection = -this.xDirection;
                this.calculateAngle();
            }

            if(this.collideWithCanvas(this.vX, this.vY)){
                this.calculateVelocity();
            }

            this.move(this.vX, this.vY, true);

            serverConn.sendBallPosition(_.pick(this, 'x', 'y'));
        }

        collideWithCanvas(x = 0, y = 0) {
            return this.x + x - Ball.BALL_RADIUS <= 0 || this.y + y - Ball.BALL_RADIUS <= 0 ||
            this.right() + x - Ball.BALL_RADIUS >= Game.CANVAS_WIDTH || this.bottom() + y - Ball.BALL_RADIUS >= Game.CANVAS_HEIGHT;
        }

        public collideWithTopBottomCanvas(y = 0){
            return this.y - Ball.BALL_RADIUS + y <= 0 || this.bottom() - Ball.BALL_RADIUS + y >= Game.CANVAS_HEIGHT;
        }

        public collideWithLeftRightCanvas(x = 0){
            return this.x - Ball.BALL_RADIUS + x <= 0 || this.right() - Ball.BALL_RADIUS + x >= Game.CANVAS_WIDTH;
        }

        calculateAngle() {
            var angle = 0,
                avoidMin = Utils.degreesToRadians(-10),
                avoidMax = Utils.degreesToRadians(10);

            while(angle == 0 || (angle >= avoidMin && angle <= avoidMax)){
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;
            }

            this.vAngle = angle;
        }

        calculateVelocity() {
            var elapsedMs = (Game.getElapsedTime() / 1000);
            this.vX = (elapsedMs * this.movementSpeed * Math.cos(this.vAngle)) * this.xDirection;
            this.vY = (elapsedMs * this.movementSpeed * Math.sin(this.vAngle)) * this.yDirection;
        }
    }

    export class RemoteBall extends GameObject {
        constructor() {
            super(1,1, Ball.BALL_RADIUS * 2, Ball.BALL_RADIUS * 2);
            this.setSprite(new Drawing.Ball(Ball.BALL_RADIUS));
            
            var serverConn = GameServerConnection.getInstance(),
                that = this;

            serverConn.on('change:ballPosition', function(model, position){
                that.setPosition    (position.x, position.y);
            });
        }
    }
}

class ObjectRepository {
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

        return object;
    }

    public getObjects() {
        return this.objects;
    }
}

class GameServerConnection extends Backbone.Model {
    static instance;
    static getInstance() {
        if(GameServerConnection.instance == null)
            GameServerConnection.instance = new GameServerConnection();

        return GameServerConnection.instance;
    }

    socket;

    newGame(nickname) {
        this.socket = io.connect('http://localhost:8000');
        this.setListeners();

        this.socket.emit('newGame', {
            nickname : nickname
        });

    }

    connectToGame(gameId, nickname) {
        var that = this;

        this.socket = io.connect('http://localhost:8000');
        this.setListeners();

        this.socket.on('connectError', function(message){
            alert(message);
        });

        this.socket.emit('connectToGame', {
            nickname : nickname,
            gameId : gameId
        });
    }

    sendPosition(pos) {
        this.socket.emit('newPosition', pos);
    }

    sendBallPosition(pos) {
        this.socket.emit('ballPosition', pos);
    }

    setListeners() {
        var that = this;

        this.socket.on('connectionSuccess', function(data){
            console.log("connection established");
            that.set('gameId', data.gameId);
            that.set('connected', true);
        });

        this.socket.on('opponentPosition', function(pos) {
            console.log("received opponent position", pos);
            that.set('opponentPosition', pos);
        });

        this.socket.on('ballPosition', function(pos) {
            that.set('ballPosition', pos);
        });
    }
}

module Game {
    export var CANVAS_WIDTH = 600;
    export var CANVAS_HEIGHT = 400;

    var context,
        lastTime,
        currentTime,
        player,
        ball,
        opponent,
        running = false,
        gameId,
        elapsedTime : number = 0;

    export function getElapsedTime(){
        return elapsedTime;
    }

    export function init(gameId = null, nickname = "") {
        var gameServerConn = GameServerConnection.getInstance();

        context = $("#canvas")[0].getContext("2d");

        gameServerConn.on('change:connected', function(connected){
            if(connected){
                player = ObjectRepository.getInstance().addObject(new Models.Player());

                if(gameId === null)
                    ball = ObjectRepository.getInstance().addObject(new Models.Ball());

                gameId = gameServerConn.get('gameId');
            }
        });

        gameServerConn.on('change:opponentPosition', function(pos){            
            if(!running){
                opponent = ObjectRepository.getInstance().addObject(new Models.Opponent(pos.x, pos.y));

                if(!ball)
                    ball = ObjectRepository.getInstance().addObject(new Models.RemoteBall());

                running = true;
                run();
            }
        });

        (gameId === null) ? gameServerConn.newGame(nickname) : gameServerConn.connectToGame(gameId, nickname);
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
        var objects = ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    function draw() {
        context.beginPath();
        context.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.closePath();
        context.fillStyle = "#000";
        context.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

        var objects = ObjectRepository.getInstance().getObjects();

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
            existingGame = true,
            gameServer = GameServerConnection.getInstance();

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
            Game.init((existingGame ? that.$gameId.val() : null), that.$nickname.val());
        });

        gameServer.on('change:connected', function(connected){
            that.$connectMenu.hide();
            that.$gameInfo.find(".gameId").text(gameServer.get('gameId'));
            that.$gameInfo.find(".nickname").text(that.$nickname.val());
            that.$gameInfo.show();

        });

        function processError(actionData){
            if(_.isString(actionData.error)){
                that.$error.text(actionData.error)
                return true;
            }

            return false;
        }
    }
}

new GameUI();