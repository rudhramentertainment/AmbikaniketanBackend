import express from "express";
import { addAdmin, deleteAdmin, generateReceipt, getAdmins, getMe, listDonations, login, logout, reconcilDonations, updateAdmin, updatePassword } from "../controller/adminController.js";
import adminAuth from "../middleware/auth.js";
import { deleteSession, getSessions, logoutCurrent, revokeOtherSessions, revokeSession } from "../controller/sessionController.js";

const app = express.Router();

app.put("/update-password", adminAuth, updatePassword);

app.post("/addAdmin",addAdmin);
app.post("/login",login);
app.post("/logout", adminAuth,logout);
app.post("/addadmin", addAdmin);
app.get("/", getAdmins);
app.put("/:id", updateAdmin);
app.delete("/:id", deleteAdmin);

//session details

app.get('/sessions', adminAuth, getSessions);
app.post('/sessions/:sessionId/revoke', adminAuth, revokeSession);
app.post('/sessions/revoke-others', adminAuth, revokeOtherSessions);
app.post('/logout', adminAuth, logoutCurrent);
app.delete('/sessions/:sessionId', adminAuth, deleteSession);

//verify admin
app.get("/me", adminAuth, getMe);



app.get("/donations", adminAuth, listDonations);
app.post("/donations/:id/reconcile", adminAuth, reconcilDonations);
app.post("/donations/:id/generate-receipt", adminAuth, generateReceipt);    

export default app;