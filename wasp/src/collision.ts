import p5 from "p5";
import { Point } from "./Point";

export interface Collider {
  checkCollision(point: Point): boolean;
  resolveCollision(point: Point): void;
  draw(p: p5): void;
}

export class SphereCollider implements Collider {
  constructor(public center: p5.Vector, public radius: number) {}

  checkCollision(point: Point): boolean {
    return point.pos.dist(this.center) < this.radius;
  }

  resolveCollision(point: Point) {
    handleSphereCollisionCCD(point, this.center, this.radius);
  }

  draw(p: p5) {
    p.push();
    p.stroke(0, 200, 0);
    p.noFill();
    p.translate(this.center.x, this.center.y, this.center.z);
    p.sphere(this.radius);
    p.pop();
  }
}

export class BoxCollider implements Collider {
  center: p5.Vector;
  size: p5.Vector;
  min: p5.Vector;
  max: p5.Vector;

  constructor(center: p5.Vector, size: p5.Vector) {
    this.center = center.copy();
    this.size = size.copy();
    this.min = p5.Vector.sub(this.center.copy(), this.size.copy().div(2));
    this.max = p5.Vector.add(this.center.copy(), this.size.copy().div(2));

    this.min.set(
      this.center.x - this.size.x / 2,
      this.center.y - this.size.y / 2,
      this.center.z - this.size.z / 2
    );
    this.max.set(
      this.center.x + this.size.x / 2,
      this.center.y + this.size.y / 2,
      this.center.z + this.size.z / 2
    );
  }

  checkCollision(point: Point): boolean {
    const pos = point.pos;
    const inside =
      pos.x >= this.min.x &&
      pos.x <= this.max.x &&
      pos.y >= this.min.y &&
      pos.y <= this.max.y &&
      pos.z >= this.min.z &&
      pos.z <= this.max.z;
    point.inside = inside;
    return inside;
  }

  resolveCollision(point: Point) {
    const overlapX = Math.min(
      this.max.x - point.pos.x,
      point.pos.x - this.min.x
    );
    const overlapY = Math.min(
      this.max.y - point.pos.y,
      point.pos.y - this.min.y
    );
    const overlapZ = Math.min(
      this.max.z - point.pos.z,
      point.pos.z - this.min.z
    );

    if (overlapX <= overlapY && overlapX <= overlapZ) {
      point.pos.x = point.pos.x < this.center.x ? this.min.x : this.max.x;
      point.velocity.x = 0;
    } else if (overlapY <= overlapX && overlapY <= overlapZ) {
      point.pos.y = point.pos.y < this.center.y ? this.min.y : this.max.y;
      point.velocity.y = 0;
    } else {
      point.pos.z = point.pos.z < this.center.z ? this.min.z : this.max.z;
      point.velocity.z = 0;
    }

    point.velocity.mult(0.9);
  }

  draw(p: p5) {
    p.push();
    p.stroke(0, 0, 200);
    p.noFill();
    p.translate(this.center.x, this.center.y, this.center.z);
    p.box(this.size.x, this.size.y, this.size.z); // Sicherstellen, dass `size` korrekt ist
    p.pop();

    console.log("Min:", this.min, "Max:", this.max, "Size:", this.size);
  }
}

export function handleCollisions(point: Point, colliders: Collider[]) {
  for (const collider of colliders) {
    if (collider.checkCollision(point)) {
      collider.resolveCollision(point);
    }
  }
}

export function handleSphereCollisionCCD(
  point: Point,
  sphereCenter: p5.Vector,
  sphereRadius: number
) {
  const oldPos = point.pos.copy();
  const newPos = point.nextPoint();

  const oldDist = oldPos.dist(sphereCenter);
  if (oldDist < sphereRadius) {
    const normal = p5.Vector.sub(oldPos, sphereCenter).normalize();
    const penetration = sphereRadius - oldDist;
    if (penetration > 0.01) {
      point.pos.add(normal.copy().mult(penetration + 0.001));
      point.velocity.mult(0.95);
    }

    oldPos.set(point.pos);
  }

  const collisionT = intersectMovingPointWithSphere(
    oldPos,
    newPos,
    sphereCenter,
    sphereRadius
  );

  if (collisionT === null) {
    return;
  }

  let safeT = collisionT - 0.001;
  if (safeT < 0) safeT = 0;
  const collisionPos = p5.Vector.lerp(oldPos, newPos, safeT);

  point.pos.set(collisionPos);

  const normal = p5.Vector.sub(collisionPos, sphereCenter).normalize();

  const v = point.velocity;
  const dot = v.dot(normal);

  const normalPart = normal.copy();
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

  if (discriminant < 0) {
    return null;
  }

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  let tMin = Infinity;

  for (const t of [t1, t2]) {
    if (t >= 0 && t <= 1 && t < tMin) {
      tMin = t;
    }
  }

  return tMin === Infinity ? null : tMin;
}
