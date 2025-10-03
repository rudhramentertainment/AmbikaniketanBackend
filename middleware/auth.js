// middleware/adminAuth.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Session from "../models/Session.js";

const adminAuth = async (req, res, next) => {
  try {
    // 1. Get token safely
    const authHeader = req.headers.authorization;
    const token = req.cookies?.admin_token || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired, please log in again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }
   if (!payload?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // sessionId from cookie or header
    const sessionId = req.cookies?.session_id || req.headers["x-session-id"];
    if (!sessionId) {
      return res.status(401).json({ message: "Session not found" });
    }


    // Find session
    const session = await Session.findOne({ sessionId, adminId: payload.id });
    if (!session || !session.isActive) {
      return res.status(401).json({ message: "Session invalid or logged out" });
    }

       const admin = await Admin.findById(payload.id).select("-passwordHash");
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }



    // 6. Update lastSeenAt
    session.lastSeenAt = new Date();
    await session.save();

    req.admin = admin;
    req.session = session;
    next();
  } catch (err) {
    console.error("adminAuth error", err);
   
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// helper to clear cookies
function clearAuthCookies(res) {
  res.clearCookie("admin_token");
  res.clearCookie("session_id");
}

export default adminAuth;
