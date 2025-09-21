import mongoose from "mongoose";

const homeVideoSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: [true, "Video file is required"],
    },
    title: {
      type: String,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    isFeatured: {
      type: Boolean,
      default: false, 
    },
  },
  { timestamps: true }
);

const HomeVideo = mongoose.model("HomeVideo", homeVideoSchema);

export default HomeVideo;
