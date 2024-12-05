import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
import { applySpringForce } from "./spring";
import { exportVideo, initializeRecorder } from "./recording";
import { generateGrid } from "./setup";
const width = window.innerWidth;
const height = window.innerHeight;

const GRID_ROWS = 10;
const GRID_COLS = 20;

const springConstant = 0.5;
const gravity = new p5.Vector(0, 0.1, 0);
const wind = new p5.Vector(0.1, 0, 0);

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid(GRID_COLS, GRID_ROWS);
  let canvas: HTMLCanvasElement;
  //const img = p.loadImage("flag.png");

  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
    canvas = document.getElementById("defaultCanvas0") as HTMLCanvasElement;
    const { recorder } = initializeRecorder(canvas, 30, exportVideo);

    createStyledButton(p, "START", [200, 10], () => {
      assertNotNull(recorder, "recorder");
      recorder.start();
    });
    createStyledButton(p, "STOP", [10, 10], () => {
      assertNotNull(recorder, "recorder");
      recorder.stop();
    });
  };

  p.draw = () => {
    p.background(b);
    p.translate(width / 2, height / 2);

    for (const edge of edges) {
      edge.update(
        (a, b) =>
          applySpringForce(a, b, {
            restLength: edge.restLength,
            springConstant,
          }),
        (point) => {
          point.applyForce(gravity);
          point.applyForce(wind);
        }
      );
    }

    for (const point of points) {
      point.draw(p);
      point.updated = false;
    }
    for (const edge of edges) {
      edge.draw(p);
    }
  };
};

export default sketch;
