import {
  BoxCollider,
  Collider,
  ConeCollider,
  CylinderCollider,
  SphereCollider,
} from "./collision.ts";
import p5 from "p5";

export const scenes: Record<
  string, {
  collider: Collider[];
  grid_rows: number;
  grid_cols: number;
  spacing: number;
  soft: boolean;
  gravity: p5.Vector;
  wind: p5.Vector;
  edgeCollision: boolean;
}> = {
  //Ein Objekt
  sphere: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 50), 50)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  boxWithEdgeCollision: {
    collider: [
      new BoxCollider(new p5.Vector(100, 250, 50), new p5.Vector(300, 300, 300))
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  boxWithOutEdgeCollision: {
    collider: [
      new BoxCollider(new p5.Vector(100, 250, 50), new p5.Vector(300, 300, 300))
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: false
  },

  cylinder: {
    collider: [
      new CylinderCollider(new p5.Vector(190, 250, -30), 50, 150)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  cone: {
    collider: [
        new ConeCollider(new p5.Vector(150, 250, -20), 150, 150)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  //Mehrere Objekte
  fourSpheres: {
    collider: [
        new SphereCollider(new p5.Vector(180, 250, 70), 50),
        new SphereCollider(new p5.Vector(220, 250, 70), 50),
        new SphereCollider(new p5.Vector(180, 250, 20), 50),
        new SphereCollider(new p5.Vector(220, 250, 20), 50)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  allColliders: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 50), 50),
      new BoxCollider(new p5.Vector(200, 250, 0), new p5.Vector(100, 100, 100)),
      new CylinderCollider(new p5.Vector(150, 250, -50), 50, 100),
      new ConeCollider(new p5.Vector(249, 250, 49), 100, 50)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  //Verschiedene Stoffe
  largeCloth: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 50), 50),
      new BoxCollider(new p5.Vector(200, 250, 0), new p5.Vector(100, 100, 100)),
      new CylinderCollider(new p5.Vector(150, 250, -50), 50, 100),
      new ConeCollider(new p5.Vector(249, 250, 49), 100, 50)
    ],
    grid_rows: 20,
    grid_cols: 40,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  softCloth: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 50), 50),
      new BoxCollider(new p5.Vector(200, 250, 0), new p5.Vector(100, 100, 100)),
      new CylinderCollider(new p5.Vector(150, 250, -50), 50, 100),
      new ConeCollider(new p5.Vector(249, 250, 49), 100, 50)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: true,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },

  //Extremer Wind und Schwerkraft
  extremeWind: {
    collider: [
      new BoxCollider(new p5.Vector(400, 0, 50), new p5.Vector(150, 250, 150))
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.05, 0),
    wind: new p5.Vector(0.3, 0, 0),
    edgeCollision: true
  },

  extremeGravity: {
    collider: [
      new SphereCollider(new p5.Vector(150, 250, 50), 50),
      new BoxCollider(new p5.Vector(200, 250, 0), new p5.Vector(100, 100, 100)),
      new CylinderCollider(new p5.Vector(150, 250, -50), 50, 100),
      new ConeCollider(new p5.Vector(249, 250, 49), 100, 50)
    ],
    grid_rows: 10,
    grid_cols: 20,
    soft: false,
    spacing: 10,
    gravity: new p5.Vector(0, 0.5, 0),
    wind: new p5.Vector(0, 0, 0),
    edgeCollision: true
  },
};
