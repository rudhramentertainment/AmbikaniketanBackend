import express from "express";
import { uploadEventImage } from "../middleware/upload.js";
import { addEvent, deleteEvent, getEvents, updateEvent } from "../controller/eventController.js";
import adminAuth from "../middleware/auth.js";

const event = express.Router();

event.post('/addevent',adminAuth,uploadEventImage.single("image"), addEvent);
event.get("/", getEvents);
event.put("/:id",adminAuth ,uploadEventImage.single("image"), updateEvent);
event.delete("/:id",adminAuth ,deleteEvent);


export default event;