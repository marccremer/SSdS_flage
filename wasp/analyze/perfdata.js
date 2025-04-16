const fs = require("fs");
const path = require("path");

// Constants
const INPUT_DIR = "./data";
const OUTPUT_DIR = "./out";
const MIN_DELTA_MS = 5; // Ignore intervals < 5ms (unrealistic)

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Process a single JSON trace file
function processFile(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  const outputPath = path.join(
    OUTPUT_DIR,
    filename.replace(/\.json$/i, ".csv")
  );

  console.log(`Processing ${filename}...`);

  const trace = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  const rawTimestamps = trace.traceEvents.filter(
    (e) =>
      e.name === "DrawFrame" &&
      e.cat === "disabled-by-default-devtools.timeline.frame" &&
      typeof e.ts === "number"
  );

  if (rawTimestamps.length < 2) {
    console.log(`→ Not enough frames to calculate FPS.`);
    return;
  }

  // Normalize timestamps
  const t0 = rawTimestamps[0];
  const normalizedTimestamps = rawTimestamps.map((t) => t.ts - t0.ts);

  const fpsOverTime = [];

  for (let i = 1; i < normalizedTimestamps.length; i++) {
    const delta = normalizedTimestamps[i] - normalizedTimestamps[i - 1];
    // if (delta < MIN_DELTA_MS) continue; // Skip ultra-short frame intervals

    fpsOverTime.push({
      time: +normalizedTimestamps[i].toFixed(2) / 1000, // Relative time in ms
      fps: +delta.toFixed(2) / 1000,
    });
  }

  const avgFps = fpsOverTime.length / 10;
  console.log(`→ ${fpsOverTime.length} frames | Avg FPS: ${avgFps.toFixed(2)}`);

  const csv =
    "time(ms),fps\n" + fpsOverTime.map((e) => `${e.time},${e.fps}`).join("\n");
  fs.writeFileSync(outputPath, csv);
  console.log(`→ Saved to ${outputPath}\n`);
}

// Batch process all JSON files in the input directory
const files = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log("No .json files found in", INPUT_DIR);
} else {
  files.forEach(processFile);
}
