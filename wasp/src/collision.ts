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

export class CylinderCollider implements Collider {
  origin: p5.Vector;
  radius: number;
  height: number;

  constructor(origin: p5.Vector, radius: number, height: number) {
    this.origin = origin.copy();
    this.radius = radius;
    this.height = height;
  }

  checkCollision(movingPoint: Point): boolean {
    const nextPosition = movingPoint.nextPoint();
    const localPosition = p5.Vector.sub(nextPosition, this.origin);

    const z = localPosition.z;
    if (z < 0 || z > this.height) return false; //Überprüfung, ob der Punkt innerhalb der Höhe des Zylinders ist

    const radialPosition = localPosition.copy();
    radialPosition.z = 0; // Setze Z-Koordinate auf 0 für die radiale Analyse
    return radialPosition.magSq() <= this.radius * this.radius; //Überprüfe, ob der Punkt im radialen Bereich des Zylinders ist
  }

  resolveCollision(movingPoint: Point): void {
    const nextPosition = movingPoint.nextPoint();
    const localPosition = p5.Vector.sub(nextPosition, this.origin);
    const z = localPosition.z;

    if (z < 0 || z > this.height) return; //Überprüfung, ob der Punkt innerhalb der Höhe des Zylinders ist

    const radialPosition = localPosition.copy();
    radialPosition.z = 0;
    const distSquared = radialPosition.magSq(); //Berechnung der Quadratdistanz zur Zylinderachse
    if (distSquared > this.radius * this.radius) return; //Überprüfe, ob der Punkt innerhalb des Zylinderradius ist

    const collisionNormal = radialPosition.copy().normalize(); //Normale für Kollision
    if (collisionNormal.magSq() === 0) return;

    const velocityDotNormal = movingPoint.velocity.dot(collisionNormal); //Projektion der Geschwindigkeit auf die Normale
    const normalComponent = collisionNormal.copy().mult(velocityDotNormal); //Teil der Geschwindigkeit in Richtung der Normale
    movingPoint.velocity.sub(normalComponent); //Subtrahiere diesen Teil von der Geschwindigkeit

    const distFromCenter = Math.sqrt(distSquared); //Berechnung des Abstands zum Zylinderzentrum
    const penetrationDepth = this.radius - distFromCenter; //Berechne die Tiefe der Penetration
    const safePenetrationDepth = penetrationDepth - 0.001; //Sicherheitsabstand um "Kleben" zu vermeiden

    if (safePenetrationDepth > 0) {
      //Wenn Penetration stattgefunden hat, schiebe den Punkt zurück
      movingPoint.pos.add(collisionNormal.copy().mult(safePenetrationDepth));
    }
  }

  draw(p: p5): void {
    p.push();
    p.translate(this.origin.x, this.origin.y, this.origin.z + this.height / 2);
    p.rotateX(p.HALF_PI);
    p.fill("blue");
    p.noStroke();
    p.cylinder(this.radius, this.height);
    p.pop();
  }
}

export class BoxCollider implements Collider {
  /**
   * Untere linke vordere Ecke
   */
  min: p5.Vector; // Kleinster Punkt (Minimalkoordinaten) der Box
  /**
   * Obere rechte hintere Ecke
   */
  max: p5.Vector; // Größter Punkt (Maximalkoordinaten) der Box

  constructor(public center: p5.Vector, public size: p5.Vector) {
    this.center = center.copy();
    this.size = size.copy();

    // Berechnung der Min- und Max-Positionen der Box anhand des Zentrums und der Größe
    this.min = p5.Vector.sub(this.center.copy(), this.size.copy().div(2)); // Untere linke vordere Ecke
    this.max = p5.Vector.add(this.center.copy(), this.size.copy().div(2)); // Obere rechte hintere Ecke

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

    // Bestimme, in welcher Achse die größte Überlappung ist und korrigiere den Punkt
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
  }

  // Überprüft, ob eine Linie mit der Box kollidiert
  checkEdgeCollision(
    start: p5.Vector,
    end: p5.Vector
  ): { collides: boolean; normal?: p5.Vector; point?: p5.Vector } {
    const dir = p5.Vector.sub(end, start);
    let xMin = 0.0;
    let xMax = 1.0;
    let collisionAxis: "x" | "y" | "z" | null = null; // Achse der Kollision

    // Teste alle drei Achsen (x, y, z)
    for (const axis of ["x", "y", "z"] as const) {
      if (Math.abs(dir[axis]) < 0.000001) {
        // Wenn die Linie parallel zur Achse ist
        if (start[axis] < this.min[axis] || start[axis] > this.max[axis]) {
          return { collides: false }; // Kein Kollision
        }
        continue; // Fahre fort mit der nächsten Achse
      }

      const invDir = 1.0 / dir[axis]; // Inverse der Richtung
      let x1 = (this.min[axis] - start[axis]) * invDir; // Schnittpunkt mit min-Wert
      let x2 = (this.max[axis] - start[axis]) * invDir; // Schnittpunkt mit max-Wert

      if (x1 > x2) [x1, x2] = [x2, x1]; // Sortiere x1 und x2

      if (x1 > xMin) {
        xMin = x1; // Aktualisiere xMin, wenn x1 größer ist
        collisionAxis = axis; // Setze die Achse der Kollision
      }

      xMax = Math.min(xMax, x2); // Aktualisiere xMax mit dem kleineren von xMax und x2

      if (xMin > xMax) return { collides: false }; // Wenn xMin größer als xMax ist, keine Kollision
    }

    // Überprüfe, ob xMin und xMax innerhalb der Grenzen liegen
    if (xMin < 0 || xMax > 1) return { collides: false };

    // Berechnung des Kollisionspunkts und Normalen
    const collisionPoint = p5.Vector.add(start, dir.mult(xMin));
    const normal = collisionAxis
      ? this.calculateCollisionNormal(collisionPoint, collisionAxis) // Berechnung der Kollisionsnormalen
      : new p5.Vector(0, 0, 0);

    return {
      collides: true,
      normal: normal.normalize(),
      point: collisionPoint,
    };
  }

