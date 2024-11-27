import { generateRandomPosition, Vec2d, Vec3d } from './physics';

export const pageState = {
  paused: false,
};
export const physicConstants = {
  gravity: 1.98,
  springElasticity: 0.1,
  friction: 0.9,
  currentWindForce: (delta: number): Vec3d => [0, 0, 0],
};
export type PhysicConstants = typeof physicConstants;
export function generateWind(deltaTime: number, maxMagnitude: number): Vec3d {
  const {
    pos: [x, y, z],
  } = generateRandomPosition(1, -1, 3);
  return [Math.max(x * deltaTime, maxMagnitude), 1, 1];
}
