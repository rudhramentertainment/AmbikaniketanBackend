import express from "express";
import { handleWebhook } from "../controller/webhookController.js";

const app = express.Router();


app.post('/razorpay',handleWebhook);

export default app;
