import express from "express";
import { createOrder, deleteDonation, getAllDonations, getDonationById, getReceiptByToken, getSuccessfulDonations, updateDonation, verifyCheckoutSignature } from "../controller/donateController.js";
import donateValidator from "../middleware/validators.js";
import adminAuth from "../middleware/auth.js";

const app = express.Router();

app.post("/create-order",donateValidator ,createOrder);
app.post("/verify",verifyCheckoutSignature);
app.get("/receipt/:token",getReceiptByToken);


//Managment

app.get("/", adminAuth,getAllDonations);             
app.get("/successful",adminAuth ,getSuccessfulDonations);
app.get("/:id", adminAuth,getDonationById);        
app.put("/:id",adminAuth ,updateDonation);        
app.delete("/:id",adminAuth ,deleteDonation);       

export default app;