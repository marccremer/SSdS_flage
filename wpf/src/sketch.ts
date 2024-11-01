import p5 from 'p5';
import {
  GravityComponent,
  MovementComponent,
  Particle,
  Physics,
  PositionComponent,
  SpringComponent,
  Springs,
} from './physics';
import { pageState } from './shared';
const width = window.innerWidth;
const height = window.innerHeight;

const particels: Particle[] = [];
const flagAnchor1: PositionComponent = { name: 'position', pos: [20, -20] };
const flagAnchor2: PositionComponent = { name: 'position', pos: [-10, -20] };
const N = 15;
const SHIRT_WIDTH = 4;
const SHIRT_HEIGHT = N % SHIRT_WIDTH;
const springConstant = 0.5;
for (let n = 0; n < N; n++) {
  if (n === 0 || n === SHIRT_WIDTH) {
    const poscmp: PositionComponent = {
      name: 'position',
      pos: [Math.random() * 50, Math.random() * 30],
    };
    const p = new Particle(poscmp, Math.random() * 20, {
      name: 'spring',
      restLength: 4,
      springConstant,
      springPartner: [flagAnchor1],
      springAnchor: poscmp,
    });
    particels.push(p);
  } else {
    const partnerIndex = n - 1;
    const prev = particels[partnerIndex].components[0] || {
      name: 'position',
      pos: [20, 10],
    };
    const poscomp: PositionComponent = {
      name: 'position',
      pos: [Math.random() * 50, Math.random() * 30],
    };
    const springPartners = [n === N - 1 ? flagAnchor2 : prev];
    if (n >= SHIRT_WIDTH) {
      const upperIndex = n % SHIRT_WIDTH;
      const upperPartner = particels[upperIndex].components[0] || {
        name: 'position',
        pos: [20, 10],
      };
      springPartners.push(upperPartner);
    }
    const p = new Particle(poscomp, Math.random() * 20, {
      name: 'spring',
      restLength: 5,
      springConstant,
      springPartner: springPartners,
      springAnchor: poscomp,
    });
    particels.push(p);
  }
}
let pause = false;
const physics = new Physics();
const springs = new Springs();
const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
  };

  p.draw = () => {
    if (pageState.paused) return;
    p.background(b);
    p.translate(width / 2, height / 2);
    let c = p.color(240, 204, 0);
    p.fill(c);
    for (const particle of particels) {
      const [x, y] = particle.components[0].pos;
      p.circle(x, y, 20);
      const partners = particle.components[3].springPartner;
      for (const {
        pos: [x2, y2],
      } of partners) {
        p.line(x, y, x2, y2);
      }
    }
    const components = particels.map((e) => e.components);
    const pyhsComponents = components.map((comps) => {
      return comps.filter((el) => el.name !== 'spring') as [
        PositionComponent,
        MovementComponent,
        GravityComponent
      ];
    });
    const springcomponents = components.map((comps) => {
      const sComps = comps.find((el) => el.name === 'spring')!;
      const mComps = comps.find((el) => el.name === 'movement')!;
      return [mComps, sComps] as [MovementComponent, SpringComponent];
    });
    const pdelta = p.deltaTime / 100;
    springs.process(springcomponents, pdelta);
    physics.process(pyhsComponents, pdelta);
  };
};

export default sketch;
