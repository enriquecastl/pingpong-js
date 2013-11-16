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

    var GameObject = (function (_super) {
        __extends(GameObject, _super);
        function GameObject(point) {
            _super.call(this);
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
    })(Backbone.Model);
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
            return this.collideWithLeftCanvas() || this.collideWithRightCanvas();
        };

        CircularGameObject.prototype.collideWithLeftCanvas = function () {
            return this.point.distanceFromPointCoords(0) <= this.radius;
        };

        CircularGameObject.prototype.collideWithRightCanvas = function () {
            return this.point.distanceFromPointCoords(Game.CANVAS_WIDTH) <= this.radius;
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
            this.id = "player";

            _super.call(this, new Models.Point(x, y), Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            this.setSprite(new Drawing.Paddle());

            serverConn.sendPosition(_.pick(that.point, 'x', 'y'));

            serverConn.on('change:scoreInfo', function (model, scoreInfo) {
                if (scoreInfo.host)
                    that.set('score', scoreInfo.host);
            });
        }
        Player.prototype.initialize = function () {
            this.set('score', 0);
        };

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
            return (Game.getInstance().getElapsedTime() / 1000) * this.VELOCITY;
        };

        Player.prototype.increaseScore = function () {
            this.set('score', this.get('score') + 1);
            GameServerConnection.getInstance().notifyScore('host', this.get('score'));
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

            serverConn.on('change:scoreInfo', function (model, scoreInfo) {
                if (scoreInfo.guest)
                    that.set('score', scoreInfo.guest);
            });
        }
        Opponent.prototype.initialize = function () {
            this.set('score', 0);
        };

        Opponent.prototype.increaseScore = function () {
            this.set('score', this.get('score') + 1);
            GameServerConnection.getInstance().notifyScore('guest', this.get('score'));
        };
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

            if (this.collideWithTopBottomCanvas()) {
                this.yDirection = -this.yDirection;
            } else if (player.collideWithCircleObject(this) || opponent.collideWithCircleObject(this)) {
                this.doXCalculations();
            } else if (this.collideWithLeftCanvas()) {
                opponent.increaseScore();
                this.doXCalculations();
            } else if (this.collideWithRightCanvas()) {
                player.increaseScore();
                this.doXCalculations();
            }

            this.calculateVelocity();
            this.move(this.vX, this.vY, true);
            serverConn.sendBallPosition(_.pick(this.point, 'x', 'y'));
        };

        Ball.prototype.doXCalculations = function () {
            this.xDirection = -this.xDirection;
            this.calculateAngle();
        };

        Ball.prototype.calculateAngle = function () {
            var angle = 0, avoidMin = Utils.degreesToRadians(-10), avoidMax = Utils.degreesToRadians(10);

            while (angle == 0 || (angle >= avoidMin && angle <= avoidMax))
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle;

            this.vAngle = angle;
        };

        Ball.prototype.calculateVelocity = function () {
            var elapsedMs = (Game.getInstance().getElapsedTime() / 1000);
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
        this.socket = io.connect(location.origin);
        this.setListeners();

        this.socket.emit('newGame', {
            nickname: nickname
        });
    };

    GameServerConnection.prototype.connectToGame = function (gameId, nickname) {
        var that = this;

        this.socket = io.connect(location.origin);
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

    GameServerConnection.prototype.isConnected = function () {
        return this.get('connected');
    };

    GameServerConnection.prototype.isOpponentConnected = function () {
        return this.get('opponentConnected');
    };

    GameServerConnection.prototype.notifyScore = function (role, score) {
        if (role === "host")
            this.socket.emit('hostScore', score);
else
            this.socket.emit('guestScore', score);
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

            if (!that.get('opponentConnected'))
                that.set('opponentConnected', true);
        });

        this.socket.on('ballPosition', function (pos) {
            that.set('ballPosition', pos);
        });

        this.socket.on('scoreInfo', function (scoreInfo) {
            that.set('scoreInfo', scoreInfo);
        });
    };
    return GameServerConnection;
})(Backbone.Model);

