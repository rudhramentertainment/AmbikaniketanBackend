import Gallery from "../models/Gallery.js";
import fs from "fs";
import path from "path";

export const addPhoto = async (req, res) => {
  try {
    const { sectionName, title, description } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }
    let section = await Gallery.findOne({ sectionName });
    if (!section) {
      section = new Gallery({ sectionName, photos: [] });
    }
    // Add each uploaded photo
    req.files.forEach((file) => {
      section.photos.push({
        imageUrl: `/uploads/gallery/${file.filename}`,
        title: title || "Untitled",
        description: description || "",
      });
    });
    await section.save();
    res.status(201).json({
      success: true,
      message: "Photo(s) added successfully",
      data: section,
    });
  } catch (error) {
    console.error("Error adding photo:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPhotosBySection = async (req, res) => {
  try {
    const { sectionName } = req.params;
    const section = await Gallery.findOne({ sectionName });

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    res.status(200).json({
      success: true,
      count: section.photos.length,
      data: section.photos,
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const { sectionName, photoId } = req.params;

    const section = await Gallery.findOne({ sectionName });
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const photo = section.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    // ✅ Build correct absolute path
    let filePath = photo.imageUrl;
    if (filePath.startsWith("http")) {
      // If full URL is stored → remove domain part
      filePath = filePath.split("/uploads/")[1];
      filePath = path.join(process.cwd(), "uploads", filePath);
    } else {
      // Normal case → "/uploads/gallery/..."
      filePath = path.join(process.cwd(), photo.imageUrl.replace(/^\//, ""));
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted file:", filePath);
    } else {
      console.warn("File not found on disk:", filePath);
    }
    // ✅ Remove from DB
    section.photos.pull({ _id: photoId });
    await section.save();

    res.status(200).json({ success: true, message: "Photo deleted from DB & folder" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updatePhoto = async (req, res) => {
  try {
    const { sectionName, photoId } = req.params;
    const { title, description } = req.body;

    const section = await Gallery.findOne({ sectionName });
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const photo = section.photos.id(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    // ✅ Update fields
    if (title) photo.title = title;
    if (description) photo.description = description;

    // ✅ If new file uploaded, replace old file
    if (req.file) {
      // Delete old file
      let oldPath = path.join(process.cwd(), photo.imageUrl.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      // Save new file path
      photo.imageUrl = `/uploads/gallery/${req.file.filename}`;
    }

    await section.save();

    res.status(200).json({
      success: true,
      message: "Photo updated successfully",
      data: photo,
    });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};