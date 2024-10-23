import p5 from 'p5';
const width = window.innerWidth;
const height = window.innerHeight;
let rotate = 1;
const rotationRate = 0.01;
const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
  };

  p.draw = () => {
    p.background(b);
    p.translate(width / 2, height / 2);
    let size = 600;
    const n = 24;
    const step = size / n;
    p.rotate(p.QUARTER_PI * rotate);
    const move = -(size / 2);

    for (let i = 0; i <= n; i++) {
      let c = p.color(240, 204, 0);
      p.fill(c);
      p.square(move, move, size, 0, 0, 0, 0);
      p.rotate(p.QUARTER_PI * rotate);
      size -= step;
    }
    rotate += rotationRate * 0.2;
  };
};

export default sketch;
