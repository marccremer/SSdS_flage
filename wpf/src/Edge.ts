import { Point } from './Point';
import p5 from 'p5';
export class Edge {
  constructor(private a: Point, private b: Point) {}

  update(
    edgeUpdateFn: (a: Point, b: Point) => void,
    pointUpdateFn: (c: Point) => void
  ) {
    edgeUpdateFn(this.a, this.b);
    if (!this.a.updated) {
      pointUpdateFn(this.a);
      this.a.updated = true;
    }
    if (!this.b.updated) {
      pointUpdateFn(this.b);
      this.b.updated = true;
    }
  }
  draw(p: p5) {
    const { x: x1, y: y1 } = this.a.pos;
    const { x: x2, y: y2 } = this.b.pos;
    p.line(x1, y1, x2, y2);
  }
}
