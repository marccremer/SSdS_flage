import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";

export function applyImageTextureToShape(
  points: Point[],
  instance: p5,
  img: p5.Image,
  gridHeight: number,
  gridWidth: number
) {
  if (!img || points.length === 0) return;

  // Sort points into a grid-like structure
  const sortedPoints: Point[][] = to2DGrid(points, gridWidth, gridHeight);
  const sortedPoints2 = to2DGrid(
    points.map((p) => p.pos),
    gridHeight,
    gridWidth
  );
  //console.table(sortedPoints2);

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
      instance.beginShape(instance.QUADS);
      instance.stroke(0);
      instance.vertex(topLeft.pos.x, topLeft.pos.y, u1, v1);
      instance.vertex(topRight.pos.x, topRight.pos.y, u2, v1);
      instance.vertex(bottomRight.pos.x, bottomRight.pos.y, u2, v2);
      instance.vertex(bottomLeft.pos.x, bottomLeft.pos.y, u1, v2);
      instance.endShape(instance.CLOSE);
    }
  }
}

function to2DGrid<T>(data: T[], columns: number, rows: number): T[][] {
  const grid: T[][] = []; // Initialize 2D array

  for (let row = 0; row < rows; row++) {
    const start = row * columns; // Calculate the start index for this row
    const end = start + columns; // Calculate the end index for this row
    const rowSlice = data.slice(start, end); // Extract a portion of the input array

    // Fill up the remaining slots with undefined if the slice is smaller than columns
    while (rowSlice.length < columns) {
      rowSlice.push(undefined);
    }

    grid.push(rowSlice); // Add the row to the grid
  }

  return grid;
}
