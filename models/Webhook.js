import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema(
  {
   eventId: { 
    type: String, 
    unique: true
 },
   event: {
    String
   },
   payload: mongoose.Schema.Types.Mixed,
   receivedAt: Date,
   verified: Boolean
  });

  const Webhook = mongoose.model("Webhook", webhookSchema);
  export default Webhook;
