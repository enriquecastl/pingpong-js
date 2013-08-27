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
    static instance;
    static getInstance() {
        if(GameServerConnection.instance == null)
            GameServerConnection.instance = new GameServerConnection();

        return GameServerConnection.instance;
    }

    messageCallbacks = {};

    connect(gameId, nickname) {
        var that = this;

        this.socket = io.connect('http://localhost:8000');
        this.socket.on('message', function(message){
            var callbackName = message.type;

            if(message.data.error)
                callbackName = callbackName.concat("Error")

            _.each(that.messageCallbacks[callbackName], function(callback){
                callback(message);
            });
        });

        this.socket.emit('message', {
            action : 'connectToGame',
            data : {
                nickname : nickname,
                gameId : gameId
            }
        });
    }

    addActionListener(actionType, callback){
        actionType = actionType || "";

        if(!_.isFunction(callback)) return;

        if(!_.isArray(this.messageCallbacks[actionType]))
            this.messageCallbacks[actionType] = [];

        this.messageCallbacks[actionType].push(callback); 
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
        var objectRepo = Models.ObjectRepository.getInstance(),
            gameServer = GameServerConnection.getInstance();
        
        context = $("#canvas")[0].getContext("2d");

        gameServer.addActionListener("connectToGame", function(action){
            run();
        });

        gameServer.connect(gameId, nickname);
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
    $error;

    constructor() {
        var that = this,
            existingGame = true;

        this.$canvas = $("#canvas").width($(window).width()).height($(window).height() - 30);
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

        var gameServer = GameServerConnection.getInstance();

        gameServer.addActionListener('connectToGameError', function(action){
            processError(action.data);
        });

        gameServer.addActionListener('connectToGame', function(action){
            that.$connectMenu.hide();
            that.$gameInfo.find(".gameId").text(action.data.game.id);
            that.$gameInfo.find(".nickname").text(action.data.me.nickname);
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