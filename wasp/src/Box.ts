import p5 from "p5";

export class Box {
  center: p5.Vector;
  width: number;
  height: number;
  depth: number;

  constructor(center: p5.Vector, width: number, height: number, depth: number) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.depth = depth;
  }

  draw(p: p5) {
    p.push();
    p.translate(this.center.x, this.center.y, this.center.z);
    p.box(this.width, this.height, this.depth);
    p.pop();
  }
}
