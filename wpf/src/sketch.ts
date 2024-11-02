import p5 from 'p5';
import {
  generateRandomPosition,
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

const particles: Particle[] = [];
const flagAnchor1: PositionComponent = { name: 'position', pos: [200, -100] };
const flagAnchor2: PositionComponent = { name: 'position', pos: [-100, -100] };
const N = 50;
const SHIRT_WIDTH = 10;
const SHIRT_HEIGHT = Math.ceil(N / SHIRT_WIDTH);
const springConstant = 1.2;

for (let row = 0; row < SHIRT_HEIGHT; row++) {
  for (let col = 0; col < SHIRT_WIDTH; col++) {
    const particlePositionCmp: PositionComponent = generateRandomPosition();
    const springPartners: PositionComponent[] = [];

    if (row == 0 && col === SHIRT_WIDTH - 1) {
      springPartners.push(flagAnchor1);
    }
    if (row > 0) {
      const aboveIndex = (row - 1) * SHIRT_WIDTH + col;
      const aboveParticle = particles[aboveIndex];
      const abovePosition = aboveParticle.components[0] as PositionComponent;
      springPartners.push(abovePosition);
      const springCmp = aboveParticle.getComponent('spring');
      springCmp.springPartner.push(particlePositionCmp);
    }
    if (col > 0) {
      const leftIndex = row * SHIRT_WIDTH + (col - 1);
      const leftParticle = particles[leftIndex];
      const leftPosition = leftParticle.components[0] as PositionComponent;
      springPartners.push(leftPosition);
      const springCmp = leftParticle.getComponent('spring');
      springCmp.springPartner.push(particlePositionCmp);
    }

    if (row === 0 && col === 0) {
      springPartners.push(flagAnchor2);
    }

    const p = new Particle(particlePositionCmp, Math.random() * 20, {
      name: 'spring',
      restLength: 5,
      springConstant,
      springPartner: springPartners,
      springAnchor: particlePositionCmp,
      extensions: [],
    });
    particles.push(p);
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
    let c2 = p.color(200, 200, 0);
    let odd = true;
    p.fill(c);
    for (const particle of particles) {
      const [x, y] = particle.components[0].pos;
      p.circle(x, y, 20);
      const springCmp = particle.components[3];
      const partners = springCmp.springPartner;

      for (let index = 0; index < partners.length; index++) {
        const partner = partners[index];
        const [x2, y2] = partner.pos;
        odd = !odd;
        if (odd) {
          p.fill(c);
        } else {
          p.fill(c2);
        }
        p.line(x, y, x2, y2);
        const text = springCmp.extensions[index];
        // p.text('extension ' + Math.ceil(text), x, y);
      }
    }
    const components = particles.map((e) => e.components);
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
    if (p.deltaTime > 10) {
      physics.process(pyhsComponents, pdelta);
      springs.process(springcomponents, pdelta);
    }
  };
};

export default sketch;
