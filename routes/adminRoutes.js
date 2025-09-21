import express from "express";
import { addAdmin, generateReceipt, listDonations, login, logout, reconcilDonations } from "../controller/adminController.js";
import adminAuth from "../middleware/auth.js";

const app = express.Router();

app.post("/addAdmin",addAdmin);
app.post("/login",login);
app.post("/logout", adminAuth,logout);

app.get("/donations", adminAuth, listDonations);
app.post("/donations/:id/reconcile", adminAuth, reconcilDonations);
app.post("/donations/:id/generate-receipt", adminAuth, generateReceipt);    

export default app;