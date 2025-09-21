import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Donation amount is required"],
      min: [100, "Minimum donation amount is 1 INR (100 paise)"], // Razorpay uses paise
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR"],
      default: "INR",
    },
    donorName: {
      type: String,
      required: [true, "Donor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [30, "Name must be less than 30 characters"],
    },
    donorEmail: {
      type: String,
      required: [true, "Donor email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    donorPhone: {
      type: String,
      required: [true, "Donor phone number is required"],
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"],
    },
    purpose: {
      type: String,
      required: [true, "Donation purpose is required"],
      trim: true,
      maxlength: [200, "Purpose cannot exceed 200 characters"],
    },
    localStatus: {
      type: String,
      enum: [
        "created",
        "authorized",
        "captured",
        "failed",
        "pending",
        "refunded",
      ],
      default: "created",
    },
    razorpay: {
      orderId: {
        type: String,
        required: [true, "Razorpay Order ID is required"],
      },
      paymentId: {
        type: String,
        default: null, // will be filled after payment
      },
      signature: {
        type: String,
        default: null,
      },
      captureDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    receipt: {
      filePath: {
        type: String,
        default: null, // path to stored PDF
      },
      token: {
        type: String,
        unique: true,
        sparse: true, // allow null but enforce uniqueness if present
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      generatedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", DonationSchema);

export default Donation;
