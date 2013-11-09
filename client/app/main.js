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
    var Point = (function () {
        function Point(x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            this.x = x;
            this.y = y;
        }
        Point.prototype.getX = function () {
            return this.x;
        };

        Point.prototype.getY = function () {
            return this.y;
        };

        Point.prototype.move = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            this.x += x;
            this.y += y;
        };

        Point.prototype.distanceFromOrigin = function () {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        };

        Point.prototype.distanceFromPointCoords = function (x, y) {
            if (typeof x === "undefined") { x = this.x; }
            if (typeof y === "undefined") { y = this.y; }
            return this.distanceFromPoint(new Point(x, y));
        };

        Point.prototype.distanceFromPoint = function (point) {
            return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));
        };
        return Point;
    })();
    Models.Point = Point;

    var GameObject = (function () {
        function GameObject(point) {
            this.point = point;
        }
        GameObject.prototype.setPosition = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            this.point = new Point(x, y);
            this.sprite.setPosition(this.point.getX(), this.point.getY());
        };

        GameObject.prototype.setSprite = function (sprite) {
            if (sprite !== null) {
                this.sprite = sprite;
                this.sprite.setPosition(this.point.getX(), this.point.getY());
            }
        };

        GameObject.prototype.getSprite = function () {
            return this.sprite;
        };

        GameObject.prototype.update = function () {
            return;
        };
        return GameObject;
    })();
    Models.GameObject = GameObject;

    var RectangularGameObject = (function (_super) {
        __extends(RectangularGameObject, _super);
        function RectangularGameObject(point, width, height) {
            if (typeof point === "undefined") { point = new Point(0, 0); }
            if (typeof width === "undefined") { width = 0; }
            if (typeof height === "undefined") { height = 0; }
            _super.call(this, point);
            this.width = width;
            this.height = height;
        }
        RectangularGameObject.prototype.move = function (x, y, adjustToCanvas) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof adjustToCanvas === "undefined") { adjustToCanvas = false; }
            this.point.move(x, y);

            if (adjustToCanvas) {
                if (this.point.getX() < 0)
                    this.point = new Point(0, this.point.getY());
else if (this.right() > Game.CANVAS_WIDTH)
                    this.point = new Point(Game.CANVAS_WIDTH - this.width, this.point.getY());
else if (this.point.getY() < 0)
                    this.point = new Point(this.point.getX(), 0);
else if (this.bottom() > Game.CANVAS_HEIGHT)
                    this.point = new Point(this.point.getX(), Game.CANVAS_HEIGHT - this.height);
            }

            this.sprite.setPosition(this.point.getX(), this.point.getY());
        };

        RectangularGameObject.prototype.collideWithRectObject = function (gameObject) {
            return gameObject.point.getX() <= this.right() && gameObject.right() >= this.point.getX() && gameObject.point.getY() <= this.bottom() && gameObject.bottom() >= this.point.getY();
        };

        RectangularGameObject.prototype.collideWithCircleObject = function (gameObject) {
            return (gameObject.leftMostPoint().getX() <= this.right() && gameObject.rightMostPoint().getX() >= this.point.getX() && gameObject.topMostPoint().getY() <= this.bottom() && gameObject.bottomMostPoint().getY() >= this.point.getY()) || this.pointInsideRectangle(gameObject.point);
        };

        RectangularGameObject.prototype.pointInsideRectangle = function (point) {
            var pointX = point.getX(), pointY = point.getY();

            return pointX <= this.right() && pointX >= this.point.getX() && pointY <= this.bottom() && pointY >= this.point.getY();
        };

        RectangularGameObject.prototype.collideWithCanvas = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            return this.collideWithTopBottomCanvas(y) || this.collideWithLeftRightCanvas(x);
        };

        RectangularGameObject.prototype.collideWithTopBottomCanvas = function (y) {
            if (typeof y === "undefined") { y = 0; }
            return this.y + y <= 0 || this.bottom() + y >= Game.CANVAS_HEIGHT;
        };

        RectangularGameObject.prototype.collideWithLeftRightCanvas = function (x) {
            if (typeof x === "undefined") { x = 0; }
            return this.x + x <= 0 || this.right() + x >= Game.CANVAS_WIDTH;
        };

        RectangularGameObject.prototype.bottom = function () {
            return this.point.getY() + this.height;
        };

        RectangularGameObject.prototype.right = function () {
            return this.point.getX() + this.width;
        };
        return RectangularGameObject;
    })(GameObject);
    Models.RectangularGameObject = RectangularGameObject;

    var CircularGameObject = (function (_super) {
        __extends(CircularGameObject, _super);
        function CircularGameObject(point, radius) {
            if (typeof point === "undefined") { point = new Point(0, 0); }
            if (typeof radius === "undefined") { radius = 5; }
            _super.call(this, point);
            this.radius = 0.0;
            this.radius = radius;
        }
        CircularGameObject.prototype.move = function (x, y, adjustToCanvas) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof adjustToCanvas === "undefined") { adjustToCanvas = false; }
            this.point.move(x, y);

            if (adjustToCanvas) {
                if (this.point.distanceFromPointCoords(0, this.point.getY()) <= this.radius)
                    this.point = new Point(this.radius, this.point.getY());
else if (this.point.distanceFromPointCoords(Game.CANVAS_WIDTH, this.point.getY()) <= this.radius)
                    this.point = new Point(Game.CANVAS_WIDTH - this.radius, this.point.getY());
else if (this.point.distanceFromPointCoords(this.point.getX(), 0) <= this.radius)
                    this.point = new Point(this.point.getX(), this.radius);
else if (this.point.distanceFromPointCoords(this.point.getX(), Game.CANVAS_HEIGHT) <= this.radius)
                    this.point = new Point(this.point.getX(), Game.CANVAS_HEIGHT - this.radius);
            }

            this.sprite.setPosition(this.point.getX(), this.point.getY());
        };

        CircularGameObject.prototype.leftMostPoint = function () {
            return new Point(this.point.getX() - this.radius, this.point.getY());
        };

        CircularGameObject.prototype.rightMostPoint = function () {
            return new Point(this.point.getX() + this.radius, this.point.getY());
        };

        CircularGameObject.prototype.topMostPoint = function () {
            return new Point(this.point.getX(), this.point.getY() - this.radius);
        };

        CircularGameObject.prototype.bottomMostPoint = function () {
            return new Point(this.point.getX(), this.point.getY() + this.radius);
        };

        CircularGameObject.prototype.collideWithCanvas = function (x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            return this.collideWithTopBottomCanvas(y) || this.collideWithLeftRightCanvas(x);
        };

        CircularGameObject.prototype.collideWithTopBottomCanvas = function (y) {
            if (typeof y === "undefined") { y = 0; }
            return this.point.distanceFromPointCoords(undefined, 0) <= this.radius || this.point.distanceFromPointCoords(undefined, Game.CANVAS_HEIGHT) <= this.radius;
        };

        CircularGameObject.prototype.collideWithLeftRightCanvas = function (x) {
            if (typeof x === "undefined") { x = 0; }
            return this.point.distanceFromPointCoords(0) <= this.radius || this.point.distanceFromPointCoords(Game.CANVAS_WIDTH) <= this.radius;
        };
        return CircularGameObject;
    })(GameObject);
    Models.CircularGameObject = CircularGameObject;

    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            var that = this, serverConn = GameServerConnection.getInstance();
            this.MIN_Y = 0;
            this.VELOCITY = 500;
            this.score = 0;
            this.id = "player";

            _super.call(this, new Models.Point(x, y), Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            this.setSprite(new Drawing.Paddle());

            serverConn.sendPosition(_.pick(that.point, 'x', 'y'));
        }
        Player.prototype.update = function () {
            var serverConn = GameServerConnection.getInstance(), moveDistance = this.getDistance(), move;

            if (Key.isDown(Key.UP))
                move = (this.point.getY() - moveDistance < this.MIN_Y) ? 0 : -moveDistance;
else if (Key.isDown(Key.DOWN))
                move = (this.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance;
else
                return;

            this.move(0, move);
            serverConn.sendPosition(_.pick(this.point, 'x', 'y'));
        };

        Player.prototype.getDistance = function () {
            return (Game.getElapsedTime() / 1000) * this.VELOCITY;
        };
        return Player;
    })(RectangularGameObject);
    Models.Player = Player;

    var Opponent = (function (_super) {
        __extends(Opponent, _super);
        function Opponent(x, y) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            var that = this, serverConn = GameServerConnection.getInstance();
            this.id = "opponent";
            this.score = 0;

            _super.call(this, new Point(x, y), Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            this.setSprite(new Drawing.Paddle());

            serverConn.on('change:opponentPosition', function (model, position) {
                that.setPosition(that.point.getX(), position.y);
            });
        }
        return Opponent;
    })(RectangularGameObject);
    Models.Opponent = Opponent;

    var Ball = (function (_super) {
        __extends(Ball, _super);
        function Ball() {
            _super.call(this, new Point(Game.CANVAS_WIDTH / 2, Game.CANVAS_HEIGHT / 2), 10);
            this.id = "ball";
            this.movementSpeed = 500;
            this.minAngle = Utils.degreesToRadians(-20);
            this.maxAngle = Utils.degreesToRadians(20);
            this.vAngle = Utils.degreesToRadians(0);
            this.xDirection = 1;
            this.yDirection = 1;
            this.setSprite(new Drawing.Ball(this.radius));
        }
        Ball.prototype.update = function () {
            var serverConn = GameServerConnection.getInstance(), objectRepo = ObjectRepository.getInstance(), player = objectRepo.get('player'), opponent = objectRepo.get('opponent');

            this.calculateVelocity();

            if (this.collideWithTopBottomCanvas())
                this.yDirection = -this.yDirection;

            if (this.collideWithLeftRightCanvas())
                this.xDirection = -this.xDirection;

            if (player.collideWithCircleObject(this) || opponent.collideWithCircleObject(this)) {
                this.xDirection = -this.xDirection;
                this.calculateAngle();
                this.calculateVelocity();
            }

            if (this.collideWithCanvas())
                this.calculateVelocity();

            this.move(this.vX, this.vY, true);

            serverConn.sendBallPosition(_.pick(this.point, 'x', 'y'));
        };

        Ball.prototype.calculateAngle = function () {
            var angle = 0, avoidMin = Utils.degreesToRadians(-10), avoidMax = Utils.degreesToRadians(10);

            while (angle == 0 || (angle >= avoidMin && angle <= avoidMax))
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;

            this.vAngle = angle;
        };

        Ball.prototype.calculateVelocity = function () {
            var elapsedMs = (Game.getElapsedTime() / 1000);
            this.vX = (elapsedMs * this.movementSpeed * Math.cos(this.vAngle)) * this.xDirection;
            this.vY = (elapsedMs * this.movementSpeed * Math.sin(this.vAngle)) * this.yDirection;
        };
        return Ball;
    })(CircularGameObject);
    Models.Ball = Ball;

    var RemoteBall = (function (_super) {
        __extends(RemoteBall, _super);
        function RemoteBall() {
            var serverConn = GameServerConnection.getInstance(), that = this;
            this.id = "remoteBall";

            _super.call(this, new Point(Game.CANVAS_WIDTH / 2, Game.CANVAS_HEIGHT / 2), 10);
            this.setSprite(new Drawing.Ball(this.radius));

            serverConn.on('change:ballPosition', function (model, position) {
                that.setPosition(position.x, position.y);
            });
        }
        return RemoteBall;
    })(CircularGameObject);
    Models.RemoteBall = RemoteBall;
})(Models || (Models = {}));

