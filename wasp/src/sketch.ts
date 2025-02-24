import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
import { applySpringForce } from "./spring";
import { exportVideo, initializeRecorder } from "./recording";
import { generateGrid } from "./setup";
import { applyImageTextureToShape } from "./proto";
import { handleSphereCollision } from "./collision.ts";
import { Box } from "./Box.ts";
const width = window.innerWidth;
const height = window.innerHeight;

const GRID_ROWS = 10;
const GRID_COLS = 20;
const springConstant = 0.37;
const gravity = new p5.Vector(0, 0.05, 0);
const wind = new p5.Vector(0, 0, 0);
declare const QuickSettings: QuickSettings;
var easycam;

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid(GRID_COLS, GRID_ROWS);
  let canvas: HTMLCanvasElement;
  const flags = {
    germany: p.loadImage("germany.png"),
    greece: p.loadImage("greece.png"),
    morocco: p.loadImage("morocco.png"),
  };
  let currentFlag = flags.germany;
  let panel: QuickSettings;
  let showGrid = false;
  let paused = false;
  const floor = new Box(new p5.Vector(0, 600, 0), 3000, 10, 5000);
  const sphereCenter = p.createVector(300, 350, -100);
  const sphereRadius = 200;
  let shoudlGuiUpdate = 0;
  const GUI_fps = 60;
  p.setup = () => {
    p.createCanvas(width, height, p.WEBGL);
    p.background(b);
    //  p.debugMode();

    canvas = document.getElementById("defaultCanvas0") as HTMLCanvasElement;

    var controller = {
      onFlag: function (data: { value: any }) {
        currentFlag = flags[data.value as keyof typeof flags];
      },
      onWind: function (value: any) {
        if (shoudlGuiUpdate < GUI_fps) return;
        console.log("value", value);

        shoudlGuiUpdate = 0;
      },
      onGravity: function () {},

      onColor: function (value: string) {
        document.body.style.backgroundColor = value;
      },
      onGrid: (value: any) => {
        showGrid = !!value;
      },

      onRecordStart: function () {
        assertNotNull(recorder, "recorder");
        recorder.start();
      },
      onRecordStop: function () {
        assertNotNull(recorder, "recorder");
        recorder.stop();
      },
      onPause: (value: any) => {
        paused = !!value;
      },
    };

    {
      panel = QuickSettings.create(20, 20, "test")
        .setDraggable(true)
        .addDropDown("flag", Object.keys(flags), controller.onFlag)
        .addButton("start recording", controller.onRecordStart)
        .addBoolean("Paused", false, controller.onPause)
        .addButton("stop recording", controller.onRecordStop)
        //title, min, max, value, step, callback
        .addRange("Gravity", 0.05, 0.3, 0.05, 0.05, controller.onGravity)
        .addRange("Wind", 0, 0.5, 0.03, 0.01, controller.onWind)
        .addBoolean("showGrid", false, controller.onGrid);
    }

    const { recorder } = initializeRecorder(canvas, 30, exportVideo);
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
  p.draw = () => {
    p.background(b);
    p.orbitControl();
    shoudlGuiUpdate += 1;
    const gravityValue = panel.getValuesAsJSON()["Gravity"];
    const windValue = panel.getValuesAsJSON()["Wind"];

    gravity.set(0, gravityValue, 0);
    wind.set(
      windValue,
      windValue > 0 ? p.random(-0.1, 0.1) : 0,
      windValue > 0 ? p.random(-0.5, 0.5) : 0
    );

    {
      // UPDATE
      if (!paused) {
        for (const edge of edges) {
          edge.update(
            (a, b) =>
              applySpringForce(a, b, {
                restLength: edge.restLength,
                springConstant,
              }),
            (point) => {
              point.inside = false;
              point.applyForce(gravity);
              point.applyForce(wind.mult(1));
              handleSphereCollision(point, sphereCenter, sphereRadius, p);
              point.collideWithBox(floor);
            }
          );
        }

        for (const point of points) {
          point.updated = false;
        }
      }
    }

    if (!showGrid) {
      for (const edge of edges) {
        edge.draw(p);
      }
    } else {
      applyImageTextureToShape(points, p, currentFlag, GRID_ROWS, GRID_COLS);
    }
    p.push();
    p.stroke(0, 200, 0);
    p.translate(sphereCenter.x, sphereCenter.y, sphereCenter.z);
    p.sphere(sphereRadius);
    p.pop();
    floor.draw(p);
  };
};

export default sketch;
