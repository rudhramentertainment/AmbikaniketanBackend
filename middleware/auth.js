import jwt from "jsonwebtoken";

// Middleware to authenticate admin users via JWT in cookies
function adminAuth(req, res, next) {
   try {
    const token = req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // attach admin info to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden - Invalid or expired token" });
  }
}

export default adminAuth;