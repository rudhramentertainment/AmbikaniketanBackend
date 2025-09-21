import express from "express";
import upload, { uploadImage } from "../middleware/upload.js";
import { addPhoto, deletePhoto, getPhotosBySection, updatePhoto } from "../controller/galleryController.js";


const gallery = express.Router();


gallery.post('/addPhoto',uploadImage.array("images",10),addPhoto);
gallery.get("/:sectionName", getPhotosBySection);
gallery.delete("/:sectionName/:photoId", deletePhoto);
gallery.put("/:sectionName/:photoId", uploadImage.single("image"), updatePhoto);

export default gallery;