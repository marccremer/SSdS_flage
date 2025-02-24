import p5 from "p5";
import { Box } from "./Box";
export class Point {
  pos: p5.Vector;
  updated = false;
  locked = false;
  inside = false;
  velocity: p5.Vector = new p5.Vector(0, 0, 0);
  acceleration: p5.Vector = new p5.Vector(0, 0, 0);
  constructor(pos: p5.Vector) {
    this.pos = pos;
    this.pos.x += 100;
  }

  draw(p: p5) {
    p.circle(this.pos.x, this.pos.y, 10);
    this.updated = false;
  }

  applyForce(force: p5.Vector) {
    if (this.locked) return;
    this.acceleration.add(force);
  }
  get damping() {
    if (this.inside) return 0.1;
    return 0.99;
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
  collideWithBox(box: Box) {
    const boxMin = p5.Vector.sub(
      box.center,
      new p5.Vector(box.width / 2, box.height / 2, box.depth / 2)
    );
    const boxMax = p5.Vector.add(
      box.center,
      new p5.Vector(box.width / 2, box.height / 2, box.depth / 2)
    );

    const nextPos = this.nextPoint();
    let collided = false;

    // Check X boundaries
    if (nextPos.x < boxMin.x) {
      this.velocity.x = 0;
      collided = true;
    } else if (nextPos.x > boxMax.x) {
      this.pos.x = boxMax.x;
      this.velocity.x = 0;
      collided = true;
    }

    // Check Y boundaries
    if (nextPos.y < boxMin.y) {
      this.velocity.y = 0;
      collided = true;
    } else if (nextPos.y > boxMax.y) {
      this.pos.y = boxMax.y;
      this.velocity.y = 0;
      collided = true;
    }

    // Check Z boundaries
    if (nextPos.z < boxMin.z) {
      this.velocity.z = 0;
      collided = true;
    } else if (nextPos.z > boxMax.z) {
      this.velocity.z = 0;
      collided = true;
    }

    if (collided) {
      this.inside = true;
      /*       // Reset velocity in the direction towards the center of the box
      const directionToCenter = p5.Vector.sub(box.center, this.pos).normalize();
      this.velocity.set(
        directionToCenter.x === 0 ? this.velocity.x : 0,
        directionToCenter.y === 0 ? this.velocity.y : 0,
        directionToCenter.z === 0 ? this.velocity.z : 0
      ); */
    }
  }
}
