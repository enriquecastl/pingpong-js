var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

var Drawing;
(function (Drawing) {
    var Sprite = (function () {
        function Sprite(x, y, width, height) {
            this.setPosition(x, y);
            this.setDimensions(width, height);
        }
        Sprite.prototype.setPosition = function (x, y) {
            this.x = x || 0;
            this.y = y || 0;
        };

        Sprite.prototype.setDimensions = function (width, height) {
            this.width = width || 0;
            this.height = height || 0;
        };

        Sprite.prototype.draw = function (context) {
        };
        return Sprite;
    })();
    Drawing.Sprite = Sprite;

    var Paddle = (function (_super) {
        __extends(Paddle, _super);
        function Paddle(x, y) {
            _super.call(this, x, y, Paddle.PADDLE_WIDTH, Paddle.PADDLE_HEIGHT);
            this.COLOR = "#fff";
        }
        Paddle.prototype.draw = function (context) {
            _super.prototype.draw.call(this);
            context.fillStyle = this.COLOR;
            context.fillRect(this.x, this.y, this.width, this.height);
        };
        Paddle.PADDLE_HEIGHT = 75;
        Paddle.PADDLE_WIDTH = 20;
        return Paddle;
    })(Sprite);
    Drawing.Paddle = Paddle;
})(Drawing || (Drawing = {}));

