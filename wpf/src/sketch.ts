import p5 from 'p5';
const width = window.innerWidth;
const height = window.innerHeight;
let rotate = 1;
const rotationRate = 0.01;
let slidery: p5.Element;
let sliderx: p5.Element;
const sketch = (p: p5) => {
  const background = p.color(255, 255, 255);
  let font: p5.Font;
  p.preload = () => {
    font = p.loadFont(
      'https://raw.githubusercontent.com/devntd/hoayeu/refs/heads/master/fonts/font-web/VNF-Comic-Sans.otf'
    );
  };
  p.setup = () => {
    p.createCanvas(width, height, p.WEBGL);
    slidery = p.createSlider(1, 40);
    slidery.position(10, 10);
    slidery.size(80);
    sliderx = p.createSlider(1, 40);
    sliderx.position(40, 40);
    sliderx.size(80);
    p.fill(0);
    p.textFont(font);
    p.textSize(50);
    p.text('slidery', 10, 10);
    p.background(background);
  };

  p.draw = () => {
    p.background(background);
    let yr = slidery.value();
    let xr = sliderx.value();
    p.rotateY(p.PI * (4 / Number(yr)));
    p.rotateX(p.PI * (4 / Number(xr)));
    const a = [0, 100, 0];
    const b = [0, 100, 100];
    const c = [100, 100, 0];
    const b1 = [0, 100, 0];
    p.beginShape(p.TRIANGLES);
    p.vertex(0, 100, 0);
    p.fill(0, 0, 50);
    p.vertex(0, 100, 100);
    p.fill(0, 0, 100);
    p.vertex(100, 100, 0);
    p.vertex(0, 0, 0);
    p.fill(0, 20, 100);
    p.vertex(0, 100, 100);
    p.vertex(0, 0, 0);
    p.endShape(p.CLOSE);
  };
};

export default sketch;
