import express from "express";
import { createOrder, getReceiptByToken, verifyCheckoutSignature } from "../controller/donateController.js";
import donateValidator from "../middleware/validators.js";

const app = express.Router();

app.post("/create-order",donateValidator ,createOrder);
app.post("/verify",verifyCheckoutSignature);
app.post("/receipt/:token",getReceiptByToken);

export default app;