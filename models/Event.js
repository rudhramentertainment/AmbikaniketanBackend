import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,  
    },
    description: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: [true, "Event image is required"],
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
