import express from "express";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const app = express();
const port = 8787;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const exportsDir = path.join(root, "exports");
const tmpDir = path.join(root, "tmp");

fs.mkdirSync(exportsDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use("/exports", express.static(exportsDir));

app.post("/api/render", async (req, res) => {
  const props = req.body || {};

  const safeProps = {
    text: String(props.text || "").slice(0, 3000),
    preset: String(props.preset || "punch"),
    fontStyle: String(props.fontStyle || "premium"),
    accentColor: String(props.accentColor || "#ff3b3b"),
    baseColor: String(props.baseColor || "#ffffff"),
    seconds: Number(props.seconds || 7)
  };

  const stamp = Date.now();
  const propsPath = path.join(tmpDir, `props-${stamp}.json`);
  const outName = `motion-text-${stamp}.mp4`;
  const outPath = path.join(exportsDir, outName);

  fs.writeFileSync(propsPath, JSON.stringify(safeProps, null, 2));

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";

  const args = [
    "remotion",
    "render",
    "src/remotion/index.jsx",
    "MotionText",
    outPath,
    "--props",
    propsPath,
    "--codec",
    "h264",
    "--overwrite"
  ];

  const child = spawn(npx, args, {
    cwd: root,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let logs = "";

  child.stdout.on("data", (data) => {
    logs += data.toString();
  });

  child.stderr.on("data", (data) => {
    logs += data.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        ok: false,
        error: "Render failed",
        logs: logs.slice(-4000)
      });
    }

    return res.json({
      ok: true,
      file: `/exports/${outName}`,
      message: "MP4 rendered successfully"
    });
  });
});

app.listen(port, () => {
  console.log(`Render server running on http://localhost:${port}`);
});
