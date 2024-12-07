import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";

export function applyImageTextureToShape(
  edges: Edge[],
  instance: p5,
  img: p5.Image,
  gridHeight: number,
  gridWidth: number
) {
  if (!img || edges.length === 0) return;

  // Create a 2D array of points from edges
  const points: Point[] = [];
  const pointMap = new Map<string, Point>();

  // Collect unique points from the edges
  edges.forEach((edge) => {
    const aKey = `${edge["PointA"].pos.x},${edge["PointA"].pos.y}`;
    const bKey = `${edge["PointB"].pos.x},${edge["PointB"].pos.y}`;
    if (!pointMap.has(aKey)) {
      pointMap.set(aKey, edge["PointA"]);
    }
    if (!pointMap.has(bKey)) {
      pointMap.set(bKey, edge["PointB"]);
    }
  });

  points.push(...pointMap.values());

  if (points.length !== gridHeight * gridWidth) {
    console.error("Mismatch between points and grid dimensions.");
    return;
  }

  // Sort points into a grid-like structure
  const sortedPoints: Point[][] = [];
  for (let row = 0; row < gridHeight; row++) {
    sortedPoints.push(points.slice(row * gridWidth, (row + 1) * gridWidth));
  }

  // Apply texture to the grid
  instance.textureMode(instance.NORMAL);
  instance.texture(img);

  for (let row = 0; row < gridHeight - 1; row++) {
    for (let col = 0; col < gridWidth - 1; col++) {
      const topLeft = sortedPoints[row][col];
      const topRight = sortedPoints[row][col + 1];
      const bottomLeft = sortedPoints[row + 1][col];
      const bottomRight = sortedPoints[row + 1][col + 1];

      const u1 = col / (gridWidth - 1);
      const v1 = row / (gridHeight - 1);
      const u2 = (col + 1) / (gridWidth - 1);
      const v2 = (row + 1) / (gridHeight - 1);

      // Draw the cell as a textured quadrilateral
      instance.beginShape();
      instance.vertex(topLeft.pos.x, topLeft.pos.y, u1, v1);
      instance.vertex(topRight.pos.x, topRight.pos.y, u2, v1);
      instance.vertex(bottomRight.pos.x, bottomRight.pos.y, u2, v2);
      instance.vertex(bottomLeft.pos.x, bottomLeft.pos.y, u1, v2);
      instance.endShape(instance.CLOSE);
    }
  }
}
