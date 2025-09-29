import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // email is optional but must be unique if present
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin", // by default, any created user is admin
    },
    sections: [
      {
        type: String,
        enum: ["Dashboard", "HomeVideo", "Gallery", "Events", "UserInformation","Donation","Admin" ,"Profile","UpdatePassword","LoginSessions","All"],
      },
    ],
  },
  { timestamps: true }
);

// ✅ Method: verify password
adminSchema.methods.verifyPassword = function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};

// ✅ Static: hash password
adminSchema.statics.hashPassword = async function (pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
