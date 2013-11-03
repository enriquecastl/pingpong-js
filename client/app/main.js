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

var Utils;
(function (Utils) {
    function radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    Utils.radiansToDegrees = radiansToDegrees;

    function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    Utils.degreesToRadians = degreesToRadians;
})(Utils || (Utils = {}));

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

    var Ball = (function (_super) {
        __extends(Ball, _super);
        function Ball(radius) {
            _super.call(this, 0, 0, 0, 0);
            this.color = "#fff";
            this.radius = radius;
        }
        Ball.prototype.draw = function (context) {
            _super.prototype.draw.call(this);
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            context.closePath();
            context.fill();
        };
        return Ball;
    })(Sprite);
    Drawing.Ball = Ball;
})(Drawing || (Drawing = {}));

var Key = {
    _pressed: {},
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },
    onKeydown: function (event) {
        this._pressed[event.keyCode] = true;
    },
    onKeyup: function (event) {
        delete this._pressed[event.keyCode];
    }
};

window.addEventListener('keyup', function (event) {
    Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
    Key.onKeydown(event);
}, false);

var Models;
(function (Models) {
    var GameObject = (function () {
        function GameObject(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        GameObject.prototype.move = function (x, y, adjustToCanvas) {
            if (typeof adjustToCanvas === "undefined") { adjustToCanvas = false; }
            this.x += x;
            this.y += y;

            if (adjustToCanvas) {
                this.x = (this.x >= Game.CANVAS_WIDTH) ? (Game.CANVAS_WIDTH - this.width) : this.x;
                this.x = (this.x <= 0) ? 1 : this.x;
                this.y = (this.y >= Game.CANVAS_HEIGHT) ? (Game.CANVAS_HEIGHT - this.height) : this.y;
                this.y = (this.y <= 0) ? 1 : this.y;
            }

            this.sprite.setPosition(this.x, this.y);
        };

        GameObject.prototype.setPosition = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            this.x = x;
            this.y = y;

            this.sprite.setPosition(this.x, this.y);
        };

        GameObject.prototype.setSprite = function (sprite) {
            if (sprite !== null) {
                this.sprite = sprite;
            }
        };

        GameObject.prototype.collide = function (gameObject) {
            return this.x <= gameObject.x && this.right() >= gameObject.x && this.y <= gameObject.y && this.bottom() >= gameObject.y;
        };

        GameObject.prototype.collideWithCanvas = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            return this.x + x <= 0 || this.y + y <= 0 || this.right() + x >= Game.CANVAS_WIDTH || this.bottom() + y >= Game.CANVAS_HEIGHT;
        };

        GameObject.prototype.collideWithTopBottomCanvas = function (y) {
            if (typeof y === "undefined") { y = 0; }
            return this.y + y <= 0 || this.bottom() + y >= Game.CANVAS_HEIGHT;
        };

        GameObject.prototype.collideWithLeftRightCanvas = function (x) {
            if (typeof x === "undefined") { x = 0; }
            return this.x + x <= 0 || this.right() + x >= Game.CANVAS_WIDTH;
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
        function Player(x, y, width, height) {
            if (typeof x === "undefined") { x = 2; }
            if (typeof y === "undefined") { y = 2; }
            if (typeof width === "undefined") { width = Drawing.Paddle.PADDLE_WIDTH; }
            if (typeof height === "undefined") { height = Drawing.Paddle.PADDLE_HEIGHT; }
            _super.call(this, x, y, width, height);
            this.MIN_Y = 2;
            this.VELOCITY = 500;
            var that = this, serverConn = GameServerConnection.getInstance();
            this.setSprite(new Drawing.Paddle());

            serverConn.sendPosition(_.pick(that, 'x', 'y'));
        }
        Player.prototype.update = function () {
            var serverConn = GameServerConnection.getInstance(), moveDistance = this.getDistance(), move;

            if (Key.isDown(Key.UP))
                move = (this.y - moveDistance < this.MIN_Y) ? 0 : -moveDistance;
else if (Key.isDown(Key.DOWN))
                move = (this.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance;
else
                return;

            this.move(0, move);
            serverConn.sendPosition(_.pick(this, 'x', 'y'));
        };

        Player.prototype.getDistance = function () {
            return (Game.getElapsedTime() / 1000) * this.VELOCITY;
        };
        return Player;
    })(GameObject);
    Models.Player = Player;

    var Opponent = (function (_super) {
        __extends(Opponent, _super);
        function Opponent(x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            _super.call(this, x, y, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this, serverConn = GameServerConnection.getInstance();

            this.setSprite(new Drawing.Paddle());
            this.setPosition(Game.CANVAS_WIDTH - Drawing.Paddle.PADDLE_WIDTH - 1, 2);
            serverConn.on('change:opponentPosition', function (model, position) {
                that.setPosition(that.x, position.y);
            });
        }
        return Opponent;
    })(GameObject);
    Models.Opponent = Opponent;

    var Ball = (function (_super) {
        __extends(Ball, _super);
        function Ball() {
            _super.call(this, 1, 1, Ball.BALL_RADIUS * 2, Ball.BALL_RADIUS * 2);
            this.movementSpeed = 500;
            this.minAngle = Utils.degreesToRadians(-20);
            this.maxAngle = Utils.degreesToRadians(20);
            this.vAngle = Utils.degreesToRadians(0);
            this.xDirection = 1;
            this.yDirection = 1;
            this.setSprite(new Drawing.Ball(Ball.BALL_RADIUS));
            this.initialPos = {
                x: Game.CANVAS_WIDTH / 2 - Ball.BALL_RADIUS,
                y: Game.CANVAS_HEIGHT / 2 - Ball.BALL_RADIUS
            };

            this.move(this.initialPos.x, this.initialPos.y);
        }
        Ball.prototype.update = function () {
            var serverConn = GameServerConnection.getInstance();
            this.calculateVelocity();

            if (this.collideWithTopBottomCanvas(this.vY))
                this.yDirection = -this.yDirection;

            if (this.collideWithLeftRightCanvas(this.vX)) {
                this.xDirection = -this.xDirection;
            }

            if (this.collideWithCanvas(this.vX, this.vY)) {
                this.calculateVelocity();
                this.calculateAngle();
            }

            this.move(this.vX, this.vY, true);

            serverConn.sendBallPosition(_.pick(this, 'x', 'y'));
        };

        Ball.prototype.collideWithCanvas = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            return this.x + x - Ball.BALL_RADIUS <= 0 || this.y + y - Ball.BALL_RADIUS <= 0 || this.right() + x + Ball.BALL_RADIUS >= Game.CANVAS_WIDTH || this.bottom() + y + Ball.BALL_RADIUS >= Game.CANVAS_HEIGHT;
        };

        Ball.prototype.collideWithTopBottomCanvas = function (y) {
            if (typeof y === "undefined") { y = 0; }
            return this.y - Ball.BALL_RADIUS + y <= 0 || this.bottom() + Ball.BALL_RADIUS + y >= Game.CANVAS_HEIGHT;
        };

        Ball.prototype.collideWithLeftRightCanvas = function (x) {
            if (typeof x === "undefined") { x = 0; }
            return this.x - Ball.BALL_RADIUS + x <= 0 || this.right() + Ball.BALL_RADIUS + x >= Game.CANVAS_WIDTH;
        };

        Ball.prototype.calculateAngle = function () {
            var angle = 0, avoidMin = Utils.degreesToRadians(-10), avoidMax = Utils.degreesToRadians(10);

            while (angle == 0 || (angle >= avoidMin && angle <= avoidMax)) {
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;
            }

            this.vAngle = angle;
        };

        Ball.prototype.calculateVelocity = function () {
            var elapsedMs = (Game.getElapsedTime() / 1000);
            this.vX = (elapsedMs * this.movementSpeed * Math.cos(this.vAngle)) * this.xDirection;
            this.vY = (elapsedMs * this.movementSpeed * Math.sin(this.vAngle)) * this.yDirection;
        };
        Ball.BALL_RADIUS = 10;
        return Ball;
    })(GameObject);
    Models.Ball = Ball;

    var RemoteBall = (function (_super) {
        __extends(RemoteBall, _super);
        function RemoteBall() {
            _super.call(this, 1, 1, Ball.BALL_RADIUS * 2, Ball.BALL_RADIUS * 2);
            this.setSprite(new Drawing.Ball(Ball.BALL_RADIUS));

            var serverConn = GameServerConnection.getInstance(), that = this;

            serverConn.on('change:ballPosition', function (model, position) {
                that.setPosition(position.x, position.y);
            });
        }
        return RemoteBall;
    })(GameObject);
    Models.RemoteBall = RemoteBall;
})(Models || (Models = {}));

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

        return object;
    };

    ObjectRepository.prototype.getObjects = function () {
        return this.objects;
    };
    return ObjectRepository;
})();

