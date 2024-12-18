import p5 from "p5";
import { Point } from "./Point";
export function applySpringForce(
  a: Point,
  b: Point,
  opts: {
    restLength: number;
    springConstant: number;
  }
): void {
  const distance = p5.Vector.sub(a.pos, b.pos);
  // Calculate the current length of the spring

  const stretch = distance.mag() - opts.restLength;
  // Get the normalized direction vector
  const normalizedDis = distance.copy().normalize();

  // Calculate the magnitude of the spring force
  const forceMagnitude = opts.springConstant * stretch;

  // Scale the normalized direction vector by the force magnitude
  const springForce = normalizedDis
    .copy()
    .mult(Math.min(forceMagnitude, 10_000));

  // Apply the spring force to the points
  b.applyForce(springForce);
  a.applyForce(springForce.mult(-1)); // Apply opposite force to a. In place modification
}
