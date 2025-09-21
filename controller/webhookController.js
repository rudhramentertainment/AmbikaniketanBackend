import crypto from 'crypto';
import Donation from '../models/Donation.js';
import WebhookEvent from '../models/Webhook.js';
// import  generateReceiptPdfAndSave from '../utils/receiptGenerator.js';

export const handleWebhook = async (req, res) => {
    try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      console.warn('Webhook missing signature');
      return res.status(400).send('Missing signature');
    }

    const expected = crypto.createHmac('sha256', process.env.RZP_WEBHOOK_SECRET).update(req.rawBody).digest('hex');
    if (signature !== expected) {
      console.warn('Webhook signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    const payload = req.body;
    const evId = payload?.id || null;
    if (!evId) return res.status(400).send('Invalid payload');

    const already = await WebhookEvent.findOne({ eventId: evId });
    if (already) return res.status(200).send('ok');

    await WebhookEvent.create({ eventId: evId, event: payload.event, payload, receivedAt: new Date(), verified: true });

    const eventName = payload.event;
    const payment = payload.payload?.payment?.entity;

    if (payment) {
      const orderId = payment.order_id;
      const donation = await Donation.findOne({ 'razorpay.orderId': orderId });

      if (donation) {
        if (eventName === 'payment.captured') {
          donation.localStatus = 'captured';
          donation.razorpay.paymentId = payment.id;
          donation.razorpay.captureDetails = payment;
          donation.updatedAt = new Date();
          await donation.save();

          try {
            const { filePath, token, expiresAt, generatedAt } = await generateReceiptPdfAndSave(donation);
            donation.receipt = donation.receipt || {};
            donation.receipt.filePath = filePath;
            donation.receipt.token = donation.receipt.token || token;
            donation.receipt.expiresAt = donation.receipt.expiresAt || expiresAt;
            donation.receipt.generatedAt = generatedAt;
            await donation.save();
          } catch (err) {
            console.error('Failed to generate receipt', err);
          }
        } else if (eventName === 'payment.failed') {
          donation.localStatus = 'failed';
          donation.updatedAt = new Date();
          await donation.save();
        } else if (eventName === 'payment.authorized') {
          donation.localStatus = 'authorized';
          donation.updatedAt = new Date();
          await donation.save();
        }
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('server error');
  }
};

