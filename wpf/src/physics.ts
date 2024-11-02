import p5 from 'p5';

interface Component<N extends string> {
  name: N;
}

export interface PositionComponent extends Component<'position'> {
  pos: Vec2d;
}
export interface MovementComponent extends Component<'movement'> {
  velocity: Vec2d;
  accelaration: Vec2d;
}
export interface GravityComponent extends Component<'gravity'> {
  gravityConstant: number;
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
      { name: 'movement', accelaration: [0, 0], velocity: [0, 0] },
      { gravityConstant: 9.8, mass, name: 'gravity' },
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
  process(cmps: [ComponentA][], deltaTime: number): void;
}
interface Beaviour2<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB][], deltaTime: number): void;
}
interface Beaviour3<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>
> {
  process(
    cmps: [ComponentA, ComponentB, ComponentC][],
    deltaTime: number
  ): void;
}
interface Beaviour4<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>,
  ComponentD extends Component<any>
> {
  process(
    cmps: [ComponentA, ComponentB, ComponentC, ComponentD][],
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
    cmps: [ComponentA, ComponentB, ComponentC, ComponentD, ComponentE][],
    deltaTime: number
  ): void;
}

type Vec2d = [x: number, y: number];

interface PhysicsObject {
  position: Vec2d;
}
const gpu = new GPU.GPU();

export function addVec2d(a: Vec2d, b: Vec2d): Vec2d {
  return [a[0] + b[0], a[1] + b[1]];
}
export function subVec2d(a: Vec2d, b: Vec2d): Vec2d {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scaleVec2d(vec: Vec2d, scale: number): Vec2d {
  return [vec[0] * scale, vec[1] * scale];
}

/* export function normalizeVec2d(vec: Vec2d) {
  const normalizeKernel = gpu.createKernelMap<[Vec2d], { magnitude: number }>(
    {
      magnitude: function (v: Vec2d) {
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
    result: Vec2d;
    magnitude: number;
  };

  return {
    result,
    magnitude,
  };
} */

function normalizeVec2d(vec: Vec2d): { magnitude: number; result: Vec2d } {
  const [x, y] = vec;
  const magnitude = Math.sqrt(x * x + y * y);

  // Check to avoid division by zero
  if (magnitude === 0) {
    return { magnitude: 0, result: [0, 0] };
  }

  const result: Vec2d = [x / magnitude, y / magnitude];
  return { magnitude, result };
}
const friction = 0.992;

export class Physics
  implements Beaviour3<PositionComponent, MovementComponent, GravityComponent>
{
  gpu: GPU.GPU;
  constructor() {
    this.gpu = new GPU.GPU();
  }
  process(
    cmps: [PositionComponent, MovementComponent, GravityComponent][],
    deltaTime: number
  ): void {
    for (const entity of cmps) {
      const [position, movement, gravity] = entity;
      position.pos = addVec2d(position.pos, movement.velocity);

      performance.mark('start-pgrav');
      movement.velocity = addVec2d(movement.velocity, movement.accelaration);
      const gravityForce = gravity.gravityConstant;
      movement.velocity = addVec2d(
        [0, gravityForce * deltaTime],
        movement.velocity
      );
      performance.mark('end-pgrav');
      performance.measure('pgrav', 'start-pgrav', 'end-pgrav');
      movement.velocity = scaleVec2d(movement.velocity, friction);
    }
    const pgrav = performance
      .getEntriesByName('pgrav')
      .reduce((prev, cur) => prev + cur.duration, 0);
    const pspring = performance
      .getEntriesByName('pspring')
      .reduce((prev, cur) => prev + cur.duration, 0);
  }
}

export class Springs implements Beaviour2<MovementComponent, SpringComponent> {
  gpu: GPU.GPU;
  constructor() {
    this.gpu = new GPU.GPU();
  }
  process(
    cmps: [MovementComponent, SpringComponent][],
    deltaTime: number
  ): void {
    for (const entity of cmps) {
      const [movement, spring] = entity;
      const partners = spring.springPartner;
      const totalSpringForce: Vec2d[] = [];
      for (let index = 0; index < partners.length; index++) {
        const { pos } = partners[index];

        let force = subVec2d(spring.springAnchor.pos, pos);
        let { magnitude: extensionLength, result: extensionDirection } =
          normalizeVec2d(force);

        // Calculate the extension amount (distance from rest length)
        let x =
          spring.restLength < extensionLength
            ? extensionLength - spring.restLength
            : 0;

        // Calculate the spring force based on Hooke's Law: F = -k * x
        const springForce = scaleVec2d(
          extensionDirection,
          -1 * spring.springConstant * x * deltaTime
        );

        spring.extensions[index] = extensionLength;
        totalSpringForce.push(springForce);
      }
      let appliedForce: Vec2d = [0, 0];
      for (const F of totalSpringForce) {
        appliedForce = addVec2d(appliedForce, F);
      }
      movement.velocity = addVec2d(appliedForce, movement.velocity);
      movement.velocity = scaleVec2d(movement.velocity, friction - 0.1);
    }
  }
}

export function generateRandomPosition(): PositionComponent {
  return {
    name: 'position',
    pos: [Math.random() * 50, Math.random() * 30],
  };
}
