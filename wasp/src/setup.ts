import p5 from "p5";
import { Edge } from "./Edge";
import { Point } from "./Point";

export const generateGrid = (
  cols: number,
  rows: number,
  spacing = 20
): { points: Point[]; edges: Edge[] } => {
  const points: Point[] = [];
  const edges: Edge[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const point = new Point(new p5.Vector(col * spacing, row * spacing));

      if (col === 0 && (row === 0 || row === rows - 1)) {
        point.velocity = new p5.Vector(0, 0);
        point.locked = false;
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

export const generateGridXZ = (
  cols: number,
  rows: number,
  spacing = 3
): { points: Point[]; edges: Edge[] } => {
  const points: Point[] = [];
  const edges: Edge[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xPos = col * spacing;
      const zPos = row * spacing;
      const yPos = 0;

      const point = new Point(new p5.Vector(xPos, yPos, zPos));

      points.push(point);

      //Horizontale Verbindung
      if (col > 0) {
        const leftPoint = points[points.length - 2];
        const edge = new Edge(point, leftPoint);
        edge.restLength = point.pos.dist(leftPoint.pos);
        edges.push(edge);
      }

      //Vertikale Verbindung
      if (row > 0) {
        const abovePoint = points[(row - 1) * cols + col];
        const edge = new Edge(point, abovePoint);
        edge.restLength = point.pos.dist(abovePoint.pos);
        edges.push(edge);

        //Diagonale Verbindungen
        if (!soft) {
          if (col > 0) {
            const topLeftPoint = points[(row - 1) * cols + (col - 1)];
            const diagEdge = new Edge(point, topLeftPoint);
            diagEdge.restLength = point.pos.dist(topLeftPoint.pos);
            edges.push(diagEdge);
          }

          if (col < cols - 1) {
            const topRightPoint = points[(row - 1) * cols + (col + 1)];
            const diagEdge = new Edge(point, topRightPoint);
            diagEdge.restLength = point.pos.dist(topRightPoint.pos);
            edges.push(diagEdge);
          }
        }
      }
    }
  }

  return { points, edges };
};
