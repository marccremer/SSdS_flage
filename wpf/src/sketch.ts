import p5 from "p5";
import { Particle, Physics } from "./physics";
const width = window.innerWidth;
const height = window.innerHeight;
let rotate = 1;
const rotationRate = 0.01;

const particels = [1, 1, 1, 1].map(() => {
  return new Particle(
    [Math.random() * 50, Math.random() * 30],
    Math.random() * 20
  );
});

const physics = new Physics();
const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
  };

  p.draw = () => {
    p.background(b);
    p.translate(width / 2, height / 2);
    let c = p.color(240, 204, 0);
    p.fill(c);
    for (const particle of particels) {
      const [x, y] = particle.components[0].pos;
      p.square(x, y, 20);
    }
    const components = particels.map((e) => e.components);
    physics.process(components);
  };
};

export default sketch;
