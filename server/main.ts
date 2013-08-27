var _ = require('underscore')
    uuid = require('node-uuid');

module Models {

    export class Game {
        id : string;
        players = [];
        static games = [];

        constructor(gameId : string) {
            if(!_.isString(gameId))
                throw "invalid id";

            if(Game.get(gameId))
                throw "game with this id already exists";

            this.id = gameId;
        }

        addPlayer(player : Player) {
            this.players.push(player);
        }

        notifyAll(action : Action) {
            _.each(this.players, function(player){
                player.actionHandler.sendAction(action);
            });
        }

        findByNickname(nickname : string) {
            return _.find(this.players, function(player){
                return player.nickname == nickname;
            });

            return null;
        }

        static newGame(){
            game = new Game(uuid.v4());
            return game;
        }

        static findByPlayer(player : Player) {
            return _.find(Game.games, function(game){
                return _.some(game.players, function(p) {
                    return p == player;
                });
            });
        }

        static get(gameId : string) {
            return _.find(Game.games, function(game){
                return game.id === gameId;
            });
        }
    }

    export class Player {

        constructor(actionHandler : Actions.ActionHandler) {
            var player = this;
            this.playerId = uuid.v4();

            actionHandler.receiveAction(function(action) {
                actionHandler.sendAction(action.execute(player));
            });
        }

        getGame() {
            return Game.findByPlayer(this);
        }
    }
}

module Actions {

    export class ActionHandler {
        socket;

        constructor(socket) { 
            this.socket = socket;
        }

        receiveAction(callback) {
            var that = this;

            this.socket.on('message', function(message){
                if(!_.isObject(message)) return;
                if(!_.isString(message.action)) return;
                if(!_.isObject(message.data)) return;

                var action = ActionRegistry.newAction(message.action, message.data);

                (action != null) ? callback(action) : that.sendAction(_.extend({
                    error : "invalid action"
                }, message));
            });
        }

        sendAction(action) {
            this.socket.emit('message', action);
        }
    }

    export class ActionRegistry {
        static registeredActions  = {}

        static newAction(type, data) {
            var action = _.find(ActionRegistry.registeredActions, function(action, actionType){
                return actionType === type;
            });

            return (action) ? new action(data) : null;
        }

        static registerAction(actionType : string, action : Action) {
            if(action == null) return;
            ActionRegistry.registeredActions[actionType] = action;
        }
    }

    export class Action {
        constructor(data) {
            if(!_.isObject(data))
                throw "Please pass valid data to the action"

            this.data = data || {};
        }

        getType() {
            return "";
        }

        put(key, data) {
            this.data[key] = data;
        }

        toMessage() {
            var that = this;

            return {
                action : this.getType(),
                data : this.data
            }
        }

        execute(who) {
            if(who == null)
                throw "invalid who";
        }
    }

    export class ConnectToGame extends Action {
        constructor(data) {
            super(data);
        }

        execute(who) {
            var game,
                gameId = this.data.gameId,
                nickname = this.data.nickname;

            if(_.isString(gameId)){
                game = Models.Game.get(gameId);

                if(!game)
                    return ActionRegistry.newAction('connectToGame', {
                        me : who,
                        error : "Didn't find a game with that ID";
                    });
            }else{
                game = Models.Game.newGame();
            }

            if(!_.isString(nickname) || nickname.length < 4)
                return ActionRegistry.newAction('connectToGame', {
                    me : who,
                    error : "Your nickname should have at least 4 characters";
                });

            who.nickname = nickname;
            game.addPlayer(who);

            return ActionRegistry.newAction('connectToGame', {
                game : game,
                me : who
            });
        }

        getType() {
            return this.type;
        }
    }

    ActionRegistry.registerAction("connectToGame", ConnectToGame);
}

class GameServer {
    app = require('http').createServer(this.handler);
    io = require('socket.io').listen(this.app);
    fs = require('fs');
    players = [];

    constructor(){
        var that = GameServer.that = this;
        this.app.listen(8000);
        this.io.sockets.on('connection', function(socket) {
            var player = new Models.Player(new Actions.ActionHandler(socket));
            that.players.push(player);
        });
    }

    handler(req, res) {
        var fileName = __dirname + ((req.url === '/') ? '/../index.html' : '/../' + req.url);
        
        GameServer.that.fs.readFile(fileName, function(err, data) {
            if(err){
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
    }
}

var server = new GameServer();