var ObjectRepository = (function () {
    function ObjectRepository() {
        this.objects = [];
    }
    ObjectRepository.getInstance = function () {
        if (ObjectRepository.instance == null)
            ObjectRepository.instance = new ObjectRepository();

        return ObjectRepository.instance;
    };

    ObjectRepository.prototype.addObject = function (object) {
        if (object == null)
            return;

        this.objects.push(object);

        return object;
    };

    ObjectRepository.prototype.clean = function () {
        this.objects = [];
    };

    ObjectRepository.prototype.getObjects = function () {
        return this.objects;
    };

    ObjectRepository.prototype.get = function (objectId) {
        return _.find(this.objects, function (object) {
            return object.id === objectId;
        });
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
        this.socket = io.connect('http://localhost:8001');
        this.setListeners();

        this.socket.emit('newGame', {
            nickname: nickname
        });
    };

    GameServerConnection.prototype.connectToGame = function (gameId, nickname) {
        var that = this;

        this.socket = io.connect('http://localhost:8001');
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

    var context, lastTime, currentTime, paused = false, running = false, isHost = false, gameId, elapsedTime = 0;

    function getElapsedTime() {
        return elapsedTime;
    }
    Game.getElapsedTime = getElapsedTime;

    function init(gameId, nickname) {
        if (typeof gameId === "undefined") { gameId = null; }
        if (typeof nickname === "undefined") { nickname = ""; }
        var gameServerConn = GameServerConnection.getInstance(), objectRepo = ObjectRepository.getInstance();

        isHost = _.isNull(gameId);
        context = $("#canvas")[0].getContext("2d");

        gameServerConn.on('change:connected', function (model, connected) {
            if (connected) {
                (isHost) ? objectRepo.addObject(new Models.Player(0, 0)) : objectRepo.addObject(new Models.Player(Game.CANVAS_WIDTH - Drawing.Paddle.PADDLE_WIDTH, 0));

                if (gameId === null)
                    objectRepo.addObject(new Models.Ball());

                gameId = gameServerConn.get('gameId');
            }
        });

        gameServerConn.on('change:opponentPosition', function (model, pos) {
            if (!running) {
                objectRepo.addObject(new Models.Opponent(pos.x, pos.y));

                if (!objectRepo.get("ball"))
                    objectRepo.addObject(new Models.RemoteBall());

                running = true;
                run();
            }
        });

        (gameId === null) ? gameServerConn.newGame(nickname) : gameServerConn.connectToGame(gameId, nickname);
    }
    Game.init = init;

    function pause() {
        paused = true;
    }
    Game.pause = pause;

    function unpaused() {
        paused = false;
    }
    Game.unpaused = unpaused;

    function restart() {
        var objectRepo = ObjectRepository.getInstance();

        paused = true;

        setTimeout(function () {
            objectRepo.clean();
            objectRepo.addObject(new Models.Player());
            objectRepo.addObject(new Models.Opponent());
            objectRepo.addObject(new Models.Ball());
            paused = false;
        }, 2000);
    }
    Game.restart = restart;

    function run() {
        lastTime = currentTime = Date.now();
        requestAnimFrame(runLoop);

        function runLoop() {
            lastTime = currentTime;
            currentTime = Date.now();
            elapsedTime = currentTime - lastTime;

            if (!paused) {
                update();
                draw();
            }

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

        gameServer.on('change:connected', function (model, connected) {
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
