import p5 from 'p5';
import { PhysicConstants, physicConstants } from './shared';

interface Component<N extends string> {
  name: N;
}

export interface PositionComponent extends Component<'position'> {
  pos: Vec3d;
}
export interface MovementComponent extends Component<'movement'> {
  velocity: Vec3d;
  accelaration: Vec3d;
}
export interface GravityComponent extends Component<'gravity'> {
  mass: number;
}

// Hooks law Fspring = -K * extensions
export interface SpringComponent extends Component<'spring'> {
  springPartner: PositionComponent[];
  extensions: number[];
  springAnchor: PositionComponent;
  springConstant: number;
  restLength: number;
}
type ParticleComponents = [
  PositionComponent,
  MovementComponent,
  GravityComponent,
  SpringComponent
];
type ParticleComponent = ParticleComponents[number];

type ParticleComponentsNames = ParticleComponent['name'];

export class Particle {
  components: ParticleComponents;
  constructor(
    position: PositionComponent,
    mass: number,
    Spring: SpringComponent
  ) {
    this.components = [
      position,
      { name: 'movement', accelaration: [0, 0, 0], velocity: [0, 0, 0] },
      { mass, name: 'gravity' },
      Spring,
    ];
  }
  getComponent<N extends ParticleComponentsNames>(
    name: N
  ): N extends 'position'
    ? PositionComponent
    : N extends 'movement'
    ? MovementComponent
    : N extends 'gravity'
    ? GravityComponent
    : N extends 'spring'
    ? SpringComponent
    : never {
    switch (name) {
      case 'position':
        // Hack to get return type working
        return this.components[0] as any;
      case 'movement':
        return this.components[1] as any;
      case 'gravity':
        return this.components[2] as any;
      case 'spring':
        return this.components[3] as any;
      default:
        throw new Error(`Invalid name ${name}`);
    }
  }
}

interface Beaviour<ComponentA extends Component<any>> {
  process(cmps: [ComponentA], deltaTime: number): void;
}
interface Beaviour2<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB], deltaTime: number): void;
}
interface Beaviour3<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB, ComponentC], deltaTime: number): void;
}
interface Beaviour4<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>,
  ComponentD extends Component<any>
> {
  process(
    cmps: [ComponentA, ComponentB, ComponentC, ComponentD],
    deltaTime: number
  ): void;
}
interface Beaviour5<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>,
  ComponentD extends Component<any>,
  ComponentE extends Component<any>
> {
  process(
    cmps: [ComponentA, ComponentB, ComponentC, ComponentD, ComponentE],
    deltaTime: number
  ): void;
}

export type Vec2d = [x: number, y: number];
export type Vec3d = [x: number, y: number, z: number];

interface PhysicsObject {
  position: Vec3d;
}
const gpu = new GPU.GPU();

