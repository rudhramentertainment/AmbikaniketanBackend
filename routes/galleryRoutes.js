import express from "express";
import upload, { uploadImage } from "../middleware/upload.js";
import { addPhoto, deletePhoto, getPhotosBySection, updatePhoto } from "../controller/galleryController.js";
import adminAuth from "../middleware/auth.js";


const gallery = express.Router();


gallery.post('/addPhoto',adminAuth,uploadImage.array("images",10),addPhoto);
gallery.get("/:sectionName",adminAuth ,getPhotosBySection);
gallery.delete("/:sectionName/:photoId", adminAuth,deletePhoto);
gallery.put("/:sectionName/:photoId",adminAuth ,uploadImage.single("image"), updatePhoto);

export default gallery;