  // Berechnet die Normale an der Kollisionsstelle basierend auf der Achse
  private calculateCollisionNormal(
    point: p5.Vector,
    collisionAxis: "x" | "y" | "z"
  ): p5.Vector {
    const normal = new p5.Vector();
    const axisCenter = this.center[collisionAxis]; // Mittelpunkt entlang der Kollisionsachse
    const pointPos = point[collisionAxis]; // Position des Punktes entlang der Kollisionsachse

    // Bestimme die Richtung der Normalen basierend darauf, ob der Punkt links oder rechts vom Zentrum ist
    if (pointPos < axisCenter) {
      normal[collisionAxis] = -1; // Normale zeigt in negative Richtung
    } else {
      normal[collisionAxis] = 1; // Normale zeigt in positive Richtung
    }

    return normal;
  }

  resolveEdgeCollision(start: Point, end: Point) {
    const result = this.checkEdgeCollision(start.pos, end.pos);

    // Wenn keine Kollision, breche die Methode ab
    if (!result.collides || !result.normal || !result.point) return;

    const penetration = 0.5; // Penetrationstiefe zur Korrektur
    const correction = result.normal.copy().mult(penetration); // Korrektur basierend auf der Normalen

    const totalDist = start.pos.dist(end.pos); // Gesamtstrecke zwischen den Punkten
    const weightStart = end.pos.dist(result.point) / totalDist; // Gewichtung für Startpunkt
    const weightEnd = start.pos.dist(result.point) / totalDist; // Gewichtung für Endpunkt

    if (!start.locked) {
      const correctionStart = correction.copy().mult(weightStart);
      start.pos.add(correctionStart);
    }

    if (!end.locked) {
      const correctionEnd = correction.copy().mult(weightEnd);
      end.pos.add(correctionEnd);
    }

    // Reflexion der Geschwindigkeit in Richtung der Normalen mit Dämpfung
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

  const distFromSphereCenter = oldPos.dist(sphereCenter);
  if (distFromSphereCenter < sphereRadius) {
    const normal = p5.Vector.sub(oldPos, sphereCenter).normalize(); //Berechne die Normale zur Oberfläche der Kugel
    const penetrationDepth = sphereRadius - distFromSphereCenter;
    if (penetrationDepth > 0.001) {
      //Ab welcher tiefe soll korrigiert werden
      point.pos.add(normal.copy().mult(penetrationDepth + 0.001)); //Verschiebe den Punkt nach außen
      point.velocity.mult(0.95);
    }

    oldPos.set(point.pos);
  }

  const collisionTime = intersectMovingPointWithSphere(
    oldPos,
    newPos,
    sphereCenter,
    sphereRadius
  );

  if (collisionTime === null) {
    return;
  }

  let safeT = collisionTime - 0.001;
  if (safeT < 0) safeT = 0;
  const collisionPos = p5.Vector.lerp(oldPos, newPos, safeT);

  point.pos.set(collisionPos);

  const collisionNormal = p5.Vector.sub(collisionPos, sphereCenter).normalize(); //Berechne die Normale an der Kollisionsposition

  const velocity = point.velocity;
  const dotProduct = velocity.dot(collisionNormal); //Berechne das Skalarprodukt mit der Normale

  const normalComponent = collisionNormal.copy(); //Berechne den Anteil der Geschwindigkeit entlang der Normale
  normalComponent.mult(dotProduct); //Entferne den Anteil entlang der Normale von der Geschwindigkeit
  velocity.sub(normalComponent);

  velocity.mult(0.95);
}

function intersectMovingPointWithSphere(
  start: p5.Vector,
  end: p5.Vector,
  center: p5.Vector,
  radius: number
): number | null {
  const direction = p5.Vector.sub(end, start);
  const offsetFromSphereCenter = p5.Vector.sub(start, center);

  //Berechne die erforderlichen Werte für die quadratische Gleichung
  const a = direction.dot(direction); //a ist der Betrag des Richtungsvektors
  const b = 2 * offsetFromSphereCenter.dot(direction); //b für die quadratische Gleichung
  const c =
    offsetFromSphereCenter.dot(offsetFromSphereCenter) - radius * radius; //c für die quadratische Gleichung

  const discriminant = b * b - 4 * a * c; //Berechne den Diskriminanten der quadratischen Gleichung

  if (discriminant < 0) {
    return null;
  }

  //Berechne die beiden möglichen Schnittpunkte
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x1 = (-b - sqrtDiscriminant) / (2 * a);
  const x2 = (-b + sqrtDiscriminant) / (2 * a);

  let minimumCollisionTime = Infinity;

  for (const x of [x1, x2]) {
    if (x >= 0 && x <= 1 && x < minimumCollisionTime) {
      //x ist gültig, wenn es zwischen 0 und 1 liegt, was bedeutet, dass der Schnittpunkt innerhalb der Bewegung liegt
      minimumCollisionTime = x;
    }
  }
  //Gibt den minimalen Kollisionsparameter zurück oder null, wenn kein gültiger Schnittpunkt gefunden wurde
  return minimumCollisionTime === Infinity ? null : minimumCollisionTime;
}
