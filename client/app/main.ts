window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60)
          }
})()

declare var $: any 
declare module Backbone {
    export class Model {
        constructor (attr? , opts? )
        get(name: string): any
        set(name: string, val: any): void
        set(obj: any): void
        save(attr? , opts? ): void
        destroy(): void
        bind(ev: string, f: Function, ctx?: any): void
        toJSON(): any
    }
    export class Collection {
        constructor (models? , opts? )
        bind(ev: string, f: Function, ctx?: any): void
        collection: Model
        length: number
        create(attrs, opts? ): Collection
        each(f: (elem: any) => void ): void
        fetch(opts?: any): void
        last(): any
        last(n: number): any[]
        filter(f: (elem: any) => any): Collection
        without(...values: any[]): Collection
    }
    export class View {
        constructor (options? )
        $(selector: string): any
        el: HTMLElement
        $el: any
        model: Model
        remove(): void
        delegateEvents: any
        make(tagName: string, attrs? , opts? ): View
        setElement(element: HTMLElement, delegate?: bool): void
        tagName: string
        events: any

        static extend: any
    }
}


module Utils {
    export  function radiansToDegrees(radians){
        return radians * (180 / Math.PI)
    }

    export function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180)
    }
}

module Drawing {
    export class Sprite {
        public x : number
        public y : number
        public width : number
        public height : number

        constructor(x : number, y : number, width : number, height : number) {
            this.setPosition(x, y)
            this.setDimensions(width, height)
        }

        setPosition(x : number, y : number) {
            this.x = x || 0
            this.y = y || 0
        }

        setDimensions(width : number, height : number) {
            this.width = width || 0
            this.height = height || 0
        }

        draw(context) {

        }
    }

    export class Paddle extends Sprite {
        COLOR : string = "#fff"
        public static PADDLE_HEIGHT : number = 75
        public static PADDLE_WIDTH : number = 20

        constructor(x : number, y : number) {
            super(x, y, Paddle.PADDLE_WIDTH, Paddle.PADDLE_HEIGHT)
        }

        draw(context) {
            super.draw()
            context.fillStyle = this.COLOR
            context.fillRect(this.x, this.y, this.width, this.height)
        }
    }

    export class Ball extends Sprite {
        color : string = "#fff"
        radius : number

        constructor(radius) {
            super(0, 0, 0, 0)
            this.radius = radius
        }

        draw(context) {
            super.draw()
            context.fillStyle = this.color
            context.beginPath()
            context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false)
            context.closePath()
            context.fill()
        }
    }
}

var Key = {
    _pressed: {},

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    isDown: function(keyCode) {
        return this._pressed[keyCode]
    },

    onKeydown: function(event) {
        this._pressed[event.keyCode] = true
    },

    onKeyup: function(event) {
        delete this._pressed[event.keyCode]
    }
}

window.addEventListener('keyup', function(event) { Key.onKeyup(event) }, false)
window.addEventListener('keydown', function(event) { Key.onKeydown(event) }, false)

module Models {

    export class Point {
        private x : number
        private y : number

        constructor(x = 0, y = 0) {
            this.x = x
            this.y = y
        }

        getX() {
            return this.x
        }

        getY() {
            return this.y
        }

        move(x = 0, y = 0) {
            this.x += x
            this.y += y
        }

        distanceFromOrigin(){
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
        }

        distanceFromPointCoords(x = this.x, y = this.y) {
            return this.distanceFromPoint(new Point(x, y))
        }

