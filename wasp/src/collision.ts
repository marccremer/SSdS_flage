import p5 from "p5";
import { Point } from "./Point";

interface Sphere {
  center: p5.Vector;
  radius: number;
}

export function handleSphereCollision(
  point: Point,
  sphereCenter: p5.Vector,
  sphereRadius: number,
  p: p5
) {
  const sphere: Sphere = { center: sphereCenter, radius: sphereRadius };
  const nextPoint = point.nextPoint();
  if (pointSphereCollision(nextPoint, sphere)) {
    point.inside = true;
    point.collideWithSphere(sphere.center, sphere.radius);
  }

  // resolvePointSphereCollision(point, sphere);
}

function pointSphereCollision(pos: p5.Vector, sphere: Sphere): boolean {
  const distance = pos.dist(sphere.center);
  return distance <= sphere.radius;
}

function resolvePointSphereCollision(point: Point, sphere: Sphere): void {
  // Calculate the collision normal (vector from sphere center to point)
  const pos = point.pos.copy();
  const collisionNormal = pos.sub(sphere.center).normalize();

  // Calculate the relative velocity
  const relativeVelocity = point.velocity.copy(); // Assuming sphere is static

  // Calculate the impulse scalar (dot product of relative velocity and collision normal)
  const impulseScalar = relativeVelocity.dot(collisionNormal);

  // If the point is moving away from the sphere, no need to resolve
  if (impulseScalar > 0) {
    return;
  }

  // Calculate the impulse vector
  const impulse = collisionNormal.mult(-impulseScalar);

  // Apply the impulse to the point's velocity (basic reflection)
  point.velocity.add(impulse);

  // Separate the point from the sphere (move it along the collision normal)
  const penetrationDepth = sphere.radius - point.pos.dist(sphere.center);
  point.pos.add(collisionNormal.mult(penetrationDepth));
}
