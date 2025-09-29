// controllers/sessionController.js
import Session from "../models/Session.js";

// GET /admin/sessions  (protected)
export const getSessions = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const sessions = await Session.find({ adminId }).populate("adminId","username email").sort({ lastSeenAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error("getSessions", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /admin/sessions/:sessionId/revoke  (protected)
export const revokeSession = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId, adminId });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    session.isActive = false;
    await session.save();

    res.json({ success: true, message: "Session revoked" });
  } catch (err) {
    console.error("revokeSession", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /admin/sessions/revoke-others  (protected)
export const revokeOtherSessions = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const currentSessionId = req.session.sessionId;

    await Session.updateMany({ adminId, sessionId: { $ne: currentSessionId } }, { isActive: false });
    res.json({ success: true, message: "Other sessions logged out" });
  } catch (err) {
    console.error("revokeOtherSessions", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /admin/logout  (protected) -> logout current session and clear cookies
export const logoutCurrent = async (req, res) => {
  try {
    const session = req.session;
    if (session) {
      session.isActive = false;
      await session.save();
    }
    // clear cookies
    res.clearCookie('admin_token');
    res.clearCookie('session_id');
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("logoutCurrent", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// controllers/sessionController.js
export const deleteSession = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { sessionId } = req.params;
    const deleted = await Session.findOneAndDelete({ adminId, sessionId });
    if (!deleted) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    console.error("deleteSession", err);
    res.status(500).json({ message: "Server error" });
  }
};
