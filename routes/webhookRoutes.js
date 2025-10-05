import express from "express";
import { handleWebhook } from "../controller/webhookController.js";

const app = express.Router();


app.post('/razorpay',app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
  limit: '1mb'
})),
handleWebhook);

export default app;
