import p5 from 'p5';
export class Point {
  pos: p5.Vector;
  updated = false;
  velocity: p5.Vector = new p5.Vector(0, 0, 0);
  accelaration: p5.Vector = new p5.Vector(0, 0, 0);
  constructor(pos: p5.Vector) {
    this.pos = pos;
  }

  draw(p: p5) {
    p.circle(this.pos.x, this.pos.y, 20);
    this.updated = false;
  }

  applyForce(force: p5.Vector) {
    this.accelaration.add(force);
  }

  update() {
    this.velocity.add(this.accelaration);
    this.pos.add(this.velocity);
    this.accelaration.mult(0);
  }
}
