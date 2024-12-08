const express = require("express");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// Configuration
const VIDEO_PATH = "./assets/test.mp4";
const HLS_OUTPUT_DIR = "hls_output";
const PORT = 8777;

// Create output directory if it doesn't exist
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR);
}

// Serve HLS files
app.use(
  "/hls",
  express.static(HLS_OUTPUT_DIR, {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");
    },
  })
);

function startStreaming() {
  // Clear previous segments
  fs.readdirSync(HLS_OUTPUT_DIR).forEach((file) => {
    fs.unlinkSync(path.join(HLS_OUTPUT_DIR, file));
  });

  ffmpeg(VIDEO_PATH)
    .inputOptions(["-re", "-stream_loop", "-1"])
    .outputOptions([
      "-c:v copy", // Copy video codec without re-encoding
      "-c:a aac", // Audio codec
      "-hls_time 2", // 2-second segments
      "-hls_list_size 3", // Keep 3 segments
      "-hls_flags delete_segments",
      "-f hls", // Force HLS format
    ])
    .output(`${HLS_OUTPUT_DIR}/playlist.m3u8`)
    .on("start", () => {
      console.log("Stream started");
    })
    .on("error", (error) => {
      console.error("Stream error:", error);
      setTimeout(startStreaming, 1000);
    })
    .run();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startStreaming();
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    videoExists: fs.existsSync(VIDEO_PATH),
    playlist: fs.existsSync(`${HLS_OUTPUT_DIR}/playlist.m3u8`),
  });
});