var GameServerConnection = (function (_super) {
    __extends(GameServerConnection, _super);
    function GameServerConnection() {
        _super.apply(this, arguments);
    }
    GameServerConnection.getInstance = function () {
        if (GameServerConnection.instance == null)
            GameServerConnection.instance = new GameServerConnection();

        return GameServerConnection.instance;
    };

    GameServerConnection.prototype.newGame = function (nickname) {
        this.socket = io.connect('http://localhost:8000');
        this.setListeners();

        this.socket.emit('newGame', {
            nickname: nickname
        });
    };

    GameServerConnection.prototype.connectToGame = function (gameId, nickname) {
        var that = this;

        this.socket = io.connect('http://localhost:8000');
        this.setListeners();

        this.socket.on('connectError', function (message) {
            alert(message);
        });

        this.socket.emit('connectToGame', {
            nickname: nickname,
            gameId: gameId
        });
    };

    GameServerConnection.prototype.sendPosition = function (pos) {
        this.socket.emit('newPosition', pos);
    };

    GameServerConnection.prototype.sendBallPosition = function (pos) {
        this.socket.emit('ballPosition', pos);
    };

    GameServerConnection.prototype.setListeners = function () {
        var that = this;

        this.socket.on('connectionSuccess', function (data) {
            console.log("connection established");
            that.set('gameId', data.gameId);
            that.set('connected', true);
        });

        this.socket.on('opponentPosition', function (pos) {
            console.log("received opponent position", pos);
            that.set('opponentPosition', pos);
        });

        this.socket.on('ballPosition', function (pos) {
            that.set('ballPosition', pos);
        });
    };
    return GameServerConnection;
})(Backbone.Model);

