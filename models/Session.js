import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  adminId: {
     type: mongoose.Schema.Types.ObjectId, ref: "Admin",
      required: true,
       index: true
     },
  sessionId: { 
    type: String,
    required: true, 
    unique: true,
    index: true }, // random id
  userAgent: { type: String, default: null },
  device: { type: String, default: null }, // e.g. "Desktop - Chrome"
  browser: { type: String, default: null },
  os: { type: String, default: null },
  ip: { type: String, default: null },
  location: { type: String, default: null }, // optional, from geoip-lite
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Session = mongoose.model("Session", SessionSchema);
export default Session;
