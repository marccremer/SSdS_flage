import p5 from "p5";
import {
  generateRandomPosition,
  GravityComponent,
  MovementComponent,
  Particle,
  Physics,
  PositionComponent,
  SpringComponent,
  Springs,
  Vec2d,
} from "./physics";
import { pageState, physicConstants } from "./shared";
const width = window.innerWidth;
const height = window.innerHeight;

const particles: Particle[] = [];

const N = 300;
const SHIRT_WIDTH = 20;
const SHIRT_HEIGHT = Math.ceil(N / SHIRT_WIDTH);
const springConstant = physicConstants.springElasticity;
physicConstants.springElasticity = 0.99;
physicConstants.gravity = 0.98;
physicConstants.friction = 0.9;
const spacing = 50;
const defaultSpringLength = 20;
const anchorIndex = [0, SHIRT_WIDTH - 1, Math.ceil(SHIRT_WIDTH / 2)];
for (let row = 0; row < SHIRT_HEIGHT; row++) {
  for (let col = 0; col < SHIRT_WIDTH; col++) {
    const particlePositionCmp: PositionComponent = generateRandomPosition(
      -100,
      0
    );
    const springPartners: PositionComponent[] = [];

    if (row == 0 && anchorIndex.includes(col)) {
      springPartners.push({
        name: "position",
        pos: [-300 + spacing * col - 200, -100],
      });
    }
    if (row > 0) {
      const aboveIndex = (row - 1) * SHIRT_WIDTH + col;
      const aboveParticle = particles[aboveIndex];
      const abovePosition = aboveParticle.components[0] as PositionComponent;
      springPartners.push(abovePosition);
      const springCmp = aboveParticle.getComponent("spring");
      springCmp.springPartner.push(particlePositionCmp);
    }
    if (col > 0) {
      const leftIndex = row * SHIRT_WIDTH + (col - 1);
      const leftParticle = particles[leftIndex];
      const leftPosition = leftParticle.components[0] as PositionComponent;
      springPartners.push(leftPosition);
      const springCmp = leftParticle.getComponent("spring");
      springCmp.springPartner.push(particlePositionCmp);
    }

    const p = new Particle(particlePositionCmp, Math.random() * 20, {
      name: "spring",
      restLength: defaultSpringLength,
      springConstant,
      springPartner: springPartners,
      springAnchor: particlePositionCmp,
      extensions: [],
    });
    particles.push(p);
  }
}
let dragging = false;
let currentlyDragging: Particle;
const physics = new Physics(physicConstants);
const springs = new Springs(physicConstants);
const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
  };
  p.mousePressed = () => {
    dragging = true;

    const mouse: Vec2d = [p.mouseX - p.width / 2, p.mouseY - p.height / 2]; // Adjust mouse position for translation

    let closestDistance = Infinity; // Start with an infinitely large distance
    let closestParticle = null;

    // Find the closest particle
    for (const particle of particles) {
      const [x, y] = particle.components[0].pos;
      const distance = p.dist(mouse[0], mouse[1], x, y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestParticle = particle;
      }
    }
    currentlyDragging = closestParticle || particles[0];
  };
  p.mouseReleased = () => (dragging = false);
  p.draw = () => {
    if (pageState.paused) return;
    p.background(b);
    p.translate(width / 2, height / 2);
    let c = p.color(240, 204, 0);
    let c2 = p.color(200, 200, 0);
    const mouse: Vec2d = [p.mouseX - p.width / 2, p.mouseY - p.height / 2]; // Adjust mouse position for translation
    let odd = true;
    p.fill(c);
    if (dragging && currentlyDragging) {
      currentlyDragging.components[0].pos = mouse;
    }
    p.circle(mouse[0], mouse[1], 20);
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
      return comps.filter((el) => el.name !== "spring") as [
        PositionComponent,
        MovementComponent,
        GravityComponent
      ];
    });
    const springcomponents = components.map((comps) => {
      const sComps = comps.find((el) => el.name === "spring")!;
      const mComps = comps.find((el) => el.name === "movement")!;
      return [mComps, sComps] as [MovementComponent, SpringComponent];
    });
    const pdelta = p.deltaTime / 100;
    if (p.deltaTime > 5) {
      physics.process(pyhsComponents, pdelta);
      springs.process(springcomponents, pdelta);
    }
  };
};

export default sketch;
