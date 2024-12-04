import p5 from 'p5';
import { Point } from './Point';
import { Edge } from './Edge';
const width = window.innerWidth;
const height = window.innerHeight;

declare function generateGrid(): { points: Point[]; edges: Edge[] };
declare function applySpringForce(a: Point, b: Point): void;
const gravity = new p5.Vector(0, 1, 0);
const wind = new p5.Vector(0, 1, 0);
const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid();
  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
  };

  p.draw = () => {
    p.background(b);
    p.translate(width / 2, height / 2);
    for (const edge of edges) {
      edge.update(applySpringForce, (point) => {
        point.applyForce(gravity);
        point.applyForce(wind);
      });
    }

    for (const point of points) {
      point.draw(p);
    }
    for (const edge of edges) {
      edge.draw(p);
    }
  };
};

export default sketch;
