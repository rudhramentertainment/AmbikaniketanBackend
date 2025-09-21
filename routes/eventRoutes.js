import express from "express";
import { uploadEventImage } from "../middleware/upload.js";
import { addEvent, deleteEvent, getEvents, updateEvent } from "../controller/eventController.js";

const event = express.Router();

event.post('/addevent', uploadEventImage.single("image"), addEvent);
event.get("/", getEvents);
event.put("/:id", uploadEventImage.single("image"), updateEvent);
event.delete("/:id", deleteEvent);


export default event;