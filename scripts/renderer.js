import * as CG from "./transforms.js";
import { Matrix } from "./matrix.js";
function Polygon(cx, cy, radius, sides) {
  let vertices = [];
  for (let i = 0; i < sides; i++) {
    let angle = (2 * Math.PI * i) / sides;
    vertices.push(
      CG.Vector3(
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle),
        1,
      ),
    );
  }

  return vertices;
}

class Renderer {
  // canvas:              object ({id: __, width: __, height: __})
  // limit_fps_flag:      bool
  // fps:                 int
  constructor(canvas, limit_fps_flag, fps) {
    this.canvas = document.getElementById(canvas.id);
    this.canvas.width = canvas.width;
    this.canvas.height = canvas.height;
    this.ctx = this.canvas.getContext("2d");
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
          velocityX: 0.15,
          velocityY: 0.12,
        },
      ],
      slide1: [
        {
          vertices: Polygon(200, 350, 90, 3),
          center: { x: 200, y: 350 },
          revolutions: 0.5,
          color: [171, 235, 52, 255],
          transform: null,
        },
        {
          vertices: Polygon(200, 230, 40, 7),
          center: { x: 200, y: 230 },
          revolutions: 1,
          color: [171, 235, 52, 255],
          transform: null,
        },
        {
          vertices: Polygon(600, 350, 80, 12),
          center: { x: 600, y: 350 },
          revolutions: -0.25,
          color: [54, 91, 214, 255],
          transform: null,
        },
      ],
      slide2: [
                {
                    vertices: [
                        CG.Vector3(0, -100, 1),
                        CG.Vector3(95, -31, 1),
                        CG.Vector3(59, 81, 1),
                        CG.Vector3(-59, 81, 1),
                        CG.Vector3(-95, -31, 1)
                    ],
                    transform: null,
                    x: 200,
                    y: 300,
                    scale: 1,
                    scaleDirection: 1,
                    scaleSpeed: 0.001,
                },
                {
                    vertices: [
                        CG.Vector3(0, -90, 1),
                        CG.Vector3(-50, 0, 1),
                        CG.Vector3(0, 100, 1),
                        CG.Vector3(50, 0, 1)
                    ],
                    transform: null,
                    x: 400,
                    y: 300,
                    scale: 1,
                    scaleDirection: 1,
                    scaleSpeed: 0.005,
                },
                {
                    vertices: [
                        CG.Vector3(0, -80, 1),
                        CG.Vector3(70, 0, 1),
                        CG.Vector3(0, 80, 1),
                        CG.Vector3(-70, 0, 1)
                    ],
                    transform: null,
                    x: 400,
                    y: 300,
                    scaleX: 1,
                    scaleY: 1,
                    scaleDirectionX: 1,
                    scaleDirectionY: -1,
                    scaleSpeedX: 0.001,
                    scaleSpeedY: 0.0005
                }
            ],
            slide3: [
                {
                    vertices: vertices,
                    transform: null,
                    x: 400,
                    y: 300,
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
      setTimeout(
        () => {
          window.requestAnimationFrame((ts) => {
            this.animate(ts);
          });
        },
        Math.floor(1000.0 / this.fps),
      );
    } else {
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

      const xValues = ball.vertices.map((vertex) => vertex.values[0][0]);
      const yValues = ball.vertices.map((vertex) => vertex.values[1][0]);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      ball.x += ball.velocityX * delta_time;
      ball.y += ball.velocityY * delta_time;

      // Keep the entire polygon inside the canvas. x and y are
      // translation offsets because the vertices already have positions.
      if (minX + ball.x < 0) {
        ball.x = -minX;
        ball.velocityX *= -1;
      } else if (maxX + ball.x > this.canvas.width) {
        ball.x = this.canvas.width - maxX;
        ball.velocityX *= -1;
      }

      if (minY + ball.y < 0) {
        ball.y = -minY;
        ball.velocityY *= -1;
      } else if (maxY + ball.y > this.canvas.height) {
        ball.y = this.canvas.height - maxY;
        ball.velocityY *= -1;
      }

      let transform = new Matrix(3, 3);
      CG.mat3x3Translate(transform, ball.x, ball.y);

      ball.transform = transform;
    } else if (this.slide_idx == 1) {
      for (let poly of this.models.slide1) {
        let theta = 2 * Math.PI * poly.revolutions * (time / 1000);
        let toOrigin = new Matrix(3, 3);
        CG.mat3x3Translate(toOrigin, -poly.center.x, -poly.center.y);

        let rotate = new Matrix(3, 3);
        CG.mat3x3Rotate(rotate, theta);

        let back = new Matrix(3, 3);
        CG.mat3x3Translate(back, poly.center.x, poly.center.y);
        poly.transform = Matrix.multiply([back, rotate, toOrigin]);
      }
      } else if (this.slide_idx == 2) {
      let shapeOne = this.models.slide2[0];
      let shapeTwo = this.models.slide2[1];
      let shapeThree = this.models.slide2[2];

      shapeOne.scale += shapeOne.scaleDirection * shapeOne.scaleSpeed * delta_time;

      if (shapeOne.scale >= 2) {
          shapeOne.scale = 2;
          shapeOne.scaleDirection = -1;
      }
      else if (shapeOne.scale <= 1) {
          shapeOne.scale = 1;
          shapeOne.scaleDirection = 1;
      }

      shapeTwo.scale += shapeTwo.scaleDirection * shapeTwo.scaleSpeed * delta_time;

      if (shapeTwo.scale >= 2) {
          shapeTwo.scale = 2;
          shapeTwo.scaleDirection = -1;
      }
      else if (shapeTwo.scale <= 1) {
          shapeTwo.scale = 1;
          shapeTwo.scaleDirection = 1;
      }

      shapeThree.scaleX += shapeThree.scaleDirectionX * shapeThree.scaleSpeedX * delta_time;
      shapeThree.scaleY += shapeThree.scaleDirectionY * shapeThree.scaleSpeedY * delta_time;

      if (shapeThree.scaleX >= 2) {
          shapeThree.scaleX = 2;
          shapeThree.scaleDirectionX = -1;
      }
      else if (shapeThree.scaleX <= 1) {
          shapeThree.scaleX = 1;
          shapeThree.scaleDirectionX = 1;
      }

      if (shapeThree.scaleY >= 2) {
          shapeThree.scaleY = 2;
          shapeThree.scaleDirectionY = -1;
      }
      else if (shapeThree.scaleY <= 1) {
          shapeThree.scaleY = 1;
          shapeThree.scaleDirectionY = 1;
      }



      let transform = new Matrix(3, 3);
      let scaleMatrix = new Matrix(3, 3);

      CG.mat3x3Scale(
          scaleMatrix,
          shapeOne.scale,
          shapeOne.scale
      );

      CG.mat3x3Translate(
          transform,
          shapeOne.x,
          shapeOne.y
      );

      shapeOne.transform = Matrix.multiply([
          transform,
          scaleMatrix
      ]);

      CG.mat3x3Scale(
          scaleMatrix,
          shapeTwo.scale,
          shapeTwo.scale
      );

      CG.mat3x3Translate(
          transform,
          shapeTwo.x,
          shapeTwo.y
      );

      shapeTwo.transform = Matrix.multiply([
          transform,
          scaleMatrix
      ]);

      CG.mat3x3Scale(
          scaleMatrix,
          shapeThree.scaleX,
          shapeThree.scaleY
      );

      CG.mat3x3Translate(
          transform,
          shapeThree.x,
          shapeThree.y
      );

      shapeThree.transform = Matrix.multiply([
          transform,
          scaleMatrix
      ]);
    } else if (this.slide_idx == 3) {
      let ball = this.models.slide3[0];

      if (!ball.visible) {
          return;
      }


      ball.scale += ball.scaleSpeed * delta_time;

      // find all the x and y values of the vertices for the cricle
      const yValues = ball.vertices.map((vertex) => vertex.values[1][0]);
      
      // top y value
      const maxY = Math.max(...yValues);

      let heightY = maxY;

      if (heightY + maxY < 450) {
          heightY *=  ball.scale;
      }
      
      let scaleMatrix = new Matrix(3, 3);
      let transform = new Matrix(3, 3);

      if (heightY > this.canvas.height) {
          console.log("touch the top!!!")
          
          ball.visible = false;
          let newMatrix = new Matrix(3, 3);

          CG.mat3x3Translate(newMatrix, 10000, 10000);

          ball.transform = newMatrix;

          return;
      }
      
      CG.mat3x3Translate(transform, ball.x, ball.y);
      CG.mat3x3Scale(scaleMatrix, ball.scale, ball.scale)
      
      

      ball.transform = Matrix.multiply([
          transform,
          scaleMatrix
      ]);

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
    let color = [0, 128, 128, 255];

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
    for (let i = 0; i < this.models.slide1.length; i++) {
      let poly = this.models.slide1[i];
      let vertices = poly.vertices;
      if (poly.transform != null) {
        let results = [];
        for (let vert of poly.vertices) {
          results.push(poly.transform.mult(vert));
        }
        vertices = results;
      }
      this.drawConvexPolygon(vertices, poly.color);
    }
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
    let shapeThree = this.models.slide2[2]

    let color = [100, 0, 200, 255];
    let color2 = [100, 150, 0, 255];
    let color3 = [0, 200, 130, 255];

    let vertices = shapeOne.vertices;
    let verticesTwo = shapeTwo.vertices;
    let verticesThree = shapeTwo.vertices;


    if (shapeOne.transform !== null) {
        vertices = shapeOne.vertices.map((vertex) => {
            return shapeOne.transform.mult(vertex);
        });
    }

    if (shapeTwo.transform !== null) {
        verticesTwo = shapeTwo.vertices.map((vertex) => {
            return shapeTwo.transform.mult(vertex);
        });
    }

    if (shapeThree.transform !== null) {
        verticesThree = shapeThree.vertices.map((vertex) => {
            return shapeThree.transform.mult(vertex);
        });
    }

    this.drawConvexPolygon(vertices, color);
    this.drawConvexPolygon(verticesTwo, color2);
    this.drawConvexPolygon(verticesThree, color3);
  }

  //
  drawSlide3() {
    // TODO: get creative!
    //   - animation should involve all three basic transformation types
    //     (translation, scaling, and rotation)

    let ball = this.models.slide3[0];
    let color = [100, 0, 200, 255];

    let vertices = ball.vertices;

    if (ball.transform !== null) {
        vertices = ball.vertices.map((vertex) => {
            return ball.transform.mult(vertex);
        });
    }

    this.drawConvexPolygon(vertices, color);
  }

  // vertex_list:  array of object [Matrix(3, 1), Matrix(3, 1), ..., Matrix(3, 1)]
  // color:        array of int [R, G, B, A]
  drawConvexPolygon(vertex_list, color) {
    this.ctx.fillStyle =
      "rgba(" +
      color[0] +
      "," +
      color[1] +
      "," +
      color[2] +
      "," +
      color[3] / 255 +
      ")";
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
}

export { Renderer };
