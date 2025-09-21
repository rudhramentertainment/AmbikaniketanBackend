import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
    },
    passwordHash: {
        type: String,
        required: [true, "Password is required"], 
    },
    email: { 
        type: String
     },
   
}, { timestamps: true });

adminSchema.methods.verifyPassword = function(pw) {
    return bcrypt.compare(pw, this.passwordHash);
};

adminSchema.statics.hashPassword = async function(pw) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pw, salt);
};
const Admin = mongoose.model("Admin", adminSchema);

export default Admin;