import express from "express";
import { getCameraStream } from "../controller/cameraController.js";
import loginAndGetCookie from "../middleware/camControle.js";

const router = express.Router();

router.get("/mjpeg", getCameraStream);

router.get("/cookie", async (req, res) => {
  try {
    const cookie = await loginAndGetCookie();
    res.json({ ok: true, cookie });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/inspect", async (req, res) => {
  try {
    const cookie = await loginAndGetCookie();
    const streamPath = process.env.CAM_STREAM_PATH || "/preview.asp";
    const streamUrl = streamPath.startsWith("http")
      ? streamPath
      : `http://${process.env.CAM_HOST}:${process.env.CAM_PORT}${streamPath}`;

    // Do a plain GET to read headers/body preview (not streaming)
    const resp = await axios.get(streamUrl, {
      headers: { Cookie: cookie, Referer: `http://${process.env.CAM_HOST}:${process.env.CAM_PORT}/`, "User-Agent":"Mozilla/5.0" },
      responseType: "text",
      validateStatus: s => s >= 200 && s < 400
    });

    res.json({ ok: true, status: resp.status, headers: resp.headers, snippet: resp.data.slice(0,1000) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
