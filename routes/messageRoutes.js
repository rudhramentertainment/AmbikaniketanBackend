import express from "express";
import { addMesage, deleteMessage, getMessage } from "../controller/messageController.js";
import adminAuth from "../middleware/auth.js";

const message = express();

message.post('/addMessage',addMesage);
message.get('/getMessage',adminAuth,getMessage);
message.delete('/deleteMessage/:id',adminAuth,deleteMessage);

export default message;