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
  // Apply texture to the grid
  instance.textureMode(instance.NORMAL);
  //instance.specularMaterial(255, 2);
  instance.shininess(200);
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
      instance.noStroke();
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

export function drawClothIn3D(
    p: p5,
    points: Point[],
    gridCols: number,
    gridRows: number
) {
  // Wir gehen davon aus, dass:
  // - points.length = gridCols * gridRows
  // - points[row * gridCols + col] liefert den jeweiligen Punkt
  // - Jeder Point hat pos = p5.Vector(x, y, z)

  p.push();
  p.noStroke();
  p.fill(200); // beliebige Farbe oder Material

  p.beginShape(p.TRIANGLES);

  // Wir durchlaufen jede "Zelle" im Gitter (row, col)
  // und erstellen 2 Dreiecke:
  //   (topLeft,  bottomLeft, topRight)
  //   (topRight, bottomLeft, bottomRight)

  for (let row = 0; row < gridRows - 1; row++) {
    for (let col = 0; col < gridCols - 1; col++) {
      // Indexberechnung der 4 Eckpunkte
      const topLeftIndex = row * gridCols + col;
      const topRightIndex = row * gridCols + (col + 1);
      const bottomLeftIndex = (row + 1) * gridCols + col;
      const bottomRightIndex = (row + 1) * gridCols + (col + 1);

      // Hole die 4 Punkte
      const topLeft = points[topLeftIndex].pos;
      const topRight = points[topRightIndex].pos;
      const bottomLeft = points[bottomLeftIndex].pos;
      const bottomRight = points[bottomRightIndex].pos;

      // 1. Dreieck (topLeft, bottomLeft, topRight)
      p.vertex(topLeft.x, topLeft.y, topLeft.z);
      p.vertex(bottomLeft.x, bottomLeft.y, bottomLeft.z);
      p.vertex(topRight.x, topRight.y, topRight.z);

      // 2. Dreieck (topRight, bottomLeft, bottomRight)
      p.vertex(topRight.x, topRight.y, topRight.z);
      p.vertex(bottomLeft.x, bottomLeft.y, bottomLeft.z);
      p.vertex(bottomRight.x, bottomRight.y, bottomRight.z);
    }
  }

  p.endShape();

  p.pop();
}