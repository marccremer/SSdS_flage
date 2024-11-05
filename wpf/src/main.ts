import p5 from "p5";
import sketch from "./sketch.ts";
import { pageState } from "./shared.ts";

const canvas = document.getElementById("sketch") as HTMLDivElement;
const btn = document.getElementById("pause");
const startBtn = document.getElementById("start");
const playback = document.getElementById("playback") as HTMLVideoElement;
const stopBtn = document.getElementById("stop");

let mediaRecorder: MediaRecorder;
let recordedChunks: any[] = [];
if (btn) {
  btn.addEventListener("click", () => {
    pageState.paused = !pageState.paused;
  });
}
startBtn?.addEventListener("click", () => {
  const canv = document.getElementById("defaultCanvas0") as HTMLCanvasElement;

  const stream = canv.captureStream(30); // 30 fps
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  // Store video data when available
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  // Stop event: create video from chunks and show it
  mediaRecorder.onstop = () => {
    console.log("recording stoped");
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "canvas-recording.webm";
    downloadLink.click();
    recordedChunks = []; // Clear recorded chunks
  };
  console.log("recording started");
  mediaRecorder.start();
});
stopBtn?.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
});
new p5(sketch, canvas!);