        distanceFromPoint(point : Point) {
            return Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2))
        }
    }

    export class GameObject extends Backbone.Model {
        point : Point
        sprite : Drawing.Sprite

        constructor(point : Point) {
            super()
            this.point = point
        }

        setPosition(x = 0, y = 0) {
            this.point = new Point(x, y)
            this.sprite.setPosition(this.point.getX(), this.point.getY())
        }

        setSprite(sprite : Drawing.Sprite) {
            if(sprite !== null){
                this.sprite = sprite
                this.sprite.setPosition(this.point.getX(), this.point.getY())
            }
        }

        public getSprite() : Drawing.Sprite {
            return this.sprite
        }

        update() {
            return
        }
    }

    export class RectangularGameObject extends GameObject {
        width : number
        height : number

        constructor(point : Point = new Point(0, 0), width = 0, height = 0) {
            super(point)
            this.width = width
            this.height = height
        }

        move(x = 0, y = 0, adjustToCanvas = false) {
            this.point.move(x, y)

            if(adjustToCanvas){
                if(this.point.getX() < 0)
                    this.point = new Point(0, this.point.getY())
                else if(this.right() > Game.CANVAS_WIDTH)
                    this.point = new Point(Game.CANVAS_WIDTH - this.width, this.point.getY())
                else if(this.point.getY() < 0)
                    this.point = new Point(this.point.getX(), 0)
                else if(this.bottom() > Game.CANVAS_HEIGHT)
                    this.point = new Point(this.point.getX(), Game.CANVAS_HEIGHT - this.height)
            }

            this.sprite.setPosition(this.point.getX(), this.point.getY())
        }

        public collideWithRectObject(gameObject : RectangularGameObject) {
            return gameObject.point.getX() <= this.right() &&
                gameObject.right() >= this.point.getX() &&
                gameObject.point.getY() <= this.bottom() &&
                gameObject.bottom() >= this.point.getY()
        }

        public collideWithCircleObject(gameObject : CircularGameObject) {
            return (gameObject.leftMostPoint().getX() <= this.right() &&
            gameObject.rightMostPoint().getX() >= this.point.getX() &&
            gameObject.topMostPoint().getY() <= this.bottom() && 
            gameObject.bottomMostPoint().getY() >= this.point.getY()) ||
            this.pointInsideRectangle(gameObject.point)
        }

        public pointInsideRectangle(point : Point) {
            var pointX = point.getX(),
                pointY = point.getY()

            return pointX <= this.right() && pointX >= this.point.getX() &&
            pointY <= this.bottom() && pointY >= this.point.getY()
        }

        public collideWithCanvas(x = 0, y = 0) {
            return this.collideWithTopBottomCanvas(y) || this.collideWithLeftRightCanvas(x)
        }

        public collideWithTopBottomCanvas(y = 0) {
            return this.y + y <= 0 || this.bottom() + y >= Game.CANVAS_HEIGHT
        }

        public collideWithLeftRightCanvas(x = 0){
            return this.x + x <= 0 || this.right() + x >= Game.CANVAS_WIDTH
        }

        public bottom() : number {
            return this.point.getY() + this.height
        }

        public right() : number {
            return this.point.getX() + this.width
        }
    }

    export class CircularGameObject extends GameObject {
        radius : number = 0.0

        constructor(point = new Point(0, 0), radius = 5) {
            super(point)
            this.radius = radius
        }

        move(x = 0, y = 0, adjustToCanvas = false) {
            this.point.move(x, y)

            if(adjustToCanvas){
                if(this.point.distanceFromPointCoords(0, this.point.getY()) <=  this.radius)
                    this.point = new Point(this.radius, this.point.getY())
                else if(this.point.distanceFromPointCoords(Game.CANVAS_WIDTH, this.point.getY()) <= this.radius)
                    this.point = new Point(Game.CANVAS_WIDTH - this.radius , this.point.getY())
                else if(this.point.distanceFromPointCoords(this.point.getX(), 0) <=  this.radius)
                    this.point = new Point(this.point.getX(), this.radius)
                else if(this.point.distanceFromPointCoords(this.point.getX(), Game.CANVAS_HEIGHT) <= this.radius)
                    this.point = new Point(this.point.getX(), Game.CANVAS_HEIGHT - this.radius)
            }

            this.sprite.setPosition(this.point.getX(), this.point.getY())
        }

        public leftMostPoint(){
            return new Point(this.point.getX() - this.radius, this.point.getY())
        }

        public rightMostPoint() {
            return new Point(this.point.getX() + this.radius, this.point.getY())
        }

        public topMostPoint() {
            return new Point(this.point.getX(), this.point.getY() - this.radius)
        }

        public bottomMostPoint(){
            return new Point(this.point.getX(), this.point.getY() + this.radius)
        }

        public collideWithCanvas(x = 0, y = 0){
            return this.collideWithTopBottomCanvas(y) || this.collideWithLeftRightCanvas(x)
        }

        public collideWithTopBottomCanvas(y = 0) {
            return this.point.distanceFromPointCoords(undefined, 0) <= this.radius ||
            this.point.distanceFromPointCoords(undefined, Game.CANVAS_HEIGHT) <= this.radius
        }

        public collideWithLeftRightCanvas(x = 0) {
            return this.collideWithLeftCanvas() || this.collideWithRightCanvas()
        }

        public collideWithLeftCanvas() {
            return this.point.distanceFromPointCoords(0) <= this.radius 
        }

        public collideWithRightCanvas() {
            return this.point.distanceFromPointCoords(Game.CANVAS_WIDTH) <= this.radius
        }
    }

    export class Player extends RectangularGameObject {
        MIN_Y : number = 0
        VELOCITY : number =  500
        id : string = "player"

        constructor(x = 0, y = 0) {
            var that = this,
                serverConn = GameServerConnection.getInstance()
            
            super(new Models.Point(x, y), Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT)
            this.setSprite(new Drawing.Paddle())

            serverConn.sendPosition(_.pick(that.point, 'x', 'y'))

            serverConn.on('change:scoreInfo', function(model, scoreInfo){
                if(scoreInfo.host)
                    that.set('score', scoreInfo.host)
            })
        }

        initialize() {
            this.set('score', 0)
        }

        update(){
            var serverConn = GameServerConnection.getInstance(),
                moveDistance = this.getDistance(),
                move

            if(Key.isDown(Key.UP)) 
                move = (this.point.getY() - moveDistance < this.MIN_Y) ? 0 : -moveDistance
            else if(Key.isDown(Key.DOWN))
                move = (this.bottom() + moveDistance > Game.CANVAS_HEIGHT - 2) ? 0 : moveDistance
            else
                return

            this.move(0, move)
            serverConn.sendPosition(_.pick(this.point, 'x', 'y'))
        }

        getDistance() : number {
            return (Game.getInstance().getElapsedTime() / 1000) * this.VELOCITY
        }

        increaseScore() {
            this.set('score', this.get('score') + 1)
            GameServerConnection.getInstance().notifyScore('host', this.get('score'))
        }
    }

    export class Opponent extends RectangularGameObject {
        id : string = "opponent"
        score : number = 0

        constructor(x = 0, y = 0) {
            var that = this,
                serverConn = GameServerConnection.getInstance()

            super(new Point(x, y), Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT)
            this.setSprite(new Drawing.Paddle())

            serverConn.on('change:opponentPosition', function(model, position){
                that.setPosition(that.point.getX(), position.y)
            })

            serverConn.on('change:scoreInfo', function(model, scoreInfo){
                if(scoreInfo.guest)
                    that.set('score', scoreInfo.guest)
            })
        }

        initialize() {
            this.set('score', 0)
        }

        increaseScore() {
            this.set('score', this.get('score') + 1)
            GameServerConnection.getInstance().notifyScore('guest', this.get('score'))
        }
    }

    export class Ball extends CircularGameObject {
        id : string = "ball"
        movementSpeed : number = 500
        minAngle : number = Utils.degreesToRadians(-20)
        maxAngle : number = Utils.degreesToRadians(20)
        vAngle : number = Utils.degreesToRadians(0)
        xDirection : number = 1
        yDirection : number = 1

        constructor() {
            super(new Point(Game.CANVAS_WIDTH / 2,  Game.CANVAS_HEIGHT / 2), 10)
            this.setSprite(new Drawing.Ball(this.radius))
        }

        update() {
            var serverConn = GameServerConnection.getInstance(),
                objectRepo = ObjectRepository.getInstance(),
                player = objectRepo.get('player'),
                opponent = objectRepo.get('opponent')
 
            this.calculateVelocity()
            
            if(this.collideWithTopBottomCanvas()){
                this.yDirection = -this.yDirection
            } else if(player.collideWithCircleObject(this) || opponent.collideWithCircleObject(this)) {
                this.doXCalculations()
            }  else if(this.collideWithLeftCanvas()) {
                opponent.increaseScore()
                this.doXCalculations()
            } else if(this.collideWithRightCanvas()) {
                player.increaseScore()
                this.doXCalculations()
            }

            this.calculateVelocity()
            this.move(this.vX, this.vY, true)
            serverConn.sendBallPosition(_.pick(this.point, 'x', 'y'))
        }

        doXCalculations() {
            this.xDirection = -this.xDirection
            this.calculateAngle()
        }

        calculateAngle() {
            var angle = 0,
                avoidMin = Utils.degreesToRadians(-10),
                avoidMax = Utils.degreesToRadians(10)

            while(angle == 0 || (angle >= avoidMin && angle <= avoidMax))
                angle = Math.random() * (this.maxAngle - this.minAngle) + this.minAngle

            this.vAngle = angle
        }

        calculateVelocity() {
            var elapsedMs = (Game.getInstance().getElapsedTime() / 1000)
            this.vX = (elapsedMs * this.movementSpeed * Math.cos(this.vAngle)) * this.xDirection
            this.vY = (elapsedMs * this.movementSpeed * Math.sin(this.vAngle)) * this.yDirection
        }
    }

    export class RemoteBall extends CircularGameObject {
        id : string = "remoteBall"

        constructor() {
            var serverConn = GameServerConnection.getInstance(),
                that = this

            super(new Point(Game.CANVAS_WIDTH / 2,  Game.CANVAS_HEIGHT / 2), 10)
            this.setSprite(new Drawing.Ball(this.radius))

            serverConn.on('change:ballPosition', function(model, position){
                that.setPosition(position.x, position.y)
            })
        }
    }
}

