import p5 from "p5";
import{Point} from "./Point";

export function handleSphereCollision(
    point: Point,
    sphereCenter: p5.Vector,
    sphereRadius: number,
    p: p5
){

    const diff = p5.Vector.sub(point.pos, sphereCenter);
    const distance = diff.mag();

    if(distance < sphereRadius){

        const normal = diff.copy().normalize();
        //Berechne wie weit der Punkt in der Kugel ist
        const penetrationDepth = sphereRadius - distance;

        //Punkt zur Oberfläche verschieben
        point.pos.add(normal.copy().mult(penetrationDepth));

        //Anpassung der Geschwindigkeit:
        //Entferne den Anteil, in Richtung der Kugel
        const vDotN = point.velocity.dot(normal);

        if(vDotN < 0){ //Nur wenn der Punkt in Richtung Kugel fliegt

            const correction = normal.copy().mult(vDotN);
            point.velocity.sub(correction);
        }
    }
}