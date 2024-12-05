import { Point } from "./Point";
import p5 from "p5";

export class Edge {
  restLength = 20;

  constructor(private PointA: Point, private PointB: Point) {}

  update(
    edgeUpdateFn: (a: Point, b: Point) => void,
    pointUpdateFn: (c: Point) => void
  ) {
    edgeUpdateFn(this.PointA, this.PointB);

    if (!this.PointA.updated) {
      pointUpdateFn(this.PointA);
      this.PointA.update();
      this.PointA.updated = true;
    }

    if (!this.PointB.updated) {
      pointUpdateFn(this.PointB);
      this.PointB.update();
      this.PointB.updated = true;
    }
  }
  draw(p: p5) {
    p.line(
      this.PointA.pos.x,
      this.PointA.pos.y,
      this.PointB.pos.x,
      this.PointB.pos.y
    );
  }
}