export function addVec3d(a: Vec3d, b: Vec3d): Vec3d {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
export function subVec3d(a: Vec3d, b: Vec3d): Vec3d {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scaleVec3d(vec: Vec3d, scale: number): Vec3d {
  return [vec[0] * scale, vec[1] * scale, vec[2] * scale];
}

/* export function normalizeVec2d(vec: Vec3d) {
  const normalizeKernel = gpu.createKernelMap<[Vec3d], { magnitude: number }>(
    {
      magnitude: function (v: Vec3d) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      },
    },
    function (vec) {
      let mag = this.constants.magnitude;
      if (mag) mag = 1;
      if (mag === 0) return 0; // Avoid division by zero for zero vector
      return vec[this.thread.x] / mag;
    },
    { output: [2], constants: { magnitude: 0 } }
  );

  // Run the kernel to compute both magnitude and normalized vector
  const { result, magnitude } = normalizeKernel(vec) as {
    result: Vec3d;
    magnitude: number;
  };

  return {
    result,
    magnitude,
  };
} */

function normalizeVec3d(vec: Vec3d): { magnitude: number; result: Vec3d } {
  const [x, y, z] = vec;
  const magnitude = Math.sqrt(x * x + y * y + z * z);

  // Check to avoid division by zero
  if (magnitude === 0) {
    return { magnitude: 0, result: [0, 0, 0] };
  }

  const result: Vec3d = [x / magnitude, y / magnitude, z / magnitude];
  return { magnitude, result };
}

export class Physics
  implements Beaviour3<PositionComponent, MovementComponent, GravityComponent>
{
  gpu: GPU.GPU;
  constants: { gravity: number };
  constructor(constants: PhysicConstants) {
    this.gpu = new GPU.GPU();
    this.constants = constants;
  }
  process(
    cmps: [PositionComponent, MovementComponent, GravityComponent],
    deltaTime: number
  ): void {
    const [position, movement] = cmps;
    console.assert(
      !isNaN(movement.velocity[0]),
      'velocity should not be NaN' + JSON.stringify(movement)
    );
    position.pos = addVec3d(
      position.pos,
      scaleVec3d(movement.velocity, deltaTime)
    );

    const gravityForce = this.constants.gravity;
    movement.velocity[1] += gravityForce * deltaTime;

    movement.velocity = scaleVec3d(movement.velocity, physicConstants.friction);
  }
}

export class Springs implements Beaviour2<MovementComponent, SpringComponent> {
  gpu: GPU.GPU;
  constants: PhysicConstants;
  constructor(constants: PhysicConstants) {
    this.gpu = new GPU.GPU();
    this.constants = constants;
  }
  process(cmps: [MovementComponent, SpringComponent], deltaTime: number): void {
    const [movement, spring] = cmps;
    const springPartners = spring.springPartner;
    let totalSpringForce: Vec3d = [0, 0, 0];
    for (let index = 0; index < springPartners.length; index++) {
      const { pos } = springPartners[index];

      let partnerDistance = subVec3d(spring.springAnchor.pos, pos);
      let { magnitude: extensionLength, result: extensionDirection } =
        normalizeVec3d(partnerDistance);
      //if (extensionLength <= spring.restLength) continue;
      // Calculate the extension amount (distance from rest length)
      let x = extensionLength - spring.restLength;
      //if (x < 0) x = 0;
      // Calculate the spring force based on Hooke's Law: F = -k * x
      const springForce = scaleVec3d(
        extensionDirection,
        -1 * this.constants.springElasticity * x * deltaTime
      );

      spring.extensions[index] = extensionLength;
      totalSpringForce = addVec3d(totalSpringForce, springForce);
    }

    movement.velocity = addVec3d(totalSpringForce, movement.velocity);
    movement.velocity = scaleVec3d(movement.velocity, physicConstants.friction);
  }
}
export class Wind
  implements Beaviour3<PositionComponent, MovementComponent, GravityComponent>
{
  gpu: GPU.GPU;
  constants: { currentWindForce: (delta: number) => Vec3d };
  constructor(constants: PhysicConstants) {
    this.gpu = new GPU.GPU();
    this.constants = constants;
  }
  process(
    cmps: [PositionComponent, MovementComponent, GravityComponent],
    deltaTime: number
  ): void {
    const [position, movement] = cmps;
    console.assert(
      !isNaN(movement.velocity[1]),
      'velocity should not be NaN' + JSON.stringify(movement)
    );
    position.pos = addVec3d(
      position.pos,
      scaleVec3d(movement.velocity, deltaTime)
    );

    const windForce = this.constants.currentWindForce(deltaTime);
    movement.velocity = addVec3d(movement.velocity, windForce);

    movement.velocity = scaleVec3d(
      movement.velocity,
      physicConstants.friction * 0.99
    );
  }
}

export function generateRandomPosition(
  x: number,
  y: number,
  z: number,
  variance = 1
): PositionComponent {
  return {
    name: 'position',
    pos: [
      Math.random() * variance * x,
      Math.random() * variance * y,
      Math.random() * variance * z,
    ],
  };
}
