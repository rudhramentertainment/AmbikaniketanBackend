import nodemailer from "nodemailer";
import path from "path";

export async function sendReceiptEmail(donation, relativePath) {
  const absolutePath = path.resolve(process.env.UPLOADS_DIR || "./uploads", relativePath);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Shri Ambika Niketan Trust" <${process.env.SMTP_USER}>`,
    to: donation.donorEmail,
    subject: "Your Donation Receipt - Shri Ambika Niketan Trust",
    text: `Dear ${donation.donorName},\n\nThank you for your generous donation of ₹ ${(donation.amount / 100).toFixed(2)}.\nPlease find your receipt attached.\n\nRegards,\nShri Ambika Niketan Trust`,
    attachments: [{ filename: `receipt_${donation._id}.pdf`, path: absolutePath }],
  };

  return transporter.sendMail(mailOptions);
}