class ObjectRepository {
    static instance : ObjectRepository
    objects : GameObject[]

    public static getInstance() : ObjectRepository {
        if(ObjectRepository.instance == null)
            ObjectRepository.instance = new ObjectRepository()

        return ObjectRepository.instance
    }

    constructor() {
        this.objects = []
    }

    public addObject(object : GameObject) {
        if(object == null) return

        this.objects.push(object)

        return object
    }

    public clean() {
        this.objects = []
    }

    public getObjects() {
        return this.objects
    }

    public get(objectId) {
        return _.find(this.objects, function(object){
            return object.id === objectId
        })
    }
}

class GameServerConnection extends Backbone.Model {
    static instance
    static getInstance() {
        if(GameServerConnection.instance == null)
            GameServerConnection.instance = new GameServerConnection()

        return GameServerConnection.instance
    }

    socket

    newGame(nickname) {
        this.socket = io.connect(location.origin)
        this.setListeners()

        this.socket.emit('newGame', {
            nickname : nickname
        })

    }

    connectToGame(gameId, nickname) {
        var that = this

        this.socket = io.connect(location.origin)
        this.setListeners()

        this.socket.on('connectError', function(message){
            alert(message)
        })

        this.socket.emit('connectToGame', {
            nickname : nickname,
            gameId : gameId
        })
    }