var Game = (function (_super) {
    __extends(Game, _super);
    function Game() {
        _super.apply(this, arguments);
    }
    Game.getInstance = function () {
        if (Game.instance == null)
            Game.instance = new Game();

        return Game.instance;
    };

    Game.prototype.getElapsedTime = function () {
        return this.elapsedTime;
    };

    Game.prototype.connect = function () {
        var gameServerConn = GameServerConnection.getInstance(), objectRepo = ObjectRepository.getInstance(), that = this, CANVAS_WIDTH = Game.CANVAS_WIDTH;

        gameServerConn.on('change:connected', function (model, connected) {
            if (connected) {
                if (that.isHost()) {
                    objectRepo.addObject(new Models.Player(0, 0));
                    objectRepo.addObject(new Models.Ball());
                } else {
                    objectRepo.addObject(new Models.Player(CANVAS_WIDTH - Drawing.Paddle.PADDLE_WIDTH, 0));
                }

                that.set('gameId', gameServerConn.get('gameId'));
            }
        });

        gameServerConn.on('change:opponentConnected', function (model, connected) {
            var pos = model.get('opponentPosition');

            if (connected) {
                objectRepo.addObject(new Models.Opponent(pos.x, pos.y));

                if (!objectRepo.get("ball"))
                    objectRepo.addObject(new Models.RemoteBall());
            }
        });

        this.isHost() ? gameServerConn.newGame(this.get('nickname')) : gameServerConn.connectToGame(this.get('gameId'), this.get('nickname'));
    };

    Game.prototype.isHost = function () {
        return this.get('gameId') == null;
    };

    Game.prototype.paused = function () {
        return this.get('paused');
    };

    Game.prototype.pause = function () {
        this.set('paused', true);
    };

    Game.prototype.unpause = function () {
        this.set('paused', false);
    };

    Game.prototype.elapsedTime = function () {
        return this.elapsedTime;
    };

    Game.prototype.restart = function () {
        var objectRepo = ObjectRepository.getInstance();

        this.pause();

        setTimeout(function () {
            objectRepo.clean();
            objectRepo.addObject(new Models.Player());
            objectRepo.addObject(new Models.Opponent());
            objectRepo.addObject(new Models.Ball());
            this.unpause();
        }, 2000);
    };

    Game.prototype.run = function () {
        var that = this;

        this.lastTime = this.currentTime = Date.now();
        requestAnimFrame(runLoop);

        function runLoop() {
            that.lastTime = that.currentTime;
            that.currentTime = Date.now();
            that.elapsedTime = that.currentTime - that.lastTime;

            if (!that.paused()) {
                that.update();
                that.draw();
            }

            requestAnimFrame(runLoop);
        }
    };

    Game.prototype.update = function () {
        var objects = ObjectRepository.getInstance().getObjects();

        for (var i = 0; i < objects.length; i++)
            objects[i].update();
    };

    Game.prototype.draw = function () {
        var context = GameUI.instance.getCanvas();

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
    };
    return Game;
})(Backbone.Model);

Game.CANVAS_WIDTH = 600;
Game.CANVAS_HEIGHT = 400;

var GameUI = (function (_super) {
    __extends(GameUI, _super);
    function GameUI() {
        _super.apply(this, arguments);
    }
    GameUI.prototype.initialize = function () {
        this.setElement('.game-ui');
    };

    GameUI.prototype.start = function () {
        var player = ObjectRepository.getInstance().get('player'), opponent = ObjectRepository.getInstance().get('opponent'), that = this, $firstScore = this.$el.find(".first-score"), $lastScore = this.$el.find(".last-score");

        player.on('change:score', function (model, score) {
            if (Game.getInstance().isHost())
                $firstScore.text(score);
else
                $lastScore.text(score);
        });

        opponent.on('change:score', function (model, score) {
            if (Game.getInstance().isHost())
                $lastScore.text(score);
else
                $firstScore.text(score);
        });

        this.render();
    };

    GameUI.prototype.render = function () {
        var counter = 3, timeId, that = this, $counter = this.$el.find(".counter");

        this.$el.show();

        timeId = setInterval(function () {
            counter -= 1;

            $counter.find(".counter-number").text(counter);

            if (counter <= 0) {
                clearInterval(timeId);
                $counter.html("");
                Game.getInstance().run();
            }
        }, 1000);
    };

    GameUI.prototype.getCanvas = function () {
        return this.$el.find("#canvas")[0].getContext("2d");
    };
    return GameUI;
})(Backbone.View);

GameUI.instance = new GameUI();

var ConnectDialog = (function (_super) {
    __extends(ConnectDialog, _super);
    function ConnectDialog() {
        this.events = events = {
            'change .nickname': 'setNickname',
            'change #game-id': 'setGameId',
            'click .btn-connect': 'connect',
            'click a[href=#new-game]': 'setValidators',
            'click a[href=#connect]': 'setValidators'
        };
        _super.call(this);
    }
    ConnectDialog.prototype.initialize = function () {
        var that = this, timeId, serverConn = GameServerConnection.getInstance();

        this.delegateEvents();
        this.setElement('#connect-dialog');
        this.render();

        serverConn.on('change:connected', function (model, connected) {
            if (connected) {
                that.$el.find(".connect-screen").fadeOut(function () {
                    that.showWaitingBox();
                });
            }
        });

        serverConn.on('change:opponentConnected', function (model, connected) {
            that.$el.modal('hide');
            setTimeout(function () {
                GameUI.instance.start();
            });
        });
    };

    ConnectDialog.prototype.showWaitingBox = function () {
        var $waitingBox = this.$el.find(".waiting-for-opponent"), $message = $waitingBox.find(".message"), that = this;

        $waitingBox.show();
        $waitingBox.find(".game-id").text(GameServerConnection.getInstance().get('gameId'));

        $message.toggleClass("fade-in");

        setInterval(function () {
            $message.toggleClass("fade-in");
        }, 1000);
    };

    ConnectDialog.prototype.render = function () {
        this.$el.modal('show');
    };

    ConnectDialog.prototype.setNickname = function (e) {
        Game.getInstance().set('nickname', $(e.target).val());
    };

    ConnectDialog.prototype.setGameId = function (e) {
        Game.getInstance().set('gameId', $(e.target).val());
    };

    ConnectDialog.prototype.connect = function (e) {
        var valid = true;

        this.$el.find("input").each(function () {
            valid = valid && this.checkValidity();
        });

        if (!valid)
            this.$el.find(".submitter").click();
else
            Game.getInstance().connect();
    };

    ConnectDialog.prototype.setValidators = function (e) {
        this.$el.find(".tab-pane").find("input").attr("required", null);
        this.$el.find($(e.target).attr("href")).find("input").attr("required", "required");
    };
    return ConnectDialog;
})(Backbone.View);

new ConnectDialog();
