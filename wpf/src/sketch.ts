import p5 from 'p5';
import { Point } from './Point';
import { Edge } from './Edge';
const width = window.innerWidth;
const height = window.innerHeight;

const generateGrid = (): { points: Point[]; edges: Edge[] }  => {

  const points: Point[] = [];
  const edges: Edge[] = [];
  const cols= 20;
  const rows= 10;
  const spacing = 20;

  for(let y = 0; y < rows; y++){
    for(let x = 0; x < cols; x++){
      const point = new Point(new p5.Vector(x * spacing, y * spacing));

      if(x === 0){
        point.velocity = new p5.Vector(0,0);
        point.applyForce = () => {};
      }

      points.push(point);

      if(x > 0){
        const leftPoint = points[points.length - 2];
        edges.push(new Edge(point, leftPoint))
      }

      if(y > 0){
        const abovePoint = points[(y - 1) * cols + x];
        edges.push(new Edge(point, abovePoint))
      }
    }
  }

  return {points, edges}
};

const applySpringForce = (a: Point, b: Point): void => {

  const springConstant = 0.5;
  const restLength = 20; //Hab ich jetzt mal so lang wie das Spacing gemacht

  const force = p5.Vector.sub(b.pos, a.pos)
  const stretch = force.mag() - restLength;

  //Hooks Gesetz: F = -k * stretch
  force.normalize()
  force.mult(springConstant * stretch);

  a.applyForce(force);
  force.mult(-1);
  b.applyForce(force);
};

const gravity = new p5.Vector(0, 0.1, 0);
const wind = new p5.Vector(0.1, 0, 0);

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid();

  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);

    const grid = generateGrid();
    points = grid.points;
    edges = grid.edges;
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
      point.updated = false;
    }
    for (const edge of edges) {
      edge.draw(p);
    }
  };
};

export default sketch;
