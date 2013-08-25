module Drawing {
    export class Sprite {
        public x : number;
        public y : number;
        public width : number;
        public height : number;

        constructor(x : number, y : number, width : number, height : number) {
            this.setPosition(x, y);
            this.setDimensions(width, height);
        }

        setPosition(x : number, y : number) {
            this.x = x || 0;
            this.y = y || 0;
        }

        setDimensions(width : number, height : number) {
            this.width = width || 0;
            this.height = height || 0;
        }

        draw(context) {
        }
    }

    export class Paddle extends Sprite {
        COLOR : string = "#fff";
        public static PADDLE_HEIGHT : number = 75;
        public static PADDLE_WIDTH : number = 20;

        constructor(x : number, y : number) {
            super(x, y, Paddle.PADDLE_WIDTH, Paddle.PADDLE_HEIGHT);
        }

        draw(context) {
            super.draw();
            context.fillStyle = this.COLOR;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

module Models {
    export class GameObject {
        x : number;
        y : number;
        width : number;
        height : number;
        sprite : Drawing.Sprite;

        constructor(x : number, y : number, width : number, height : number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        move(x : number, y : number) {
            this.x += x;
            this.y += y;

            this.sprite.setPosition(this.x, this.y);
        }

        setSprite(sprite : Drawing.Sprite) {
            if(sprite !== null){
                this.sprite = sprite;
            }
        }

        public getSprite() : Drawing.Sprite {
            return this.sprite;
        }

        public bottom() : number {
            return this.y + this.height;
        }

        public right() : number {
            return this.x + this.width;
        }

        update() {
        }
    }

    export class Player extends GameObject {
        MIN_Y : number = 2;

        constructor() {
            super(0, 0, Drawing.Paddle.PADDLE_WIDTH, Drawing.Paddle.PADDLE_HEIGHT);
            var that = this;
            this.setSprite(new Drawing.Paddle());
            this.move(2,2);


            $(document).bind('keypress.a', function(){
                var move = (that.y - 20 < that.MIN_Y) ? 0 : -20;
                that.move(0, move);
            });

            $(document).bind('keypress.s', function(){
                var move = (that.bottom() + 20 > Game.CANVAS_HEIGHT - 2) ? 0 : 20;
                that.move(0, move);
            });
        }
    }

    export class ObjectRepository {
        static instance : ObjectRepository;
        objects : GameObject[];

        public static getInstance() : ObjectRepository {
            if(ObjectRepository.instance == null){
                ObjectRepository.instance = new ObjectRepository();
            }

            return ObjectRepository.instance;
        }

        constructor() {
            this.objects = [];
        }

        public addObject(object : GameObject) {
            if(object == null) return;

            this.objects.push(object);
        }

        public getObjects() : GameObject[] {
            return this.objects;
        }
    }
}

module Game {
    export var CANVAS_WIDTH : number = 480;
    export var CANVAS_HEIGHT : number = 320;
    var FPS : number = 60;
    var context;


    export function init() {
        context = $("#canvas")
        .attr("height", CANVAS_HEIGHT)
        .attr("width", CANVAS_WIDTH)[0].getContext("2d");

        var player = new Models.Player();
        Models.ObjectRepository.getInstance().addObject(player);

        setInterval(function() {
            update();
            draw();
        }, 1000 / FPS);
    }

    function update() {
        var objects = Models.ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++)
            objects[i].update();
    }

    function draw() {
        context.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.fillStyle = "#000";
        context.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);

        var objects = Models.ObjectRepository.getInstance().getObjects();

        for(var i = 0; i < objects.length; i++){
            var sprite = objects[i].getSprite();

            if(sprite)
                sprite.draw(context);
        }

    }
}

Game.init();