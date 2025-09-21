import HomeVideo from "../models/HomeVideo.js";
import path from 'path';
import fs from 'fs';

export const addHomeVideo = async (req, res) => {
  try {
    const { title, description, isFeatured } = req.body;
    // Ensure file is uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Video file is required" });
    }
    // Construct file path
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    // If this video is marked as featured, un-feature others
    if (isFeatured === "true" || isFeatured === true) {
      await HomeVideo.updateMany({}, { isFeatured: false });
    }
    const newVideo = new HomeVideo({
      videoUrl,
      title,
      description,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });
    await newVideo.save();
    res.status(201).json({
      success: true,
      message: "Home video uploaded successfully!",
      data: newVideo,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await HomeVideo.findById(id);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    // Construct absolute file path
    const filePath = path.join(process.cwd(), video.videoUrl.replace(/^\//, "")); 
    // removes leading slash from /uploads/videos/...
    // Delete file from folder if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await HomeVideo.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await HomeVideo.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};