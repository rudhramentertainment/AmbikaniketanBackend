// controller/cameraController.js
import axios from "axios";
import loginAndGetCookie from "../middleware/camControle.js";
import dotenv from "dotenv";
dotenv.config();

export const getCameraStream = async (req, res) => {
  try {
    const cookie = await loginAndGetCookie();

    const streamPath = process.env.CAM_STREAM_PATH || "/doc/page/preview.asp";
    const streamUrl = streamPath.startsWith("http")
      ? streamPath
      : `http://${process.env.CAM_HOST}:${process.env.CAM_PORT}${streamPath}`;

    console.log("[cameraController] fetching:", streamUrl);

    const camRes = await axios.get(streamUrl, {
      headers: {
        Cookie: cookie,
        Referer: `http://${process.env.CAM_HOST}:${process.env.CAM_PORT}/`,
        "User-Agent": "Mozilla/5.0"
      },
      responseType: "stream",
      validateStatus: s => s >= 200 && s < 400
    });

    res.setHeader("Content-Type", camRes.headers["content-type"] || "multipart/x-mixed-replace");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");

    camRes.data.on("error", (err) => {
      console.error("[cameraController] stream error:", err.message);
      res.end();
    });

    res.on("close", () => camRes.data.destroy());
    camRes.data.pipe(res);
  } catch (err) {
    console.error("[cameraController] error:", err.message);
    res.status(500).send("Error fetching camera stream");
  }
};
