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
  Wind,
} from "./physics";
import { generateWind, pageState, physicConstants } from "./shared";
const width = window.innerWidth - 20;
const height = window.innerHeight - 20;

const particles: Particle[] = [];

const N = 300;
const SHIRT_WIDTH = 20;
const SHIRT_HEIGHT = Math.ceil(N / SHIRT_WIDTH);
const springConstant = physicConstants.springElasticity;
let maxMagnitude = 100;
physicConstants.springElasticity = 11.2;
physicConstants.gravity = 10;
physicConstants.friction = 0.9;
let tempWind: Vec2d = [0, 0];

physicConstants.currentWindForce = () => tempWind;
const spacing = 50;
let accumulator = 0;
const FIXED_DELTA_TIME = 0.086; // Higher physics frequency, effectively doubling update speed

const defaultSpringLength = 5;
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
        pos: [-700, -300 + spacing * col - 200],
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
const wind = new Wind(physicConstants);
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
        /*         const text = springCmp.extensions[index];
        p.fill(0);
        p.text("extension " + Math.ceil(text), x, y); */
      }
    }
    /*     const components = particles.map((e) => e.components);
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
    }); */
    console.log("deltaTime", p.deltaTime);
    accumulator += p.deltaTime;
    tempWind = generateWind(FIXED_DELTA_TIME, 100);
    if (accumulator >= FIXED_DELTA_TIME) {
      for (const particle of particles) {
        const [position, movement, gravity, spring] = particle.components;
        springs.process([movement, spring], FIXED_DELTA_TIME);
        physics.process([position, movement, gravity], FIXED_DELTA_TIME);
        wind.process([position, movement, gravity], FIXED_DELTA_TIME);
        accumulator -= FIXED_DELTA_TIME;
      }
    }
    let fps = p.frameRate();

    // Set the text properties
    p.fill(0); // Set text color to black
    p.textSize(16); // Set text size
    p.text("FPS: " + fps.toFixed(2), 10, 20); // Show FPS with 2 decimal places
  };
};

export default sketch;
