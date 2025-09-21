import Event from "../models/Event.js";
import fs from "fs";
import path from "path";


export const addEvent = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Event image is required" });
    }

    const newEvent = new Event({
      title,
      description,
      imageUrl: `/uploads/events/${req.file.filename}`,
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update Event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;

    // Replace image if new file uploaded
    if (req.file) {
      const oldPath = path.join(process.cwd(), event.imageUrl.replace(/^\//, ""));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      event.imageUrl = `/uploads/events/${req.file.filename}`;
    }

    await event.save();
    res.status(200).json({ success: true, message: "Event updated successfully", data: event });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Delete image file
    const filePath = path.join(process.cwd(), event.imageUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};