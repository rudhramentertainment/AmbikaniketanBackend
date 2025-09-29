import {validationResult }  from "express-validator";
import Donation from "../models/Donation.js";
import createRzpClient from "../utils/razorpayClient.js";
import crypto from "crypto";
import fs from "fs/promises";
import { sendReceiptEmail } from "../utils/mailer.js";
import generateReceiptPdfAndSave from "../utils/generateReceiptPdfAndSave.js";
import path from "path";



export const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { amount , donorName, donorEmail, donorPhone, purpose} = req.body;
        const amountPaise = Math.round(Number(amount) * 100);

        // const donation = await Donation.create({
        //     amount: amountPaise,
        //     donorName,
        //     donorEmail,
        //     donorPhone,
        //     purpose,
        //     localStatus: "created",
        // });

        const razorPay = createRzpClient();
const order = await razorPay.orders.create({
  amount: amountPaise,
  currency: "INR",
  receipt: `donation_${Date.now()}`,
  notes: { purpose }
});

const donation = await Donation.create({
  amount: amountPaise,
  donorName,
  donorEmail,
  donorPhone,
  purpose,
  localStatus: "created",
  razorpay: { orderId: order.id }
});

res.status(201).json({
  success: true,
  orderId: order.id,
  keyId: process.env.RZP_KEY_ID,
  donationId: donation._id
});

    }catch (err) {
    console.error('createOrder', err);
    console.error("createOrder error:", err);
res.status(500).json({ error: err.message || "Server error" });
  }
}

export const verifyCheckoutSignature = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, donationId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !donationId) {
      return res.status(400).json({ ok: false, error: "Missing parameters" });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ ok: false, error: "Donation not found" });

    const generated = crypto
      .createHmac("sha256", process.env.RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      donation.localStatus = "failed";
      await donation.save();
      return res.status(400).json({ ok: false, error: "Signature verification failed" });
    }

    donation.localStatus = "authorized";
    donation.razorpay = { ...(donation.razorpay || {}), orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature };
    await donation.save();

    const { filePath, token, expiresAt, generatedAt } = await generateReceiptPdfAndSave(donation);
    donation.receipt = { filePath, token, expiresAt, generatedAt };
    await donation.save();

    const absolutePath = path.resolve(process.env.UPLOADS_DIR || "./uploads", filePath);
    const pdfBuffer = await fs.readFile(absolutePath);

    const base = process.env.BASE_URL?.replace(/\/$/, "") || "";
    const receiptDownloadUrl = `${base}/api/donate/receipt/${token}`;

    if (donation.donorEmail) {
      try {
        await sendReceiptEmail(donation, filePath);
      } catch (e) {
        console.error("Email sending failed:", e.message);
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Payment verified & receipt generated",
      receiptToken: token,
      receiptDownloadUrl,
      pdfBase64: pdfBuffer.toString("base64"),
      donation,
    });
  } catch (err) {
    console.error("verifyCheckoutSignature", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};


export const getReceiptByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const donation = await Donation.findOne({ "receipt.token": token });

    if (!donation) return res.status(404).end("Not found");
    if (donation.receipt.expiresAt && new Date() > donation.receipt.expiresAt)
      return res.status(410).end("Expired");

    // Build absolute path
    const absolutePath = path.resolve(process.env.UPLOADS_DIR || "./uploads", donation.receipt.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).end("Receipt not available yet");
    }

    const stat = fs.statSync(absolutePath);

    // ✅ VERY IMPORTANT: send correct binary headers
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename=receipt_${donation._id}.pdf`
    });

    // ✅ Stream raw binary data
    const readStream = fs.createReadStream(absolutePath);
    readStream.pipe(res);

    readStream.on("error", (err) => {
      console.error("Error reading PDF file:", err);
      if (!res.headersSent) res.status(500).end("Failed to read receipt");
    });

  } catch (err) {
    console.error("getReceiptByToken error:", err);
    if (!res.headersSent) res.status(500).end("Server error");
  }
};
////  Donation Details        /////

export const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    console.error("getAllDonations", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }
    res.status(200).json({ success: true, data: donation });
  } catch (err) {
    console.error("getDonationById", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSuccessfulDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ localStatus: "authorized" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    console.error("getSuccessfulDonations", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { donorName, donorEmail, donorPhone, purpose, localStatus } = req.body;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    if (donorName) donation.donorName = donorName;
    if (donorEmail) donation.donorEmail = donorEmail;
    if (donorPhone) donation.donorPhone = donorPhone;
    if (purpose) donation.purpose = purpose;
    if (localStatus) donation.localStatus = localStatus;

    await donation.save();
    res.status(200).json({ success: true, message: "Donation updated successfully", data: donation });
  } catch (err) {
    console.error("updateDonation", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    await Donation.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Donation deleted successfully" });
  } catch (err) {
    console.error("deleteDonation", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};