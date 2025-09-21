import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Reusable function for different upload folders & filters
const createUploader = (folder, type) => {
  // Ensure upload folder exists
  const uploadDir = `uploads/${folder}`;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Storage config
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext); // unique filename
    },
  });

  // Dynamic filter
  const fileFilter = (req, file, cb) => {
    if (type === "video" && file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else if (type === "image" && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${type} files are allowed`), false);
    }
  };

  return multer({ storage, fileFilter });
};


 export const uploadVideo = createUploader("videos", "video");
 export const uploadImage = createUploader("gallery", "image");
  export const uploadEventImage  = createUploader("events", "image");

 export default {uploadVideo,uploadImage,uploadEventImage}