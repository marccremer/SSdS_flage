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

      // Connect to the point to the left
      if (x > 0) {
        const leftPoint = points[points.length - 2];
        edges.push(new Edge(point, leftPoint));
      }

      // Connect to the point above
      if (y > 0) {
        const abovePoint = points[(y - 1) * cols + x];
        edges.push(new Edge(point, abovePoint));

        // Connect to the top-left diagonal point
        if (x > 0) {
          const topLeftPoint = points[(y - 1) * cols + (x - 1)];
          const edge = new Edge(point, topLeftPoint);
          edge.restLength = Math.sqrt(
            edge.restLength ** 2 + edge.restLength ** 2
          );
          edges.push(edge);
        }

        // Connect to the top-right diagonal point
        if (x < cols - 1) {
          const topRightPoint = points[(y - 1) * cols + (x + 1)];
          const edge = new Edge(point, topRightPoint);
          edge.restLength = Math.sqrt(
            edge.restLength ** 2 + edge.restLength ** 2
          );
          edges.push(edge);
        }
      }
    }
  }

  return { points, edges };
};
