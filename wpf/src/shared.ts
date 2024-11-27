import { generateRandomPosition, Vec2d } from './physics';

export const pageState = {
  paused: false,
};
export const physicConstants = {
  gravity: 1.98,
  springElasticity: 0.1,
  friction: 0.9,
  currentWindForce: (delta: number): Vec2d => [0, 0],
};
export type PhysicConstants = typeof physicConstants;
export function generateWind(deltaTime: number, maxMagnitude: number): Vec2d {
  const {
    pos: [x, y],
  } = generateRandomPosition(1, -1, 3);
  return [x, y * 0.9];
}
