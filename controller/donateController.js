import validationResult  from "express-validator";
import Donation from "../models/Donation.js";
import createRzpClient from "../utils/razorpayClient.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { amount , donorName, donorEmail, donorPhone, purpose} = req.body;
        const amountPaise = Math.round(Number(amount) * 100);

        const donation = await Donation.create({
            amount: amountPaise,
            donorName,
            donorEmail,
            donorPhone,
            purpose,
            localStatus: "created",
        });

        const razorPay = createRzpClient();

        const order = await razorPay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt:  `donation_${donation._id}`,
            notes: { donationId: String(donation._id), purpose }
        });

        donation.razorpay.orderId = order.id;
        await donation.save();

        res.status(201).json({  
            success: true, 
            orderId: order.id, 
            keyId: process.env.RZP_KEY_ID,
            donationId: donation._id 
        });
    }catch (err) {
    console.error('createOrder', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export const verifyCheckoutSignature = async (req, res) => {
     try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, donationId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !donationId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ error: 'Donation not found' });

    const generated = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated !== razorpay_signature) {
      donation.localStatus = 'failed';
      await donation.save();
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    donation.localStatus = 'authorized';
    donation.razorpay.paymentId = razorpay_payment_id;
    donation.razorpay.signature = razorpay_signature;
    donation.updatedAt = new Date();
    await donation.save();

    const token = crypto.randomBytes(10).toString('hex');
    const expiresAt = new Date(Date.now() + (Number(process.env.RECEIPT_LINK_EXPIRES_DAYS || 30) * 24 * 60 * 60 * 1000));
    donation.receipt = donation.receipt || {};
    donation.receipt.token = donation.receipt.token || token;
    donation.receipt.expiresAt = donation.receipt.expiresAt || expiresAt;
    await donation.save();

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30
    };
    res.cookie('donationReceiptToken', token, cookieOptions);

    res.json({ ok: true, message: 'Signature verified. Payment recorded. Receipt token set in cookie.' });
  } catch (err) {
    console.error('verifyCheckoutSignature', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export const getReceiptByToken = async (req, res) => {
    try {
        const { token } = req.params;
    const donation = await Donation.findOne({ 'receipt.token': token });
    if (!donation) return res.status(404).send('Not found');
    if (donation.receipt.expiresAt && new Date() > new Date(donation.receipt.expiresAt)) return res.status(410).send('Expired');

    const fs = require('fs');
    if (!donation.receipt.filePath || !fs.existsSync(donation.receipt.filePath)) {
      return res.status(404).send('Receipt not available yet');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${donation._id}.pdf`);
    const stream = fs.createReadStream(donation.receipt.filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('getReceiptByToken', err);
    res.status(500).send('Server error');
  }
}

