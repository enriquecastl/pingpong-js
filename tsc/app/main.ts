module Drawing {
    export class Sprite {
        x : number;
        y : number;
        width : number;
        height : number;

        constructor(x : number, y : number, width : number, height : number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        draw(context) {
        }
    }

    export class Paddle extends Sprite {
        COLOR : string = "#fff";

        draw(context) {
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

        setSprite(sprite : Drawing.Sprite) {
            if(sprite !== null)
                this.sprite = sprite;
        }

        public getSprite() : Drawing.Sprite {
            return this.sprite;
        }

        update() {

        }
    }

    export class Player extends GameObject {


    }
}


module Game {
    var CANVAS_WIDTH : number = 480;
    var CANVAS_HEIGHT : number = 320;
    var FPS : number = 30;
    var context;
    var textX : number = 50;
    var textY : number = 50;

    export function init() {
        context = $("#canvas")
        .attr("height", CANVAS_HEIGHT)
        .attr("width", CANVAS_WIDTH)[0].getContext("2d");

        setInterval(function() {
            update();
            draw();
        }, 1000 / FPS);
    }

    function update() {
        textX++;
        textY++;
    }

    function draw() {
        context.clearRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.fillStyle = "#000";
        context.fillText("Super Bro!", textX, textY);
    }
}

Game.init();