import express from "express";
import { createOrder, deleteDonation, getAllDonations, getDonationById, getReceiptByToken, getSuccessfulDonations, updateDonation, verifyCheckoutSignature } from "../controller/donateController.js";
import donateValidator from "../middleware/validators.js";

const app = express.Router();

app.post("/create-order",donateValidator ,createOrder);
app.post("/verify",verifyCheckoutSignature);
app.get("/receipt/:token",getReceiptByToken);


//Managment

app.get("/", getAllDonations);             
app.get("/successful", getSuccessfulDonations);
app.get("/:id", getDonationById);        
app.put("/:id", updateDonation);        
app.delete("/:id", deleteDonation);       

export default app;