import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import Donation from '../models/Donation.js';
import createRzpClient from '../utils/razorpayClient.js';
import generateReceiptPdfAndSave from '../utils/pdfService.js';

//add admin controller
export const addAdmin = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) return res.status(400).json({ error: 'Missing fields' });

        const existingAdmin = await Admin.findOne({ username: username.toLowerCase().trim() });

        if (existingAdmin) return res.status(409).json({ error: 'Username already exists'});

        const passwordHash = await Admin.hashPassword(password);

        const newAdmin = new Admin({ username: username.toLowerCase().trim(), passwordHash, email: email.toLowerCase().trim() });
        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (err) {
        console.error('addAdmin error', err);
        res.status(500).json({ error: 'Server error' });
    }
}

//login controller
export const login = async (req, res) => {
    try {
        const { username, password  } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

        const admin = await Admin.findOne({ username :username });
        if(!admin) return res.status(401).json({ error: 'Invalid username and password' });

        const ok  = await bcrypt.compare(password, admin.passwordHash);
        if(!ok) return res.status(401).json({ error: 'Invalid username and password' });

        const token = jwt.sign({username : admin.username} , process.env.JWT_SECRET, { expiresIn  : process.env.JWT_EXPIRES_IN || '7d' });
        const cookieOptions = {
        httpOnly: true,
    };
    res.cookie('admin_token', token, cookieOptions);
    res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('admin login', error);
    res.status(500).json({ error: 'Server error' });
    }
}

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