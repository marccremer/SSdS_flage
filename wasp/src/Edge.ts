import { Point } from "./Point";
import p5 from "p5";

export class Edge {
  restLength = 20;

  constructor(public PointA: Point, public PointB: Point) {}

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
      this.PointA.pos.z,
      this.PointB.pos.x,
      this.PointB.pos.y,
      this.PointB.pos.z
    );
    p.fill("red");
    if (this.PointA.inside) {
      const { x, y, z } = this.PointA.pos;
      p.push();
      p.translate(x, y, z);
      p.sphere(5, 20, 20);
      p.pop();
    }

    if (this.PointB.inside) {
      const { x, y, z } = this.PointB.pos;
      p.push();
      p.translate(x, y, z);
      p.sphere(5, 20, 20);
      p.pop();
    }
    p.noFill();
  }
}
