interface Component<N extends string> {
  name: N;
}

interface PositionComponent extends Component<"position"> {
  pos: Vec2d;
}
interface MovementComponent extends Component<"movement"> {
  velocity: Vec2d;
  accelaration: Vec2d;
}
interface GravityComponent extends Component<"gravity"> {
  gravityConstant: 1.1;
  mass: number;
}

// Hooks law Fspring = -K * extensions
interface SpringComponent extends Component<"spring"> {
  springPartner: Vec2d;
  springConstant: number;
  restLength: number;
}
export class Particle {
  components: [PositionComponent, MovementComponent, GravityComponent];
  constructor(position: Vec2d, mass: number) {
    this.components = [
      { name: "position", pos: position },
      { name: "movement", accelaration: [0, 0], velocity: [0, 0] },
      { gravityConstant: 1.1, mass, name: "gravity" },
    ];
  }
}
interface Beaviour2<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB][]): void;
}
interface Beaviour3<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB, ComponentC][]): void;
}
interface Beaviour4<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>,
  ComponentD extends Component<any>
> {
  process(cmps: [ComponentA, ComponentB, ComponentC, ComponentD][]): void;
}
interface Beaviour5<
  ComponentA extends Component<any>,
  ComponentB extends Component<any>,
  ComponentC extends Component<any>,
  ComponentD extends Component<any>,
  ComponentE extends Component<any>
> {
  process(
    cmps: [ComponentA, ComponentB, ComponentC, ComponentD, ComponentE][]
  ): void;
}

type Vec2d = [x: number, y: number];

interface PhysicsObject {
  position: Vec2d;
}
const gpu = new GPU.GPU();

export function addVec2d(a: Vec2d, b: Vec2d): Vec2d {
  const addVec2dKernel = gpu
    .createKernel<[Vec2d, Vec2d], {}>(function (a, b) {
      return a[this.thread.x] + b[this.thread.x];
    })
    .setOutput([2]);

  return addVec2dKernel(a, b) as Vec2d;
}

export function normalizeVec2d(vec: Vec2d) {
  const normalizeKernel = gpu.createKernelMap<[Vec2d], { magnitude: number }>(
    {
      magnitude: function (v: Vec2d) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      },
    },
    function (vec) {
      const mag = this.constants.magnitude || 1;
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
}

export class Physics
  implements
    Beaviour4<
      PositionComponent,
      MovementComponent,
      GravityComponent,
      SpringComponent
    >
{
  gpu: GPU.GPU;
  constructor() {
    this.gpu = new GPU.GPU();
  }
  process(
    cmps: [
      PositionComponent,
      MovementComponent,
      GravityComponent,
      SpringComponent
    ][]
  ): void {
    for (const entity of cmps) {
      const [position, movement, gravity, spring] = entity;
      /**
       * TODO: Caclulate Spring force and force vector [f=-K*x * -(p-anchor)]
       * distance is x= magnitude
       */
      const springForce = 1;
      position.pos = addVec2d(position.pos, movement.velocity);
      movement.velocity = addVec2d(movement.velocity, movement.accelaration);
      const force = gravity.gravityConstant / gravity.mass;
      movement.accelaration = addVec2d([0, force], movement.accelaration);
    }
  }
}
