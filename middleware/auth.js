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
      clearAuthCookies(res);
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 2. Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      clearAuthCookies(res);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired, please log in again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!payload?.id) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 3. Get sessionId
    const sessionId = req.cookies?.session_id || req.headers["x-session-id"];
    if (!sessionId) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session not found" });
    }

    // 4. Find session + populate admin
    const session = await Session.findOne({ sessionId, adminId: payload.id });
    if (!session || !session.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Session invalid or logged out" });
    }

    // 5. Fetch admin
    const admin = await Admin.findById(payload.id).select("-passwordHash");
    if (!admin) {
      clearAuthCookies(res);
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
    clearAuthCookies(res);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// helper to clear cookies
function clearAuthCookies(res) {
  res.clearCookie("admin_token");
  res.clearCookie("session_id");
}

export default adminAuth;
