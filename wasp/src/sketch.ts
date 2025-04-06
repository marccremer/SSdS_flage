import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
import { applySpringForce } from "./spring";
import { exportVideo, initializeRecorder } from "./recording";
import { generateGrid, generateGridXZ } from "./setup";
import { applyImageTextureToShape, drawClothIn3D } from "./proto";
import {
  Collider,
  handleCollisions,
  BoxCollider,
  SphereCollider,
  ConeCollider,
} from "./collision.ts";
import { Box } from "./Box.ts";
import { scenes } from "./scenes.ts";
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
  let { edges, points } = generateGridXZ(GRID_COLS, GRID_ROWS, 10);
  let canvas: HTMLCanvasElement;
  const flags = {
    germany: p.loadImage("germany.png"),
    greece: p.loadImage("greece.png"),
    morocco: p.loadImage("morocco.png"),
  };
  let currentFlag = flags.germany;
  let selectedSceneName = localStorage.getItem("selectedScene") || "sceneA";
  if (!(selectedSceneName in scenes)) selectedSceneName = "sceneA";
  let currentScene: Collider[] =
    scenes[selectedSceneName as keyof typeof scenes];
  let panel: QuickSettings;
  let showGrid = false;
  let edgeCollision = true;
  let paused = false;

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
      onScene: function (data: { value: any }) {
        selectedSceneName = data.value;
        localStorage.setItem("selectedScene", data.value);
        currentScene = scenes[selectedSceneName as keyof typeof scenes];

        const newGrid = generateGridXZ(GRID_COLS, GRID_ROWS, false);
        points = newGrid.points;
        edges = newGrid.edges;
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
      onEdgeCollision: (value: any) => {
        edgeCollision = !!value;
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
        .addDropDown("Scene", Object.keys(scenes), controller.onScene)
        .addButton("start recording", controller.onRecordStart)
        .addBoolean("Paused", false, controller.onPause)
        .addButton("stop recording", controller.onRecordStop)
        //title, min, max, value, step, callback
        .addRange("Gravity", 0.05, 0.3, 0.05, 0.05, controller.onGravity)
        .addRange("Wind", 0, 0.5, 0.0, 0.005, controller.onWind)
        .addBoolean("showGrid", false, controller.onGrid)
        .addBoolean("EdgeCollision", true, controller.onEdgeCollision);
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
      windValue > 0 ? p.random(0, 0) : 0,
      windValue > 0 ? p.random(0, 0) : 0
    );

    {
      // UPDATE
      if (!paused) {
        const subSteps = 5;
        for (let step = 0; step < subSteps; step++) {
          for (const edge of edges) {
            applySpringForce(edge.PointA, edge.PointB, {
              restLength: edge.restLength,
              springConstant: springConstant / subSteps,
            });
          }

          for (const point of points) {
            point.inside = false;

            if (!point.locked) {
              point.applyForce(gravity.copy().div(subSteps));
              point.applyForce(wind.copy().div(subSteps));

              point.update();

              handleCollisions(point, currentScene);
            }
          }
          if (edgeCollision) {
            for (const edge of edges) {
              for (const collider of currentScene) {
                if (collider instanceof BoxCollider) {
                  collider.resolveEdgeCollision(edge.PointA, edge.PointB);
                }
              }
            }
          }
        }
      }
    }

    if (!showGrid) {
      for (const edge of edges) {
        edge.draw(p);
      }
    } else {
      drawClothIn3D(p, points, GRID_COLS, GRID_ROWS);
    }
    for (const collider of currentScene) {
      collider.draw(p);
    }
  };
};

export default sketch;
