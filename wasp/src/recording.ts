/**
 * Initializes the media recorder for a canvas element.
 * @param canvas The canvas element to capture.
 * @param frameRate The desired frame rate for the recording.
 * @param onStop Callback function to handle the recorded video.
 * @returns A setup object containing the recorder and an array for data chunks.
 */
export function initializeRecorder(
  canvas: HTMLCanvasElement,
  frameRate: number,
  onStop: (chunks: Blob[]) => void
) {
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
export function exportVideo(chunks: Blob[]): void {
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
