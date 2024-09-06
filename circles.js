class Circle{
    constructor(x, y, r, ctx, drawer) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.ctx = ctx;
        this.failures = 0;
        this.dead = false;
        this.drawer = drawer;
    }

    draw(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
        this.ctx.stroke();
    }

    distance_to_circle(x,y,circle){
        return Math.sqrt((x-circle.x)**2 + (y-circle.y)**2)-circle.r;
    }

    check_intersect(circle){
        return this.distance_to_circle(this.x, this.y, circle) < this.r;
    }

    fail(){
        this.failures++;
        if(this.failures > this.drawer.thoroughness){
            this.dead = true;
        }
    }
}


class Canvas {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.context = this.canvas.getContext("2d");
        this.height = this.canvas.height;
        this.width = this.canvas.width;
        window.addEventListener("resize", this.render.bind(this), true);
    }
    render(){
        this.canvas.width = document.documentElement.clientWidth;
        this.canvas.height = document.documentElement.clientHeight;
        this.height = this.canvas.height;
        this.width = this.canvas.width;
    }
}


class CircleDrawer{
    #circles = []
    #live_circles = []
    #circle_count = 0;
    constructor(canvas_id) {
        this.canvas = new Canvas(canvas_id);
        this.keep_going = false;
        window.addEventListener("resize", this.restart.bind(this), true);
    }

    start(min_radius, max_radius, thoroughness, approach){
        this.reset()
        this.min_radius = min_radius;
        this.max_radius = max_radius;
        this.thoroughness = thoroughness;
        this.approach = approach;
        this.keep_going = true;
        if(this.#circle_count === 0){
            this.canvas.render();
        }
        this.canvas.context.strokeStyle = "#ffffff";
        window.requestAnimationFrame(this.draw_circle.bind(this));
    }

    resume(){
        this.keep_going = true;
        if(this.#circle_count === 0){
            this.canvas.render();
        }
        window.requestAnimationFrame(this.draw_circle.bind(this));
    }

    stop(){
        this.keep_going = false;
    }

    reset(){
        this.stop();
        this.#circle_count = 0;
        this.#circles = [];
        this.#live_circles = [];
    }

    restart(){
        this.start(this.min_radius, this.max_radius, this.thoroughness, this.approach);
    }

    choose_next(){
        let i;
        this.#live_circles = this.#live_circles.filter(function(a){return !a.dead});
        if(this.#live_circles.length === 0){
            return false;
        }
        if(this.approach === "depth-first"){
            i = this.#live_circles.length - 1;
        } else if (this.approach === "breadth-first"){
            i = 0;
        } else if (this.approach === "random"){
            i = Math.floor(Math.random()*(this.#live_circles.length - 1));
        }
        return this.#live_circles[i]
    }

    draw_circle(){
        if(this.#circle_count < 1){
            this.#circles.push(new Circle(
                this.canvas.width/2,
                this.canvas.height/2,
                Math.random()*(this.max_radius - this.min_radius) + this.min_radius,
                this.canvas.context,
                this));
            this.#circle_count++;
            this.#live_circles.push(this.#circles[this.#circle_count - 1]);
        } else {
            let found = false;
            while(!found){
                let current = this.choose_next();
                if(!current){
                    this.stop();
                    return;
                }
                let direction = Math.random()*2*Math.PI;
                let distance = current.r + this.min_radius + Math.random()*(this.max_radius-this.min_radius);
                let x = current.x + Math.cos(direction)*distance;
                let y = current.y + Math.sin(direction)*distance;
                let r = distance - current.r;
                let attempt = new Circle(x, y, r, this.canvas.context, this);
                if(x>0 && x<this.canvas.width && y>0 && y<this.canvas.height){
                    let i = 0;
                    let intersect = false;
                    while(i < this.#circle_count){
                        if(attempt.check_intersect(this.#circles[i])) {
                            intersect = true;
                            current.fail();
                            break;
                        }
                        i++;
                    }
                    if(!intersect){
                        this.#circles.push(attempt);
                        this.#live_circles.push(attempt);
                        this.#circle_count++;
                        found = true;
                    }
                }
            }
        }
        this.#circles[this.#circle_count - 1].draw();
        if(this.keep_going){
            window.requestAnimationFrame(this.draw_circle.bind(this));
        }else{
            window.cancelAnimationFrame(this.draw_circle);
        }

    }
}