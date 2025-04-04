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

export class ConeCollider implements Collider {
  apex: p5.Vector;
  axis: p5.Vector;
  constructor(
    private origin: p5.Vector,
    private height: number,
    public baseRadius: number
  ) {
    this.apex = p5.Vector.sub(
      this.origin,
      new p5.Vector(0, this.height / 2, 0)
    ).copy(); // tip of the cone
    this.axis = new p5.Vector(0, 1, 0);
  }
  // Checks if the point is inside the cone
  checkCollision(point: Point) {
    const AP = p5.Vector.sub(point.pos, this.apex); // vector from apex to point
    const t = p5.Vector.dot(AP, this.axis); // projection length along the cone's axis

    if (t < 0 || t > this.height) return false; // outside vertical extent

    const proj = this.axis.copy().mult(t); // projected vector
    const radialVec = p5.Vector.sub(AP, proj); // radial offset from axis
    const radiusAtT = (t / this.height) * this.baseRadius;

    const ding = radialVec.mag() <= radiusAtT;
    //if (ding) point.inside = true;
    return ding;
  }

  resolveCollision(point: Point): void {
    const AP = p5.Vector.sub(point.pos, this.apex);
    const t = p5.Vector.dot(AP, this.axis);

    if (t < 0 || t > this.height) return; // no collision to resolve

    const proj = this.axis.copy().mult(t); // projection on cone axis
    const radialVec = p5.Vector.sub(AP, proj);
    const dist = radialVec.mag();
    const radiusAtT = (t / this.height) * this.baseRadius;

    if (dist < radiusAtT) {
      // --- Push point to surface ---
      const correction = radialVec.copy().setMag(radiusAtT - dist);
      point.pos.add(correction);

      // --- Resolve velocity ---
      const normal = radialVec.copy().normalize();
      const velAlongNormal = normal
        .copy()
        .mult(p5.Vector.dot(point.velocity, normal));

      const bounce = 0.5; // adjust from 0 (no bounce) to 1 (perfect bounce)
      point.velocity.sub(velAlongNormal.mult(1 + bounce));
    }
  }

  draw(p: p5) {
    p.push();
    p.translate(this.origin.x, this.origin.y, this.origin.z);
    p.rotateX(p.PI);
    p.stroke("blue");
    p.sphere(4); // cone origin
    p.cone(this.baseRadius, this.height, 24, 2);
    p.pop();
    p.push();
    p.translate(this.apex.x, this.apex.y, this.apex.z);
    p.pop();
  }
}

export class BoxCollider implements Collider {
  min: p5.Vector;
  max: p5.Vector;

  constructor(public center: p5.Vector, public size: p5.Vector) {
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
    return (
      pos.x >= this.min.x &&
      pos.x <= this.max.x &&
      pos.y >= this.min.y &&
      pos.y <= this.max.y &&
      pos.z >= this.min.z &&
      pos.z <= this.max.z
    );
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

    point.velocity.mult(0.95);
  }

  draw(p: p5) {
    p.push();
    p.stroke(0, 0, 200);
    p.fill(200, 200, 200);
    p.translate(this.center.x, this.center.y, this.center.z);
    p.box(this.size.x, this.size.y, this.size.z);
    p.pop();

    console.log("Min:", this.min, "Max:", this.max, "Size:", this.size);
  }

  checkEdgeCollision(
    start: p5.Vector,
    end: p5.Vector
  ): { collides: boolean; normal?: p5.Vector; point?: p5.Vector } {
    // Implementierung des 3D-Line-vs-AABB-Tests
    const dir = p5.Vector.sub(end, start);
    let tMin = 0.0;
    let tMax = 1.0;
    let collisionAxis: "x" | "y" | "z" | null = null;

    // Teste alle 3 Achsen
    for (const axis of ["x", "y", "z"] as const) {
      if (Math.abs(dir[axis]) < 0.000001) {
        // Linie ist parallel zur Achse
        if (start[axis] < this.min[axis] || start[axis] > this.max[axis]) {
          return { collides: false };
        }
        continue;
      }

      const invDir = 1.0 / dir[axis];
      let t1 = (this.min[axis] - start[axis]) * invDir;
      let t2 = (this.max[axis] - start[axis]) * invDir;

      if (t1 > t2) [t1, t2] = [t2, t1];

      if (t1 > tMin) {
        tMin = t1;
        collisionAxis = axis;
      }

      tMax = Math.min(tMax, t2);

      if (tMin > tMax) return { collides: false };
    }

    if (tMin < 0 || tMax > 1) return { collides: false };

    const collisionPoint = p5.Vector.add(start, dir.mult(tMin));
    const normal = collisionAxis
      ? this.calculateCollisionNormal(collisionPoint, collisionAxis)
      : new p5.Vector(0, 0, 0);

    return {
      collides: true,
      normal: normal.normalize(),
      point: collisionPoint,
    };
  }

  private calculateCollisionNormal(
    point: p5.Vector,
    collisionAxis: "x" | "y" | "z"
  ): p5.Vector {
    const normal = new p5.Vector();
    const axisCenter = this.center[collisionAxis];
    const pointPos = point[collisionAxis];

    if (pointPos < axisCenter) {
      normal[collisionAxis] = -1;
    } else {
      normal[collisionAxis] = 1;
    }

    return normal;
  }

  resolveEdgeCollision(start: Point, end: Point) {
    const result = this.checkEdgeCollision(start.pos, end.pos);

    if (!result.collides || !result.normal || !result.point) return;

    const penetration = 0.5;
    const correction = result.normal.copy().mult(penetration);

    const totalDist = start.pos.dist(end.pos);
    const weightStart = end.pos.dist(result.point) / totalDist;
    const weightEnd = start.pos.dist(result.point) / totalDist;

    if (!start.locked) {
      const correctionStart = correction.copy().mult(weightStart);
      start.pos.add(correctionStart);
    }

    if (!end.locked) {
      const correctionEnd = correction.copy().mult(weightEnd);
      end.pos.add(correctionEnd);
    }

    start.velocity.reflect(result.normal).mult(0.95);
    end.velocity.reflect(result.normal).mult(0.95);
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
