import {BoxCollider, Collider, ConeCollider, CylinderCollider, SphereCollider} from "./collision.ts";
import p5 from "p5";

export const scenes: Record<string, Collider[]> = {

    sceneA: [

        new SphereCollider(new p5.Vector(150, 250, 20), 50),
        new BoxCollider(new p5.Vector(105,200, 20), new p5.Vector(100, 100, 100)),
        new BoxCollider(new p5.Vector(0, 600, 0), new p5.Vector(3000, 10, 5000)),
        //new CylinderCollider(new p5.Vector(130, 200, -29), 40, 98)
    ],

    sceneB: [

        new CylinderCollider(new p5.Vector(200, 300, 0), 80, 100),
        new BoxCollider(new p5.Vector(100, 500, 0), new p5.Vector(300, 20, 300))
    ],

    sceneC: [
        new SphereCollider(new p5.Vector(200, 250, 20), 70)
    ]
};