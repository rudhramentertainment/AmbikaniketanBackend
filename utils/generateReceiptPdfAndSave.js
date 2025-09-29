import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import crypto from "crypto";

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || "./uploads");
const receiptsDir = path.join(uploadsDir, "receipts");

if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

function generateRelativeReceiptPath(donationId) {
  return `receipts/donation_${donationId}.pdf`;
}

function generateToken() {
  return crypto.randomBytes(10).toString("hex");
}

export default function generateReceiptPdfAndSave(donation) {
  return new Promise((resolve, reject) => {
    try {
      const relativePath = generateRelativeReceiptPath(donation._id);
      const absolutePath = path.join(uploadsDir, relativePath);

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const writeStream = fs.createWriteStream(absolutePath);
      doc.pipe(writeStream);

      // ---- PDF Layout ----
      doc.fontSize(20).text("Shri Ambika Niketan Trust", { align: "center" });
      doc.fontSize(10).text(
        "Parle Point, Athwalines, Dumas Road, Surat-395007, Gujarat, India.\n+91 261 2226600 / 6356211188 | ambikaniketantrust@gmail.com",
        { align: "center" }
      );
      doc.moveDown();

      doc.fontSize(16).text("DONATION RECEIPT", { align: "center", underline: true });
      doc.moveDown();

      doc.fontSize(12)
        .text(`Receipt Number: TEMPLE-${donation._id}`, { align: "right" })
        .text(`Date: ${new Date(donation.createdAt).toLocaleDateString()}`, { align: "right" });

      doc.moveDown();
      doc.text(`Received with thanks from: ${donation.donorName || "Anonymous"}`);
      doc.text(`Amount: ₹ ${(donation.amount / 100).toFixed(2)}`);
      doc.text(`Purpose: ${donation.purpose}`);
      doc.text(`Email: ${donation.donorEmail || "-"}`);
      doc.text(`Phone: ${donation.donorPhone || "-"}`);
      doc.moveDown();
      doc.text("Thank you for your generous donation!", { align: "center" });

      doc.moveDown(3);
      doc.text("Authorised Signatory", { align: "right" });
      doc.text("Shri Ambika Niketan Trust", { align: "right" });

      doc.end();

      writeStream.on("finish", () => {
  // Make sure file is completely closed before resolving
  writeStream.close(() => {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + (Number(process.env.RECEIPT_LINK_EXPIRES_DAYS || 30) * 86400000));
    resolve({ filePath: relativePath, token, expiresAt, generatedAt: new Date() });
  });
});
      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
