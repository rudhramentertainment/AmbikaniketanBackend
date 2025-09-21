import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required."],
    minlength: [2, "Name must be at least 2 characters long."],
    maxlength: [100, "Name cannot exceed 100 characters."],
  },
  email: {
    type: String,
    required: [true, "Email is required."],
    match: [/.+\@.+\..+/, "Please enter a valid email address."],
    lowercase: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required."],
    minlength: [3, "Subject must be at least 3 characters long."],
    maxlength: [150, "Subject cannot exceed 150 characters."],
  },
  message: {
    type: String,
    required: [true, "Message is required."],
    minlength: [5, "Message must be at least 5 characters long."],
    maxlength: [1000, "Message cannot exceed 1000 characters."],
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;
