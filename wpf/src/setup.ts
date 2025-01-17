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

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const point = new Point(new p5.Vector(col * spacing, row * spacing));

      if (col === 0 && (row === 0 || row === rows - 1)) {
        point.velocity = new p5.Vector(0, 0);
        point.locked = true;
      }

      points.push(point);

      // Connect to the point to the left
      if (col > 0) {
        const leftPoint = points[points.length - 2];
        edges.push(new Edge(point, leftPoint));
      }

      // Connect to the point above
      if (row > 0) {
        const abovePoint = points[(row - 1) * cols + col];
        edges.push(new Edge(point, abovePoint));

        // Connect to the top-left diagonal point
        if (col > 0) {
          const topLeftPoint = points[(row - 1) * cols + (col - 1)];
          const edge = new Edge(point, topLeftPoint);
          edge.restLength = Math.sqrt(
            edge.restLength ** 2 + edge.restLength ** 2
          );
          edges.push(edge);
        }

        // Connect to the top-right diagonal point
        if (col < cols - 1) {
          const topRightPoint = points[(row - 1) * cols + (col + 1)];
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
