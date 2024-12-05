import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
import { applySpringForce } from "./spring";
import { exportVideo, initializeRecorder } from "./recording";
const width = window.innerWidth;
const height = window.innerHeight;

const generateGrid = (): { points: Point[]; edges: Edge[] } => {
  const points: Point[] = [];
  const edges: Edge[] = [];
  const cols = 20;
  const rows = 10;
  const spacing = 20;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const point = new Point(new p5.Vector(x * spacing, y * spacing));

      if (x === 0) {
        point.velocity = new p5.Vector(0, 0);
        point.applyForce = () => {};
      }

      points.push(point);

      if (x > 0) {
        const leftPoint = points[points.length - 2];
        edges.push(new Edge(point, leftPoint));
      }

      if (y > 0) {
        const abovePoint = points[(y - 1) * cols + x];
        edges.push(new Edge(point, abovePoint));
      }
    }
  }

  return { points, edges };
};

const springConstant = 0.5;
const gravity = new p5.Vector(0, 0.1, 0);
const wind = new p5.Vector(0.1, 0, 0);

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid();
  let canvas: HTMLCanvasElement;

  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
    canvas = document.getElementById("defaultCanvas0") as HTMLCanvasElement;
    const grid = generateGrid();
    const { recorder } = initializeRecorder(canvas, 30, exportVideo);
    points = grid.points;
    edges = grid.edges;
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