var Models;
(function (Models) {
    var GameObject = (function () {
        function GameObject(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        GameObject.prototype.move = function (x, y) {
            this.x += x;
            this.y += y;

            this.sprite.setPosition(this.x, this.y);
        };

        GameObject.prototype.setSprite = function (sprite) {
            if (sprite !== null) {
                this.sprite = sprite;
            }
        };

        GameObject.prototype.getSprite = function () {
            return this.sprite;
        };

        GameObject.prototype.bottom = function () {
            return this.y + this.height;
        };

        GameObject.prototype.right = function () {
            return this.x + this.width;
        };

        GameObject.prototype.update = function () {
        };
        return GameObject;
    })();
    Models.GameObject = GameObject;

    var Player = (function (_super) {
        __extends(Player, _super);
        function Player() {
            _super.call(this, 0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            this.MIN_Y = 2;
            this.VELOCITY = 500;
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(2, 2);

            $(document).bind('keypress.a', function () {
                var moveDistance = that.getDistance();
                var move = (that.y - moveDistance < that.MIN_Y) ? 0 : -moveDistance;
                that.move(0, move);
            });

            $(document).bind('keypress.s', function () {
                var moveDistance = that.getDistance();
                var move = (that.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance;
                that.move(0, move);
            });
        }
        Player.prototype.getDistance = function () {
            return (Game.getElapsedTime() / 1000) * this.VELOCITY;
        };
        return Player;
    })(GameObject);
    Models.Player = Player;

    var Opponent = (function (_super) {
        __extends(Opponent, _super);
        function Opponent() {
            _super.call(this, 0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(Game.CANVAS_WIDTH - Drawing.Paddle.PADDLE_WIDTH - 1, 2);
        }
        return Opponent;
    })(GameObject);
    Models.Opponent = Opponent;

    var ObjectRepository = (function () {
        function ObjectRepository() {
            this.objects = [];
        }
        ObjectRepository.getInstance = function () {
            if (ObjectRepository.instance == null) {
                ObjectRepository.instance = new ObjectRepository();
            }

            return ObjectRepository.instance;
        };

        ObjectRepository.prototype.addObject = function (object) {
            if (object == null)
                return;

            this.objects.push(object);

            return this;
        };

        ObjectRepository.prototype.getObjects = function () {
            return this.objects;
        };
        return ObjectRepository;
    })();
    Models.ObjectRepository = ObjectRepository;
})(Models || (Models = {}));

var GameServerConnection = (function () {
    function GameServerConnection() {
        this.messageCallbacks = {};
    }
    GameServerConnection.getInstance = function () {
        if (GameServerConnection.instance == null)
            GameServerConnection.instance = new GameServerConnection();

        return GameServerConnection.instance;
    };

    GameServerConnection.prototype.connect = function (gameId, nickname) {
        var that = this;

        this.socket = io.connect('http://localhost:8000');
        this.socket.on('message', function (message) {
            var callbackName = message.type;

            if (message.data.error)
                callbackName = callbackName.concat("Error");

            _.each(that.messageCallbacks[callbackName], function (callback) {
                callback(message);
            });
        });

        this.socket.emit('message', {
            action: 'connectToGame',
            data: {
                nickname: nickname,
                gameId: gameId
            }
        });
    };

    GameServerConnection.prototype.addActionListener = function (actionType, callback) {
        actionType = actionType || "";

        if (!_.isFunction(callback))
            return;

        if (!_.isArray(this.messageCallbacks[actionType]))
            this.messageCallbacks[actionType] = [];

        this.messageCallbacks[actionType].push(callback);
    };
    return GameServerConnection;
})();

var Game;
(function (Game) {
    Game.CANVAS_WIDTH = $("#canvas").width();
    Game.CANVAS_HEIGHT = $("#canvas").height();

    var context, lastTime, currentTime, elapsedTime = 0;

    function getElapsedTime() {
        return elapsedTime;
    }
    Game.getElapsedTime = getElapsedTime;

    function init(gameId, nickname) {
        var objectRepo = Models.ObjectRepository.getInstance(), gameServer = GameServerConnection.getInstance();

        context = $("#canvas")[0].getContext("2d");

        gameServer.addActionListener("connectToGame", function (action) {
            run();
        });

        gameServer.connect(gameId, nickname);
    }
    Game.init = init;

    function run() {
        lastTime = currentTime = Date.now();
        requestAnimFrame(runLoop);

        function runLoop() {
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

        for (var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    function draw() {
        context.clearRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
        context.fillStyle = "#000";
        context.fillRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

        var objects = Models.ObjectRepository.getInstance().getObjects();

        for (var i = 0; i < objects.length; i++) {
            var sprite = objects[i].getSprite();

            if (sprite)
                sprite.draw(context);
        }
    }
})(Game || (Game = {}));

var GameUI = (function () {
    function GameUI() {
        var that = this, existingGame = true;

        this.$canvas = $("#canvas").width($(window).width()).height($(window).height() - 30);
        this.$gameId = $("#gameId");
        this.$nickname = $("#nickname");
        this.$connect = $("#connect");
        this.$newGame = $("#newGame");
        this.$existingGame = $("#existingGame");
        this.$connectMenu = $("#connect-menu");
        this.$gameInfo = $("#game-info");
        this.$error = $("#error");

        $(document).find("button").on('click', function () {
            that.$error.text("");
        });

        this.$newGame.on('click', function () {
            that.$gameId.removeAttr("required").hide();
            that.$newGame.hide();
            that.$existingGame.show();
            existingGame = false;
        });

        this.$existingGame.on('click', function () {
            that.$gameId.attr("required", "required").show();
            that.$newGame.show();
            that.$existingGame.hide();
            existingGame = true;
        });

        this.$connect.on('click', function (e) {
            e.preventDefault();
            Game.init((existingGame ? that.$gameId.val() : null), that.$nickname.val());
        });

        var gameServer = GameServerConnection.getInstance();

        gameServer.addActionListener('connectToGameError', function (action) {
            processError(action.data);
        });

        gameServer.addActionListener('connectToGame', function (action) {
            that.$connectMenu.hide();
            that.$gameInfo.find(".gameId").text(action.data.game.id);
            that.$gameInfo.find(".nickname").text(action.data.me.nickname);
            that.$gameInfo.show();
        });

        function processError(actionData) {
            if (_.isString(actionData.error)) {
                that.$error.text(actionData.error);
                return true;
            }

            return false;
        }
    }
    return GameUI;
})();

new GameUI();
