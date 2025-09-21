import Message from "../models/Message.js";

export const addMesage = async(req,res)=>{
    try {
    const { name, email, subject, message } = req.body;

    const newMessage = new Message({ name, email, subject, message });
    await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);

    // ✅ Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors[0], // send first error only
        errors, // OR send all errors in array
      });
    }

    res.status(500).json({ success: false, message: "Server error." });
  }
}

export const getMessage = async (req,res) =>{
     try {
    const messages = await Message.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      data: deletedMessage,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};