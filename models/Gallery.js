import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const gallerySectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: [true, "Section name is required"],
      enum: [
        "Home",
        "Aboutus",
        "Gaushala",
        "Vriddhashram",
        "School",
        "EyeHospital",
        "OldAge",
        "Physiotherapy",
        "Nursing Hospital",
      ], // restricts to predefined sections
    },
    photos: [photoSchema], // array of photos inside section
  },
  { timestamps: true }
);

const Gallery = mongoose.model("GallerySection", gallerySectionSchema);

export default Gallery;
