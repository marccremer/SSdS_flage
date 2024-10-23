import p5 from "p5";
import sketch from "./sketch.ts";

const canvas = document.getElementById("sketch");

new p5(sketch, canvas!);
