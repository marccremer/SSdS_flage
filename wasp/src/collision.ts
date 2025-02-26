import p5 from "p5";
import { Point } from "./Point";
import {normalizePath} from "vite";

interface Sphere {
  center: p5.Vector;
  radius: number;
}

export function updatePointWithSubSteps(
    point: Point,
    sphereCenter: p5.Vector,
    sphereRadius: number,
    gravity: p5.Vector,
    wind: p5.Vector,
    subSteps: number
) {

  const partialGravity = gravity.copy().div(subSteps);
  const partialWind = wind.copy().div(subSteps);

  for (let i = 0; i < subSteps; i++) {

    point.applyForce(partialGravity);
    point.applyForce(partialWind);

    point.update();

    handleSphereCollisionCCD(point, sphereCenter, sphereRadius);
  }
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
  /*if (impulseScalar > 0) {
    return;
  }*/

  // Calculate the impulse vector
  const impulse = collisionNormal.mult(-impulseScalar);

  // Apply the impulse to the point's velocity (basic reflection)
  point.velocity.add(impulse);

  // Separate the point from the sphere (move it along the collision normal)
  const penetrationDepth = sphere.radius - point.pos.dist(sphere.center);
  point.pos.add(collisionNormal.mult(penetrationDepth));
}

export function handleSphereCollisionSebi(
    point: Point,
    sphereCenter: p5.Vector,
    sphereRadius: number
){

  const offset = p5.Vector.sub(point.pos, sphereCenter);
  const distance = offset.mag();

  if (distance < sphereRadius){

    const normal = offset.copy().normalize();

    /*point.pos.set(

      sphereCenter.x + normal.x * sphereRadius,
      sphereCenter.y + normal.y * sphereRadius,
      sphereCenter.z + normal.z * sphereRadius
    );*/

    const dot = point.velocity.dot(normal);


    const normalPart = normal.copy().mult(dot);
    const tangential = p5.Vector.sub(point.velocity, normalPart);

    point.velocity = tangential.mult(0.95);
  }

}

export function handleSphereCollisionCCD(
    point: Point,
    sphereCenter: p5.Vector,
    sphereRadius: number
){

  const oldPos = point.pos.copy();
  const newPos = point.nextPoint();

  const oldDist = oldPos.dist(sphereCenter);
  if (oldDist < sphereRadius) {

    const normal = p5.Vector.sub(oldPos, sphereCenter).normalize();
    const penetration = sphereRadius - oldDist;
    if(penetration > 0.01){

      point.pos.add(normal.copy().mult(penetration + 0.001));
      point.velocity.mult(0.95)
    }

    oldPos.set(point.pos);
  }

  const collisionT = intersectMovingPointWithSphere(
      oldPos,
      newPos,
      sphereCenter,
      sphereRadius
  );

  if(collisionT === null){

    return;
  }

  let safeT = collisionT - 0.001;
  if(safeT < 0) safeT = 0;
  const collisionPos = p5.Vector.lerp(oldPos, newPos, safeT);

  point.pos.set(collisionPos);

  const normal = p5.Vector.sub(collisionPos, sphereCenter).normalize();

  const v = point.velocity;
  const dot = v.dot(normal);

  const normalPart = normal.copy()
  normalPart.mult(dot);
  v.sub(normalPart);

  v.mult(0.95);

  point.pos.add(normal.copy().mult(0.001));
}

function intersectMovingPointWithSphere(
    start: p5.Vector,
    end: p5.Vector,
    center: p5.Vector,
    radius: number
): number | null {

  const dir = p5.Vector.sub(end, start);
  const f = p5.Vector.sub(start, center);

  const a = dir.dot(dir);
  const b = 2 * f.dot(dir);
  const c = f.dot(f) - radius * radius;

  const discriminant = b * b - 4 * a * c;

  if(discriminant < 0){

    return null;
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  let tMin = Infinity;

  for (const t of [t1, t2]){

    if(t >= 0 && t <= 1 && t < tMin){

      tMin = t;
    }
  }

  return tMin === Infinity ? null: tMin;
}

