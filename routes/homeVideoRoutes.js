import express from "express";
import upload, { uploadVideo } from "../middleware/upload.js";
import { addHomeVideo, deleteVideo, getAllVideos, updateVideo } from "../controller/homeVideoController.js";
import path from "path";
import fs from "fs";


const homeVideo = express.Router();

homeVideo.post('/addvideo',uploadVideo.single("video"),addHomeVideo);
homeVideo.delete("/deletevideo/:id", deleteVideo);
homeVideo.get("/getVideo", getAllVideos);
homeVideo.put("/updatevideo", uploadVideo.single("video"),updateVideo);

homeVideo.get("/stream/:filename", (req, res) => {
  const filePath = path.join(process.cwd(), "uploads/videos", req.params.filename);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type"
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, stats.size - 1);

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "video/mp4",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type"
    };

    res.writeHead(206, headers);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  });
});




export default homeVideo;