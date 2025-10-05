import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import Donation from '../models/Donation.js';
import createRzpClient from '../utils/razorpayClient.js';
import generateReceiptPdfAndSave from '../utils/generateReceiptPdfAndSave.js';
import crypto from 'crypto';
import Session from '../models/Session.js';
import {parseUserAgent,ipToLocation} from "../utils/sessionUtils.js";

//add admin controller
export const addAdmin = async (req, res) => {
  try {
    const { username, email, password, role, sections } = req.body;

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const passwordHash = await Admin.hashPassword(password);

    const newAdmin = new Admin({
      username,
      email,
      passwordHash,
      role: role || "admin",
      sections: role === "superadmin" ? ["All"] : sections,
    });

    await newAdmin.save();
    res.status(201).json({ success: true, message: "Admin created", data: newAdmin });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, sections } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (sections && admin.role === "admin") {
      admin.sections = sections;
    }

    if (password) {
      admin.passwordHash = await Admin.hashPassword(password);
    }

    await admin.save();
    res.status(200).json({ success: true, message: "Admin updated", data: admin });
  } catch (err) {
    console.error("Error updating admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch logged-in admin details
export const getMe = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      success: true,
      admin: req.admin,
    });
  } catch (err) {
    console.error("Get admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Get logged in admin (from middleware verifyAdmin)
    const adminId = req.admin._id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    admin.passwordHash = newHash;
    await admin.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: admins });
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    res.status(200).json({ success: true, message: "Admin deleted" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//login controller
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid username and password' });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid username and password' });

    // create JWT
    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    // create server-side session entry
    const sessionId = crypto.randomBytes(16).toString('hex');

    const ua = req.headers['user-agent'] || "";
    const { device, browser, os } = parseUserAgent(ua);

    let ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip;
    if (ip?.startsWith('::ffff:')) ip = ip.replace('::ffff:', ''); // normalize IPv4-mapped IPv6

    
    const location = ipToLocation(ip);

   await Session.create({
      adminId: admin._id,
      sessionId,
      userAgent: ua,
      device,
      browser,
      os,
      ip,
      location,
      isActive: true,
      lastSeenAt: new Date(),
    });
    // Set cookies
    // const cookieOptions = {
    //   httpOnly: true,
    //   sameSite: 'Strict',
    //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // };

    // Login handler
const cookieOptions = {
  httpOnly: true,
  secure: true,                // must be true with SameSite=None
  sameSite: "None",
  domain: ".santadmin.cloud",  // important — shares cookie with frontend + subdomains
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
    res.cookie('admin_token', token, cookieOptions);
    res.cookie('session_id', sessionId, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful',
      user: { username: admin.username, role: admin.role },
      // for Safari/iOS fallback
    });
  } catch (err) {
    console.error("admin login", err);
    res.status(500).json({ message: "Server error" });
  }
};
//logout controller
export const logout = (req, res) => {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out successfully' });
}


//list donations controller with pagination and filtering
export const listDonations = async (req, res) => {
  try {
    let { page = 1, limit = 50, status } = req.query;

    // Convert to numbers safely
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 50);

    // Build query object
    const query = {};
    if (status) query.localStatus = status;

    // Pagination calculation
    const skip = (page - 1) * limit;

    // Fetch donations with pagination
    const [donations, total] = await Promise.all([
      Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in listDonations:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};


export const reconcilDonations = async (req, res) => {
    try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) return res.status(404).json({ error: 'Not found' });
 
    if (!donation.razorpay?.paymentId) return res.status(400).json({ error: 'No paymentId to fetch'});

    const rzp = createRzpClient();
    const payment = await rzp.payments.fetch(donation.razorpay.paymentId);

    if (payment.status === 'captured') donation.localStatus = 'captured';
    else if (payment.status === 'failed') donation.localStatus = 'failed';
    else donation.localStatus = payment.status;

    donation.razorpay.captureDetails = payment;
    donation.updatedAt = new Date();
    await donation.save();

    res.json({ ok: true, donation });
  } catch (err) {
    console.error('reconcileDonation', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export const generateReceipt = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) return res.status(404).json({ error: 'Not found' });

    const { filePath, token, expiresAt, generatedAt } = await generateReceiptPdfAndSave(donation);

    donation.receipt = donation.receipt || {};
    donation.receipt.filePath = filePath;
    donation.receipt.token = donation.receipt.token || token;
    donation.receipt.expiresAt = donation.receipt.expiresAt || expiresAt;
    donation.receipt.generatedAt = generatedAt;
    await donation.save();

    res.json({ ok: true, receipt: donation.receipt });
  } catch (err) {
    console.error('generateReceipt', err);
    res.status(500).json({ error: 'Server error' });
  }
};