var Game;
(function (Game) {
    Game.CANVAS_WIDTH = 600;
    Game.CANVAS_HEIGHT = 400;

    var context, lastTime, currentTime, player, ball, opponent, running = false, gameId, elapsedTime = 0;

    function getElapsedTime() {
        return elapsedTime;
    }
    Game.getElapsedTime = getElapsedTime;

    function init(gameId, nickname) {
        if (typeof gameId === "undefined") { gameId = null; }
        if (typeof nickname === "undefined") { nickname = ""; }
        var gameServerConn = GameServerConnection.getInstance();

        context = $("#canvas")[0].getContext("2d");

        gameServerConn.on('change:connected', function (connected) {
            if (connected) {
                player = ObjectRepository.getInstance().addObject(new Models.Player());

                if (gameId === null)
                    ball = ObjectRepository.getInstance().addObject(new Models.Ball());

                gameId = gameServerConn.get('gameId');
            }
        });

        gameServerConn.on('change:opponentPosition', function (pos) {
            if (!running) {
                opponent = ObjectRepository.getInstance().addObject(new Models.Opponent(pos.x, pos.y));

                if (!ball)
                    ball = ObjectRepository.getInstance().addObject(new Models.RemoteBall());

                running = true;
                run();
            }
        });

        (gameId === null) ? gameServerConn.newGame(nickname) : gameServerConn.connectToGame(gameId, nickname);
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
        var objects = ObjectRepository.getInstance().getObjects();

        for (var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    function draw() {
        context.beginPath();
        context.clearRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
        context.closePath();
        context.fillStyle = "#000";
        context.fillRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

        var objects = ObjectRepository.getInstance().getObjects();

        for (var i = 0; i < objects.length; i++) {
            var sprite = objects[i].getSprite();

            if (sprite)
                sprite.draw(context);
        }
    }
})(Game || (Game = {}));

var GameUI = (function () {
    function GameUI() {
        var that = this, existingGame = true, gameServer = GameServerConnection.getInstance();

        this.$canvasContainer = $("#canvas-container");
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

        gameServer.on('change:connected', function (connected) {
            that.$connectMenu.hide();
            that.$gameInfo.find(".gameId").text(gameServer.get('gameId'));
            that.$gameInfo.find(".nickname").text(that.$nickname.val());
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
