var _ = require('underscore'),
    uuid = require('node-uuid'),
    Backbone = require('backbone');

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
    export function isValidPosition(position) {
        return _.isObject(position) && _.isNumber(position.x) && _.isNumber(position.y);
    }
}

class Player extends Backbone.Model {
    initialize(nickname, socket) {
        var model = this;

        if(!_.isString(nickname) || nickname.length <= 0)
            throw new Error("invalid nickname");

        this.set('nickname', nickname);
        this.socket = socket;

        this.socket.on('newPosition', function(position){
            if(Utils.isValidPosition(position)){
                console.log("setting position");
                console.log(position);
                model.set('position', position);
            }else{
                console.log("Invalid position");
                console.log(position);
            }
        });

        this.on('change:gameId', function(model, gameId){
            model.socket.emit('connectionSuccess', {
                gameId : gameId
            });
        });
    }

    notifyOponentPosition(position) {
        this.socket.emit('opponentPosition', position);
    }

    notifyBallPosition(position) {
        this.socket.emit('ballPosition', position);
    }
}

class Game extends Backbone.Model {
    opposites = {
        'host' : 'guest',
        'guest' : 'host'
    };

    static newGame(host : Player){
        var game = new Game(host);
        return game;
    }

    initialize(host : Player) {
        var model = this;

        this.set('id', uuid.v4().split('-')[0]);
        this.addPlayer("host", host);

        host.socket.on('ballPosition', function(ballPosition){
            if(Utils.isValidPosition(ballPosition) && model.hasGuest()){
                model.guest.notifyBallPosition(ballPosition);
            }
        });
    }

    setGuest(guest : Player) {
        this.addPlayer("guest", guest);
    }

    hasGuest() {
        return (this.guest instanceof Player);
    }

    addPlayer(playerPosition : string, player : Player) {
        var that = this;

        if(playerPosition !== "host" && playerPosition !== "guest")
            throw new Error("Invalid player position");

        if(!(player instanceof Player))
            throw new Error("invalid "+ playerPosition +" player")
        else
            that[playerPosition] = player;

        player.on('change:position', function(model, position){
            that.notifyOpposite(playerPosition, position);
        });

        if(playerPosition === "guest")
            player.notifyOponentPosition(that["host"].get('position'));

        player.set('gameId', this.get('id'));
    }

    notifyOpposite(playerPosition, position){
        var opposite = this[this.opposites[playerPosition]];

        if(opposite instanceof Player)
            opposite.notifyOponentPosition(position);
    }
}

class GameServer {
    app = require('http').createServer(this.handler);
    io = require('socket.io').listen(this.app);
    fs = require('fs');
    games = [];

    constructor(){
        var server = this;

        GameServer.instance = server;

        this.app.listen(8001);
        this.io.sockets.on('connection', function(socket) {
            socket.on('newGame', function(data){
                var host = new Player(data.nickname, socket);
                server.games.push(Game.newGame(host));
            });

            socket.on('connectToGame', function(data){
                var game = server.findGameById(data.gameId);

                (game) ? game.setGuest(new Player(data.nickname, socket)) 
                : socket.emit('connectError', "No game found");
            });
        });
    }

    findGameById(id) {
        return _.find(this.games, function(game){
            return game.get('id') === id;
        });
    }

    handler(req, res) {
        var fileName = __dirname + ((req.url === '/') ? '/../index.html' : '/../' + req.url);
        
        GameServer.instance.fs.readFile(fileName, function(err, data) {
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