    sendPosition(pos) {
        this.socket.emit('newPosition', pos)
    }

    sendBallPosition(pos) {
        this.socket.emit('ballPosition', pos)
    }

    isConnected() {
        return this.get('connected')
    }

    isOpponentConnected(){
        return this.get('opponentConnected')
    }

    notifyScore(role, score){
        if(role === "host")
            this.socket.emit('hostScore', score)
        else
            this.socket.emit('guestScore', score)
    }

    setListeners() {
        var that = this

        this.socket.on('connectionSuccess', function(data){
            console.log("connection established")
            that.set('gameId', data.gameId)
            that.set('connected', true)
        })

        this.socket.on('opponentPosition', function(pos) {
            that.set('opponentPosition', pos)

            if(!that.get('opponentConnected'))
                that.set('opponentConnected', true)
        })

        this.socket.on('ballPosition', function(pos) {
            that.set('ballPosition', pos)
        })

        this.socket.on('scoreInfo', function(scoreInfo) {
            that.set('scoreInfo', scoreInfo)
        })
    }
}

class Game extends Backbone.Model {
    static instance

    static getInstance() {
        if(Game.instance == null)
            Game.instance = new Game()

        return Game.instance
    }

    getElapsedTime(){
        return this.elapsedTime
    }

    connect() {
        var gameServerConn = GameServerConnection.getInstance(),
            objectRepo = ObjectRepository.getInstance(),
            that = this,
            CANVAS_WIDTH = Game.CANVAS_WIDTH;

        gameServerConn.on('change:connected', function(model, connected){
            if(connected){
                if(that.isHost()) {
                    objectRepo.addObject(new Models.Player(0, 0))
                    objectRepo.addObject(new Models.Ball())
                } else {
                    objectRepo.addObject(new Models.Player(CANVAS_WIDTH - Drawing.Paddle.PADDLE_WIDTH, 0))
                }
                    
                that.set('gameId', gameServerConn.get('gameId'))
            }
        })

        gameServerConn.on('change:opponentConnected', function(model, connected){
            var pos = model.get('opponentPosition')

            if(connected) {
                objectRepo.addObject(new Models.Opponent(pos.x, pos.y))

                if(!objectRepo.get("ball"))
                    objectRepo.addObject(new Models.RemoteBall())
            }
        });

        this.isHost() ? 
        gameServerConn.newGame(this.get('nickname')) : 
        gameServerConn.connectToGame(this.get('gameId'), this.get('nickname'))
    }

    isHost() {
        return this.get('gameId') == null
    }

    paused() {
        return this.get('paused')
    }

    pause() {
        this.set('paused', true)
    }

    unpause() {
        this.set('paused', false)
    }

    elapsedTime() {
        return this.elapsedTime
    }

