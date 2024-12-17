import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
import { applySpringForce } from "./spring";
import { exportVideo, initializeRecorder } from "./recording";
import { generateGrid } from "./setup";
import { applyImageTextureToShape } from "./proto";
const width = window.innerWidth;
const height = window.innerHeight;

const GRID_ROWS = 10;
const GRID_COLS = 20;

const springConstant = 0.37;
const gravity = new p5.Vector(0, 0.05, 0);
const wind = new p5.Vector(0, 0, 0);

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid(GRID_COLS, GRID_ROWS);
  let canvas: HTMLCanvasElement;
  const img = p.loadImage("flag.jpg");

  let gravityLabel: p5.Element;
  let gravitySlider: p5.Element;
  let windLabel: p5.Element;
  let windSlider: p5.Element;

  p.setup = () => {
    p.createCanvas(width, height, p.WEBGL);
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

    gravityLabel = p.createDiv("Gravity:");
    gravityLabel.position(10, 120);
    gravityLabel.style("font-size", "14px");
    gravityLabel.style("color", "#000");

    gravitySlider = p.createSlider(0.05, 0.3, gravity.y, 0.05);
    gravitySlider.position(10, 140);
    gravitySlider.style("width", "200px");

    windLabel = p.createDiv("Wind:");
    windLabel.position(10, 170);
    windLabel.style("font-size", "14px");
    windLabel.style("color", "#000");

    windSlider = p.createSlider(0, 0.5, wind.x, 0.1);
    windSlider.position(10, 190);
    windSlider.style("width", "200px");
  };

  p.draw = () => {
    p.background(b);
    //p.translate(width / 2, height / 2);

    const gravityValue = gravitySlider.value() as number;
    const windValue = windSlider.value() as number;

    gravity.set(0, gravityValue, 0);
    wind.set(windValue, 0, p.random(-0.1, 0.1));

    for (const edge of edges) {
      edge.update(
        (a, b) =>
          applySpringForce(a, b, {
            restLength: edge.restLength,
            springConstant,
          }),
        (point) => {
          point.applyForce(gravity);
          point.applyForce(wind.mult(1));
        }
      );
    }

    for (const point of points) {
      // point.draw(p);
      point.updated = false;
    }
    for (const edge of edges) {
      edge.draw(p);
    }
    p.push();
    {
      p.fill(150);
      p.noStroke();
      p.rect(-10, -5, 10, 500);
    }
    p.pop();
    applyImageTextureToShape(points, p, img, GRID_ROWS, GRID_COLS);
  };
};

export default sketch;
