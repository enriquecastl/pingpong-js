var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _ = require('underscore');
var uuid = require('node-uuid');

var Models;
(function (Models) {
    var Game = (function () {
        function Game(gameId) {
            this.players = [];
            if (!_.isString(gameId))
                throw "invalid id";

            if (Game.get(gameId))
                throw "game with this id already exists";

            this.id = gameId;
        }
        Game.prototype.addPlayer = function (player) {
            var registry = Actions.ActionRegistry;
            players = this.players;

            this.notifyAll(registry.newAction("newOpponent", {
                opponent: [player]
            }), player);

            player.getActionHandler().sendAction(registry.newAction("newOpponent", {
                opponent: players
            }));

            player.gameId = this.id;
            players.push(player);
        };

        Game.prototype.notifyAll = function (action, except) {
            _.each(this.players, function (player) {
                if (player != except) {
                    player.getActionHandler().sendAction(action);
                }
            });
        };

        Game.prototype.findByNickname = function (nickname) {
            return _.find(this.players, function (player) {
                return player.nickname == nickname;
            });

            return null;
        };

        Game.newGame = function () {
            game = new Game(uuid.v4());
            Game.games.push(game);
            return game;
        };

        Game.findByPlayer = function (player) {
            return _.find(Game.games, function (game) {
                return _.some(game.players, function (p) {
                    return p == player;
                });
            });
        };

        Game.get = function (gameId) {
            return _.find(Game.games, function (game) {
                return game.id === gameId;
            });
        };
        Game.games = [];
        return Game;
    })();
    Models.Game = Game;

    var Player = (function () {
        function Player(actionHandler) {
            var player = this;

            this.playerId = uuid.v4();

            this.getActionHandler = function () {
                return actionHandler;
            };

            actionHandler.receiveAction(function (action) {
                var result = action.execute(player);

                if (_.isObject(result))
                    actionHandler.sendAction(result);
            });
        }
        Player.prototype.getGame = function () {
            return Game.findByPlayer(this);
        };

        Player.prototype.toJson = function () {
            return _.omit(this, 'actionHandler');
        };
        return Player;
    })();
    Models.Player = Player;
})(Models || (Models = {}));

var Actions;
(function (Actions) {
    var ActionHandler = (function () {
        function ActionHandler(socket) {
            this.socket = socket;
        }
        ActionHandler.prototype.receiveAction = function (callback) {
            var that = this;

            this.socket.on('message', function (message) {
                if (!_.isObject(message))
                    return;
                if (!_.isString(message.action))
                    return;
                if (!_.isObject(message.data))
                    return;

                var action = ActionRegistry.newAction(message.action, message.data);

                (action != null) ? callback(action) : that.sendAction(_.extend({
                    error: "invalid action"
                }, message));
            });
        };

        ActionHandler.prototype.sendAction = function (action) {
            this.socket.emit('message', action);
        };
        return ActionHandler;
    })();
    Actions.ActionHandler = ActionHandler;

    var ActionRegistry = (function () {
        function ActionRegistry() {
        }
        ActionRegistry.newAction = function (type, data) {
            var action = _.find(ActionRegistry.registeredActions, function (action, actionType) {
                return actionType === type;
            });

            return (action) ? new action(data) : new Action(type, data);
        };

        ActionRegistry.registerAction = function (actionType, action) {
            if (action == null)
                return;
            ActionRegistry.registeredActions[actionType] = action;
        };
        ActionRegistry.registeredActions = {};
        return ActionRegistry;
    })();
    Actions.ActionRegistry = ActionRegistry;

    var Action = (function () {
        function Action(type, data) {
            if (!_.isObject(data))
                throw "Please pass valid data to the action";

            this.data = data || {};
            this.type = type;
        }
        Action.prototype.getType = function () {
            return "";
        };

        Action.prototype.put = function (key, data) {
            this.data[key] = data;
        };

        Action.prototype.toMessage = function () {
            var that = this;

            return {
                action: this.getType(),
                data: this.data
            };
        };

        Action.prototype.execute = function (who) {
            if (who == null)
                throw "invalid who";
        };
        return Action;
    })();
    Actions.Action = Action;

    var ConnectToGame = (function (_super) {
        __extends(ConnectToGame, _super);
        function ConnectToGame(data) {
            _super.call(this, null, data);

            this.type = "connectToGame";
        }
        ConnectToGame.prototype.execute = function (who) {
            var game, gameId = this.data.gameId, nickname = this.data.nickname, opponent;

            if (_.isString(gameId)) {
                game = Models.Game.get(gameId);

                if (!game)
                    return ActionRegistry.newAction('connectToGame', {
                        me: who,
                        error: "Couldn't find a game with that ID"
                    });
            } else {
                game = Models.Game.newGame();
            }

            if (!_.isString(nickname) || nickname.length < 4)
                return ActionRegistry.newAction('connectToGame', {
                    me: who,
                    error: "Your nickname should have at least 4 characters"
                });

            who.nickname = nickname;
            game.addPlayer(who);

            return ActionRegistry.newAction('connectToGame', {
                game: game,
                me: who
            });
        };

        ConnectToGame.prototype.getType = function () {
            return this.type;
        };
        return ConnectToGame;
    })(Action);
    Actions.ConnectToGame = ConnectToGame;

    ActionRegistry.registerAction("connectToGame", ConnectToGame);

    var PlayerMoved = (function (_super) {
        __extends(PlayerMoved, _super);
        function PlayerMoved(data) {
            _super.call(this, null, data);

            this.type = "playerMoved";
        }
        PlayerMoved.prototype.execute = function (who) {
            var game = Models.Game.get(who.gameId);
            game.notifyAll(ActionRegistry.newAction('opponentMoved', this.data), who);
        };
        return PlayerMoved;
    })(Action);
    Actions.PlayerMoved = PlayerMoved;

    ActionRegistry.registerAction("playerMoved", PlayerMoved);
})(Actions || (Actions = {}));

var GameServer = (function () {
    function GameServer() {
        this.app = require('http').createServer(this.handler);
        this.io = require('socket.io').listen(this.app);
        this.fs = require('fs');
        this.players = [];
        var that = GameServer.that = this;

        this.app.listen(8000);
        this.io.sockets.on('connection', function (socket) {
            var player = new Models.Player(new Actions.ActionHandler(socket));
            that.players.push(player);
        });
    }
    GameServer.prototype.handler = function (req, res) {
        var fileName = __dirname + ((req.url === '/') ? '/../index.html' : '/../' + req.url);

        GameServer.that.fs.readFile(fileName, function (err, data) {
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
