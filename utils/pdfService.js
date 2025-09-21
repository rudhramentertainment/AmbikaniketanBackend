import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


const uploadsDir = process.env.UPLOADS_DIR || './uploads';
const receiptsDir = path.join(uploadsDir, 'receipts');


if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

function generateReceiptFilePath(donationId) {
  const fname = `donation_${donationId}.pdf`;
  return path.join(receiptsDir, fname);
}

function generateToken() {
  return crypto.randomBytes(10).toString('hex');
}

async function generateReceiptPdfAndSave(donation) {
  return new Promise((resolve, reject) => {
    try {
      const filePath = generateReceiptFilePath(donation._id);
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.fontSize(18).text('Temple Donation Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Receipt No: TEMPLE-${donation._id}`);
      doc.moveDown(0.5);
      doc.text(`Donor: ${donation.donorName || 'Anonymous'}`);
      doc.text(`Email: ${donation.donorEmail || '-'}`);
      doc.text(`Phone: ${donation.donorPhone || '-'}`);
      doc.text(`Amount: ₹${(donation.amount/100).toFixed(2)}`);
      doc.text(`Purpose: ${donation.purpose || 'General Donation'}`);
      doc.text(`Date: ${new Date(donation.createdAt).toLocaleString()}`);
      doc.moveDown();
      doc.text('Thank you for your generous support.', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + (Number(process.env.RECEIPT_LINK_EXPIRES_DAYS || 30) * 24 * 60 * 60 * 1000));
        resolve({ filePath, token, expiresAt, generatedAt: new Date() });
      });

      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

export default generateReceiptPdfAndSave;