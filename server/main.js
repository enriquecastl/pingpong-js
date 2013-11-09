var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _ = require('underscore'), uuid = require('node-uuid'), Backbone = require('backbone');

var Utils;
(function (Utils) {
    function isValidPosition(position) {
        return _.isObject(position) && _.isNumber(position.x) && _.isNumber(position.y);
    }
    Utils.isValidPosition = isValidPosition;
})(Utils || (Utils = {}));

var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        _super.apply(this, arguments);
    }
    Player.prototype.initialize = function (nickname, socket) {
        var model = this;

        if (!_.isString(nickname) || nickname.length <= 0)
            throw new Error("invalid nickname");

        this.set('nickname', nickname);
        this.socket = socket;

        this.socket.on('newPosition', function (position) {
            if (Utils.isValidPosition(position)) {
                console.log("setting position");
                console.log(position);
                model.set('position', position);
            } else {
                console.log("Invalid position");
                console.log(position);
            }
        });

        this.on('change:gameId', function (model, gameId) {
            model.socket.emit('connectionSuccess', {
                gameId: gameId
            });
        });
    };

    Player.prototype.notifyOponentPosition = function (position) {
        this.socket.emit('opponentPosition', position);
    };

    Player.prototype.notifyBallPosition = function (position) {
        this.socket.emit('ballPosition', position);
    };
    return Player;
})(Backbone.Model);

var Game = (function (_super) {
    __extends(Game, _super);
    function Game() {
        _super.apply(this, arguments);
        this.opposites = {
            'host': 'guest',
            'guest': 'host'
        };
    }
    Game.newGame = function (host) {
        var game = new Game(host);
        return game;
    };

    Game.prototype.initialize = function (host) {
        var model = this;

        this.set('id', uuid.v4().split('-')[0]);
        this.addPlayer("host", host);

        host.socket.on('ballPosition', function (ballPosition) {
            if (Utils.isValidPosition(ballPosition) && model.hasGuest()) {
                model.guest.notifyBallPosition(ballPosition);
            }
        });
    };

    Game.prototype.setGuest = function (guest) {
        this.addPlayer("guest", guest);
    };

    Game.prototype.hasGuest = function () {
        return (this.guest instanceof Player);
    };

    Game.prototype.addPlayer = function (playerPosition, player) {
        var that = this;

        if (playerPosition !== "host" && playerPosition !== "guest")
            throw new Error("Invalid player position");

        if (!(player instanceof Player))
            throw new Error("invalid " + playerPosition + " player");
else
            that[playerPosition] = player;

        player.on('change:position', function (model, position) {
            that.notifyOpposite(playerPosition, position);
        });

        if (playerPosition === "guest")
            player.notifyOponentPosition(that["host"].get('position'));

        player.set('gameId', this.get('id'));
    };

    Game.prototype.notifyOpposite = function (playerPosition, position) {
        var opposite = this[this.opposites[playerPosition]];

        if (opposite instanceof Player)
            opposite.notifyOponentPosition(position);
    };
    return Game;
})(Backbone.Model);

var GameServer = (function () {
    function GameServer() {
        this.app = require('http').createServer(this.handler);
        this.io = require('socket.io').listen(this.app);
        this.fs = require('fs');
        this.games = [];
        var server = this;

        GameServer.instance = server;

        this.app.listen(8001);
        this.io.sockets.on('connection', function (socket) {
            socket.on('newGame', function (data) {
                var host = new Player(data.nickname, socket);
                server.games.push(Game.newGame(host));
            });

            socket.on('connectToGame', function (data) {
                var game = server.findGameById(data.gameId);

                (game) ? game.setGuest(new Player(data.nickname, socket)) : socket.emit('connectError', "No game found");
            });
        });
    }
    GameServer.prototype.findGameById = function (id) {
        return _.find(this.games, function (game) {
            return game.get('id') === id;
        });
    };

    GameServer.prototype.handler = function (req, res) {
        var fileName = __dirname + ((req.url === '/') ? '/../index.html' : '/../' + req.url);

        GameServer.instance.fs.readFile(fileName, function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
    };
    return GameServer;
})();

var server = new GameServer();
