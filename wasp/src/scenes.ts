import {
  BoxCollider,
  Collider,
  ConeCollider,
  CylinderCollider,
  SphereCollider,
} from "./collision.ts";
import p5 from "p5";

export const scenes: Record<
  string,
  { collider: Collider[]; spacing: number; soft: boolean }
> = {
  A: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 20), 50),
      new BoxCollider(
        new p5.Vector(105, 200, 20),
        new p5.Vector(100, 100, 100)
      ),
      new BoxCollider(new p5.Vector(0, 600, 0), new p5.Vector(3000, 10, 5000)),
      new ConeCollider(new p5.Vector(150, 200, 70), 40, 50),
    ],
    soft: false,
    spacing: 10,
  },

  cylinder_soft: {
    collider: [
      new CylinderCollider(new p5.Vector(200, 300, 0), 80, 100),
      new BoxCollider(new p5.Vector(100, 500, 0), new p5.Vector(300, 20, 300)),
    ],
    soft: true,
    spacing: 10,
  },
  cylinder: {
    collider: [
      new CylinderCollider(new p5.Vector(200, 300, 0), 80, 100),
      new BoxCollider(new p5.Vector(100, 500, 0), new p5.Vector(300, 20, 300)),
    ],
    soft: false,
    spacing: 10,
  },

  C: {
    collider: [new SphereCollider(new p5.Vector(200, 250, 20), 70)],
    soft: false,
    spacing: 10,
  },
  onlyCone: {
    collider: [new ConeCollider(new p5.Vector(150, 200, 70), 40, 50)],
    soft: false,
    spacing: 10,
  },
};
