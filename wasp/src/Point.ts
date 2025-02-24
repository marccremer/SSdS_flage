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
    const { center, depth, height, width } = box;
    const face = closestFaceNormal(center, width, height, depth, this.pos);
    if (face) {
      this.inside = true;
      this.velocity.set(0, 0, 0);
    }
  }
}
function closestFaceNormal(
  boxCenter: p5.Vector,
  width: number,
  height: number,
  depth: number,
  point: p5.Vector
): p5.Vector | null {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Compute box min and max bounds
  const minX = boxCenter.x - halfW,
    maxX = boxCenter.x + halfW;
  const minY = boxCenter.y - halfH,
    maxY = boxCenter.y + halfH;
  const minZ = boxCenter.z - halfD,
    maxZ = boxCenter.z + halfD;

  // Check if the point is inside the box
  if (
    point.x < minX ||
    point.x > maxX ||
    point.y < minY ||
    point.y > maxY ||
    point.z < minZ ||
    point.z > maxZ
  ) {
    return null; // Point is outside the box
  }

  // Compute distances to each face
  const distances = {
    left: point.x - minX, // -X face
    right: maxX - point.x, // +X face
    bottom: point.y - minY, // -Y face
    top: maxY - point.y, // +Y face
    back: point.z - minZ, // -Z face
    front: maxZ - point.z, // +Z face
  };

  // Find the closest face
  let minDist = Infinity;
  let closestNormal = new p5.Vector(0, 0, 0);

  for (const [face, dist] of Object.entries(distances)) {
    if (dist < minDist) {
      minDist = dist;
      switch (face) {
        case "left":
          closestNormal = new p5.Vector(-1, 0, 0);
          break;
        case "right":
          closestNormal = new p5.Vector(1, 0, 0);
          break;
        case "bottom":
          closestNormal = new p5.Vector(0, -1, 0);
          break;
        case "top":
          closestNormal = new p5.Vector(0, 1, 0);
          break;
        case "back":
          closestNormal = new p5.Vector(0, 0, -1);
          break;
        case "front":
          closestNormal = new p5.Vector(0, 0, 1);
          break;
      }
    }
  }

  return closestNormal;
}
