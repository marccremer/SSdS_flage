import p5 from 'p5';
import sketch from './sketch.ts';
import { pageState } from './shared.ts';

const canvas = document.getElementById('sketch');
const btn = document.getElementById('pause');
if (btn) {
  btn.addEventListener('click', () => {
    pageState.paused = !pageState.paused;
  });
}

new p5(sketch, canvas!);
