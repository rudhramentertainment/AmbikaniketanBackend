import express from "express";
import { addMesage, deleteMessage, getMessage } from "../controller/messageController.js";

const message = express();

message.post('/addMessage',addMesage);
message.get('/getMessage',getMessage);
message.delete('/deleteMessage/:id',deleteMessage);

export default message;