import p5 from "p5";
import { Point } from "./Point";
import { Edge } from "./Edge";
import { assertNotNull, createStyledButton } from "./utils";
const width = window.innerWidth;
const height = window.innerHeight;

const generateGrid = (): { points: Point[]; edges: Edge[] } => {
  const points: Point[] = [];
  const edges: Edge[] = [];
  const cols = 20;
  const rows = 10;
  const spacing = 20;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const point = new Point(new p5.Vector(x * spacing, y * spacing));

      if (x === 0) {
        point.velocity = new p5.Vector(0, 0);
        point.applyForce = () => {};
      }

      points.push(point);

      if (x > 0) {
        const leftPoint = points[points.length - 2];
        edges.push(new Edge(point, leftPoint));
      }

      if (y > 0) {
        const abovePoint = points[(y - 1) * cols + x];
        edges.push(new Edge(point, abovePoint));
      }
    }
  }

  return { points, edges };
};

const applySpringForce = (a: Point, b: Point): void => {
  const springConstant = 0.5;
  const restLength = 20; //Hab ich jetzt mal so lang wie das Spacing gemacht

  const force = p5.Vector.sub(b.pos, a.pos);
  const stretch = force.mag() - restLength;

  //Hooks Gesetz: F = -k * stretch
  force.normalize();
  force.mult(springConstant * stretch);

  a.applyForce(force);
  force.mult(-1);
  b.applyForce(force);
};

const gravity = new p5.Vector(0, 0.1, 0);
const wind = new p5.Vector(0.1, 0, 0);

type RecorderSetup = {
  recorder: MediaRecorder;
  chunks: Blob[];
};

/**
 * Initializes the media recorder for a canvas element.
 * @param canvas The canvas element to capture.
 * @param frameRate The desired frame rate for the recording.
 * @param onStop Callback function to handle the recorded video.
 * @returns A setup object containing the recorder and an array for data chunks.
 */
function initializeRecorder(
  canvas: HTMLCanvasElement,
  frameRate: number,
  onStop: (chunks: Blob[]) => void
): RecorderSetup {
  const chunks: Blob[] = [];
  const stream = canvas.captureStream(frameRate);
  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (event) => {
    if (event.data.size && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    console.log("stopped");

    return onStop(chunks);
  };

  return { recorder, chunks };
}

/**
 * Exports the recorded video and handles display and download.
 * @param chunks Array of video data chunks.
 */
function exportVideo(chunks: Blob[]): void {
  const blob = new Blob(chunks, { type: "video/webm" });

  // Create a video element to play the recorded video
  const videoElement = document.createElement("video");
  videoElement.id = `video-${Date.now()}`;
  videoElement.controls = true;
  document.body.appendChild(videoElement);
  videoElement.src = window.URL.createObjectURL(blob);

  // Create a link to download the video
  const url = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  downloadLink.style.display = "none";
  downloadLink.href = url;
  downloadLink.download = "newVid.webm";
  downloadLink.click();
  window.URL.revokeObjectURL(url);
}

const sketch = (p: p5) => {
  const b = p.color(255, 255, 255);
  let { edges, points } = generateGrid();
  let canvas: HTMLCanvasElement;

  p.setup = () => {
    p.createCanvas(width, height);
    p.background(b);
    canvas = document.getElementById("defaultCanvas0") as HTMLCanvasElement;
    const grid = generateGrid();
    const { recorder } = initializeRecorder(canvas, 30, exportVideo);
    points = grid.points;
    edges = grid.edges;
    const startRecordingBtn = createStyledButton(p, "START", [200, 10], () => {
      assertNotNull(recorder, "recorder");
      recorder.start();
    });
    const stopRecordingBtn = createStyledButton(p, "STOP", [10, 10], () => {
      assertNotNull(recorder, "recorder");
      recorder.stop();
    });
  };

  p.draw = () => {
    p.background(b);
    p.translate(width / 2, height / 2);

    for (const edge of edges) {
      edge.update(
        (a, b) =>
          applySpringForce(a, b, {
            restLength: edge.restLength,
            springConstant,
          }),
        (point) => {
          point.applyForce(gravity);
          point.applyForce(wind);
        }
      );
    }

    for (const point of points) {
      point.draw(p);
      point.updated = false;
    }
    for (const edge of edges) {
      edge.draw(p);
    }
  };
};

export default sketch;
