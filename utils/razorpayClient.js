import Razorpay from "razorpay";

function createRzpClient() {
  return new Razorpay({
    key_id: process.env.RZP_KEY_ID,
    key_secret: process.env.RZP_KEY_SECRET
  });
}

export default createRzpClient;