const express = require("express");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();

// Allow all CORS requests with all options
app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Configuration
const VIDEO_PATH = "./assets/test.mp4";
const HLS_OUTPUT_DIR = "hls_output";
const PORT = 8777;

// Create output directory if it doesn't exist
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR);
}

// Serve HLS files with permissive headers
app.use(
  "/hls",
  express.static(HLS_OUTPUT_DIR, {
    setHeaders: (res) => {
      // Allow everything
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      // Disable CSP
      res.setHeader(
        "Content-Security-Policy",
        "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data: blob: 'unsafe-inline'; media-src * data: blob: 'unsafe-inline';"
      );
      // Disable other security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache");
      // Remove strict transport security
      res.removeHeader("Strict-Transport-Security");
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
      "-c:v copy",
      "-c:a aac",
      "-hls_time 2",
      "-hls_list_size 3",
      "-hls_flags delete_segments",
      "-f hls",
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

// Add favicon route to prevent 404s
app.get("/favicon.ico", (req, res) => res.status(204));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    videoExists: fs.existsSync(VIDEO_PATH),
    playlist: fs.existsSync(`${HLS_OUTPUT_DIR}/playlist.m3u8`),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startStreaming();
});
