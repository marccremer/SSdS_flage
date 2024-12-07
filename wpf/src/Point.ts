import p5 from "p5";
export class Point {
  pos: p5.Vector;
  updated = false;
  locked = false;
  velocity: p5.Vector = new p5.Vector(0, 0, 0);
  acceleration: p5.Vector = new p5.Vector(0, 0, 0);
  constructor(pos: p5.Vector) {
    this.pos = pos;
  }

  draw(p: p5) {
    p.circle(this.pos.x, this.pos.y, 10);
    this.updated = false;
  }

  applyForce(force: p5.Vector) {
    if (this.locked) return;
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.pos.add(this.velocity);
    this.acceleration.mult(0);
  }
}
