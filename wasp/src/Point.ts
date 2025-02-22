import p5 from "p5";
export class Point {
  pos: p5.Vector;
  updated = false;
  locked = false;
  inside = false;
  damping = 0.99;
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

  nextPoint() {
    const current_velocity = this.velocity.copy();
    current_velocity.add(this.acceleration);
    current_velocity.mult(this.damping);
    return this.pos.copy().add(current_velocity);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.mult(this.damping);
    this.pos.add(this.velocity);
    this.acceleration.mult(0);
  } // Collision detection and resolution with a sphere
  collideWithSphere(sphereCenter: p5.Vector, sphereRadius: number) {
    const nextPoint = this.nextPoint();
    const distance = nextPoint.dist(sphereCenter);

    if (distance <= sphereRadius) {
      // Collision detected!
      // Calculate collision normal
      const collisionNormal = nextPoint.copy().sub(sphereCenter).normalize();

      // Calculate relative velocity (assuming sphere is static)
      const relativeVelocity = this.velocity.copy();

      // Calculate impulse scalar
      const impulseScalar = relativeVelocity.dot(collisionNormal);

      // If the point is moving away from the sphere, no need to resolve
      if (impulseScalar > 0) {
        return;
      }

      // Calculate impulse vector
      const impulse = collisionNormal.copy().mult(-impulseScalar);

      // Apply the impulse to the point's velocity (basic reflection)
      this.velocity.add(impulse);

      // Separate the point from the sphere
      const penetrationDepth = sphereRadius - distance;
      this.pos.add(collisionNormal.copy().mult(penetrationDepth));

      // Apply a force *after* the collision resolution (optional)
      // Example: Apply a small force away from the sphere
      const escapeForce = collisionNormal.copy().mult(0.1); // Adjust magnitude as needed
      this.applyForce(escapeForce);
    }
  }
}