    restart() {
        var objectRepo = ObjectRepository.getInstance()

        this.pause()

        setTimeout(function(){
            objectRepo.clean()
            objectRepo.addObject(new Models.Player())
            objectRepo.addObject(new Models.Opponent())
            objectRepo.addObject(new Models.Ball())
            this.unpause()
        }, 2000)
    }

    run() {
        var that = this

        this.lastTime = this.currentTime = Date.now()
        requestAnimFrame(runLoop)

        function runLoop(){
            that.lastTime = that.currentTime
            that.currentTime = Date.now()
            that.elapsedTime = that.currentTime - that.lastTime

            if(!that.paused()){
                that.update()
                that.draw()
            }

            requestAnimFrame(runLoop)
        }
    }

    update() {
        var objects = ObjectRepository.getInstance().getObjects()

        for(var i = 0; i < objects.length; i++) 
            objects[i].update()
    }

    draw() {
        var context = GameUI.instance.getCanvas()

        context.beginPath()
        context.clearRect(0,0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT)
        context.closePath()
        context.fillStyle = "#000"
        context.fillRect(0,0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT)

        var objects = ObjectRepository.getInstance().getObjects()

        for(var i = 0; i < objects.length; i++){
            var sprite = objects[i].getSprite()

            if(sprite)
                sprite.draw(context)
        }
    }
}

Game.CANVAS_WIDTH = 600
Game.CANVAS_HEIGHT = 400

class GameUI extends Backbone.View {

    initialize() {
        this.setElement('.game-ui')
    }

    start(){
        var player = ObjectRepository.getInstance().get('player'),
            opponent = ObjectRepository.getInstance().get('opponent'),
            that = this,
            $firstScore = this.$el.find(".first-score"),
            $lastScore = this.$el.find(".last-score");

        player.on('change:score', function(model, score){
            if(Game.getInstance().isHost())
                $firstScore.text(score)
            else
                $lastScore.text(score)
        })

        opponent.on('change:score', function(model, score){
            if(Game.getInstance().isHost())
                $lastScore.text(score)
            else
                $firstScore.text(score)
        })

        this.render()
    }

    render() {
        var counter = 3,
            timeId,
            that = this,
            $counter = this.$el.find(".counter");

        this.$el.show()

        timeId = setInterval(function(){
            counter -= 1

            $counter.find(".counter-number").text(counter)

            if(counter <= 0){
                clearInterval(timeId)
                $counter.html("")
                Game.getInstance().run()
            }
        }, 1000)
    }

    getCanvas() {
        return this.$el.find("#canvas")[0].getContext("2d")
    }
}

GameUI.instance = new GameUI()

class ConnectDialog extends Backbone.View {

    constructor() {
        this.events = events = {
            'change .nickname' : 'setNickname',
            'change #game-id' : 'setGameId',
            'click .btn-connect' : 'connect',
            'click a[href=#new-game]' : 'setValidators',
            'click a[href=#connect]' : 'setValidators'
        }
        super()
    }

    initialize(){
        var that = this,
            timeId,
            serverConn = GameServerConnection.getInstance();

        this.delegateEvents()
        this.setElement('#connect-dialog')
        this.render();

        serverConn.on('change:connected', function(model, connected) {
            if(connected){
                that.$el.find(".connect-screen").fadeOut(function(){
                    that.showWaitingBox()             
                })
            }
        })

        serverConn.on('change:opponentConnected', function(model, connected) {
            that.$el.modal('hide')
            setTimeout(function(){
                GameUI.instance.start()
            })
        })
    }

    showWaitingBox() {
        var $waitingBox =  this.$el.find(".waiting-for-opponent"),
            $message = $waitingBox.find(".message"),
            that = this


        $waitingBox.show()
        $waitingBox.find(".game-id").text(GameServerConnection.getInstance().get('gameId'))

        $message
        .toggleClass("fade-in")



        setInterval(function(){
            $message.toggleClass("fade-in")
        }, 1000)
    }

    render(){
        this.$el.modal('show')
    }

    setNickname(e){
        Game.getInstance().set('nickname', $(e.target).val())
    }

    setGameId(e) {
        Game.getInstance().set('gameId', $(e.target).val())
    }

    connect(e){
        var valid = true;

        this.$el.find("input").each(function(){
            valid = valid && this.checkValidity();
        })

        if(!valid)
            this.$el.find(".submitter").click()
        else 
            Game.getInstance().connect()
    }

    setValidators(e) {
        this.$el.find(".tab-pane").find("input").attr("required", null)
        this.$el.find($(e.target).attr("href")).find("input").attr("required", "required")
    }
}

new ConnectDialog()
