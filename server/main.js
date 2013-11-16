var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _ = require('underscore'), uuid = require('node-uuid'), Backbone = require('backbone'), connect = require('connect'), http = require('http'), io = require('socket.io');

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
            if (Utils.isValidPosition(position))
                model.set('position', position);
        });

        this.socket.on('pauseStatus', function (status) {
            model.set('pauseStatus', status);
        });

        this.on('change:gameId', function (model, gameId) {
            model.socket.emit('connectionSuccess', {
                gameId: gameId
            });
        });
    };

    Player.prototype.notifyOpponentPosition = function (position) {
        this.socket.emit('opponentPosition', position);
    };

    Player.prototype.notifyPauseStatus = function (pauseStatus) {
        this.socket.emit('pauseStatus', pauseStatus);
    };
    return Player;
})(Backbone.Model);

var Guest = (function (_super) {
    __extends(Guest, _super);
    function Guest() {
        _super.apply(this, arguments);
    }
    Guest.prototype.initialize = function (nickname, socket) {
        Player.prototype.initialize.call(this, nickname, socket);
    };

    Guest.prototype.notifyBallPosition = function (position) {
        this.socket.emit('ballPosition', position);
    };

    Guest.prototype.notifyScoreInfo = function (role, score) {
        var scoreInfo = {};

        scoreInfo[role] = score;
        this.socket.emit('scoreInfo', scoreInfo);
    };
    return Guest;
})(Player);

var Host = (function (_super) {
    __extends(Host, _super);
    function Host() {
        _super.apply(this, arguments);
    }
    Host.prototype.initialize = function (nickname, socket) {
        var that = this;

        Player.prototype.initialize.call(this, nickname, socket);

        socket.on('ballPosition', function (ballPosition) {
            if (Utils.isValidPosition(ballPosition))
                that.set('ballPosition', ballPosition);
        });

        socket.on('hostScore', function (hostScore) {
            if (_.isNumber(hostScore))
                that.set('hostScore', hostScore);
        });

        socket.on('guestScore', function (guestScore) {
            if (_.isNumber(guestScore))
                that.set('guestScore', guestScore);
        });
    };
    return Host;
})(Player);

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

        host.on('change:ballPosition', function (m, pos) {
            if (model.hasGuest())
                model.guest.notifyBallPosition(pos);
        });

        host.on('change:hostScore', function (m, score) {
            if (model.hasGuest())
                model.guest.notifyScoreInfo('guest', score);
        });

        host.on('change:guestScore', function (m, score) {
            if (model.hasGuest())
                model.guest.notifyScoreInfo('host', score);
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
            that.notifyOppositePosition(playerPosition, position);
        });

        player.on('change:pauseStatus', function (model, status) {
            console.log("updated pause status " + status);
            that.notifyOppositePauseStatus(playerPosition, status);
        });

        if (playerPosition === "guest")
            player.notifyOpponentPosition(that["host"].get('position'));

        player.set('gameId', this.get('id'));
    };

    Game.prototype.notifyOppositePauseStatus = function (playerPosition, status) {
        var opposite = this.getOpposite(playerPosition);

        if (opposite instanceof Player)
            opposite.notifyPauseStatus(status);
    };

    Game.prototype.notifyOppositePosition = function (playerPosition, position) {
        var opposite = this.getOpposite(playerPosition);

        if (opposite instanceof Player)
            opposite.notifyOpponentPosition(position);
    };

    Game.prototype.getOpposite = function (playerPosition) {
        return this[this.opposites[playerPosition]];
    };
    return Game;
})(Backbone.Model);

var GameServer = (function () {
    function GameServer() {
        this.games = [];
        var server, connectInstance, socketServer, that = this;

        connectInstance = connect().use(connect.static(__dirname + '/../dist/'));

        server = http.createServer(connectInstance).listen((process.env.PORT || 8001));
        socketServer = io.listen(server);
        socketServer.set('log level', 1);

        socketServer.sockets.on('connection', function (socket) {
            socket.on('newGame', function (data) {
                var host = new Host(data.nickname, socket);
                that.games.push(Game.newGame(host));
            });

            socket.on('connectToGame', function (data) {
                var game = that.findGameById(data.gameId);

                (game) ? game.setGuest(new Guest(data.nickname, socket)) : socket.emit('connectError', "No game found");
            });
        });
    }
    GameServer.prototype.findGameById = function (id) {
        return _.find(this.games, function (game) {
            return game.get('id') === id;
        });
    };
    return GameServer;
})();

var server = new GameServer();
