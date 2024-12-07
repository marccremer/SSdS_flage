import p5 from "p5";
import { Edge } from "./Edge";
import { Point } from "./Point";

export const generateGrid = (
  cols: number,
  rows: number
): { points: Point[]; edges: Edge[] } => {
  const points: Point[] = [];
  const edges: Edge[] = [];
  const spacing = 20;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const point = new Point(new p5.Vector(x * spacing, y * spacing));

      if (x === 0) {
        point.velocity = new p5.Vector(0, 0);
        point.locked = true;
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
