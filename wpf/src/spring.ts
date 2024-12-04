import { Point } from "./Point";

export function applySpringForce(
  a: Point,
  b: Point,
  opts: {
    restLength: number;
    springConstant: number;
  }
): void {
  const extension = b.pos.copy().sub(a.pos); // Copy b.pos to avoid modifying the original

  // Calculate the current length of the spring
  const currentLength = extension.mag();

  // Get the normalized direction vector
  const normalizedDir = extension.normalize();

  // Calculate the magnitude of the spring force
  const forceMagnitude =
    opts.springConstant * (currentLength - opts.restLength);

  // Scale the normalized direction vector by the force magnitude
  const springForce = normalizedDir.mult(forceMagnitude);

  // Apply the spring force to the points
  b.applyForce(springForce);
  a.applyForce(springForce.mult(-1)); // Apply opposite force to a. In place modification
}
