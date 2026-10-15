import * as CG from './transforms.js';
import { Matrix } from "./matrix.js";

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // limit_fps_flag:      bool 
    // fps:                 int
    constructor(canvas, limit_fps_flag, fps) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.slide_idx = 0;
        this.limit_fps = limit_fps_flag;
        this.fps = fps;
        this.start_time = null;
        this.prev_time = null;

        // creating a lot of vertices to draw a circle
        let vertices = [];
        let numberOfVertices = 32;
        let radius = 50;

        for (let i = 0; i < numberOfVertices; i++) {
            let angle = (2 * Math.PI * i) / numberOfVertices;

            let x = radius * Math.cos(angle);
            let y = radius * Math.sin(angle);

            vertices.push(CG.Vector3(x, y, 1));
        }

        this.models = {
            slide0: [
                {
                    vertices: vertices,
                    transform: null,

                    x: 0,
                    y: 0,
                    velocityX: 0.30,
                    velocityY: 0.30
                }
            ],
            slide1: [],
            slide2: [
                {
                    vertices: [
                        CG.Vector3(550, 210, 1),
                        CG.Vector3(500, 300, 1),
                        CG.Vector3(550, 400, 1),
                        CG.Vector3(600, 300, 1)
                    ],
                    transform: null,

                    x: 200,
                    y: 300,
                    velocityX: 0.30,
                    velocityY: 0.30
                },
                {
                    vertices: [
                        CG.Vector3(250, 200, 1),
                        CG.Vector3(345, 269, 1),
                        CG.Vector3(309, 381, 1),
                        CG.Vector3(191, 381, 1),
                        CG.Vector3(155, 269, 1)
                    ],
                    transform: null,

                    x: 400,
                    y: 300,
                    velocityX: 0.30,
                    velocityY: 0.30
                }
            ],
            slide3: [
                {
                    vertices: vertices,
                    x: 400,
                    y: 300,
                    transform: null,
                    scale: 1,
                    scaleSpeed: 0.001,
                    visible: true
                }
            ]
        };
    }

    // flag:  bool
    limitFps(flag) {
        this.limit_fps = flag;
    }

    // n:  int
    setFps(n) {
        this.fps = n;
    }

    // idx: int
    setSlideIndex(idx) {
        this.slide_idx = idx;
    }

    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;
        //console.log('animate(): t = ' + time.toFixed(1) + ', dt = ' + delta_time.toFixed(1));

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.drawSlide();

        // Invoke call for next frame in animation
        if (this.limit_fps) {
            setTimeout(() => {
                window.requestAnimationFrame((ts) => {
                    this.animate(ts);
                });
            }, Math.floor(1000.0 / this.fps));
        }
        else {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateTransforms(time, delta_time) {

        if (this.slide_idx == 0) {
            let ball = this.models.slide0[0];

            // find all the x and y values of the vertices for the cricle
            const xValues = ball.vertices.map((vertex) => vertex.values[0][0]);
            const yValues = ball.vertices.map((vertex) => vertex.values[1][0]);

            // min and max values
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);

            ball.x += ball.velocityX * delta_time;
            ball.y += ball.velocityY * delta_time;

            // Keep the entire polygon inside the canvas
            if (minX + ball.x < 0) {
                ball.x = -minX;
                ball.velocityX *= -1;
            }

            // for right side
            else if (maxX + ball.x > this.canvas.width) {
                ball.x = this.canvas.width - maxX;
                ball.velocityX *= -1;
            }
            
            // translation offsets because the vertices already have positions
            if (minY + ball.y < 0) {
                ball.y = -minY;
                ball.velocityY *= -1;
            }
            else if (maxY + ball.y > this.canvas.height) {
                ball.y = this.canvas.height - maxY;
                ball.velocityY *= -1;
            }

            let transform = new Matrix(3, 3);
            CG.mat3x3Translate(transform, ball.x, ball.y);

            ball.transform = transform;
        }

        else if ( this.slide_idx == 2) {

        } else if ( this.slide_idx == 3) {
            
            let ball = this.models.slide0[0];

            if (!ball.visible) {
                return;
            }

            ball.scale += ball.scaleSpeed * delta_time;

            // find all the x and y values of the vertices for the cricle
            const yValues = ball.vertices.map((vertex) => vertex.values[1][0]);

            // top y value
            const minY = Math.min(...yValues);

            if (minY <= 0) {
                ball.visible = false;
                ball.transform = null;
                return;
            }


            let scaleMatrix = new Matrix(3, 3);

            CG.mat3x3Scale(
                scaleMatrix, 
                ball.scale,
                ball.scale
            );

        }
        

    }

    
    //
    drawSlide() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.slide_idx) {
            case 0:
                this.drawSlide0();
                break;
            case 1:
                this.drawSlide1();
                break;
            case 2:
                this.drawSlide2();
                break;
            case 3:
                this.drawSlide3();
                break;
        }
    }

    //
    drawSlide0() {
        // TODO: draw bouncing ball (circle that changes direction whenever it hits an edge)
        
        let ball = this.models.slide0[0];
        let color = [100, 0, 200, 255];

        let vertices = ball.vertices;

        if (ball.transform !== null) {
            vertices = ball.vertices.map((vertex) => {
                return ball.transform.mult(vertex);
            });
        }

        this.drawConvexPolygon(vertices, color);
    }

    //
    drawSlide1() {
        // TODO: draw at least 3 polygons that spin about their own centers
        //   - have each polygon spin at a different speed / direction
        
        
    }

    //
    drawSlide2() {
        // TODO: draw at least 2 polygons grow and shrink about their own centers
        //   - have each polygon grow / shrink different sizes
        //   - try at least 1 polygon that grows / shrinks non-uniformly in the x and y directions
    
        let shapeOne = this.models.slide2[0]
        let shapeTwo = this.models.slide2[1]

        let color = [100, 0, 200, 255];

        this.drawConvexPolygon(shapeOne.vertices, color);

        this.drawConvexPolygon(shapeTwo.vertices, color);

    }

    //
    drawSlide3() {
        // TODO: get creative!
        //   - animation should involve all three basic transformation types
        //     (translation, scaling, and rotation)

        let circle = this.models.slide3[0]
        let color = [100, 150, 100, 255];

        let vertices = circle.vertices;

        if (circle.transform !== null) {
            vertices = circle.vertices.map((vertex) => {
                return circle.transform.mult(vertex);
            });
        }

        
        this.drawConvexPolygon(circle.vertices, color);

        
    }
    
    // vertex_list:  array of object [Matrix(3, 1), Matrix(3, 1), ..., Matrix(3, 1)]
    // color:        array of int [R, G, B, A]
    drawConvexPolygon(vertex_list, color) {
        this.ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
        this.ctx.beginPath();
        let x = vertex_list[0].values[0][0] / vertex_list[0].values[2][0];
        let y = vertex_list[0].values[1][0] / vertex_list[0].values[2][0];
        this.ctx.moveTo(x, y);
        for (let i = 1; i < vertex_list.length; i++) {
            x = vertex_list[i].values[0][0] / vertex_list[i].values[2][0];
            y = vertex_list[i].values[1][0] / vertex_list[i].values[2][0];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

};

export { Renderer };
