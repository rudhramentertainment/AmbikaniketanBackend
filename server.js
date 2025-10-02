import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import donateRoutes from './routes/donateRoutes.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'xss-clean';
import morgan from 'morgan';  
import message from './routes/messageRoutes.js';
import cors from "cors";
import homeVideo from './routes/homeVideoRoutes.js';
import gallery from './routes/galleryRoutes.js';
import event from './routes/eventRoutes.js';
import path from "path";
import webhooksroutes from "./routes/webhookRoutes.js";

//cameraRoute

import camera from "./routes/cameraRoute.js";

//Camera

import fetch from "node-fetch";
import { URLSearchParams } from 'url';




const app = express();

dotenv.config();


app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//security middlewares

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"], // allow inline styles
//         imgSrc: ["'self'", "data:"],
//         connectSrc: ["'self'", process.env.FRONTEND_URL],
//         mediaSrc: ["'self'", "http://localhost:8000"], // ✅ allow video streaming
//         frameSrc: ["'self'"],
//       },
//     },
//   })
// );

// app.use(mongoSanitize({
//     replaceWith: '_', // replaces unsafe characters instead of deleting query object
//   }));
// app.use(xss());
app.use(morgan('combined'));  //logging middleware

const allowedOrigins = process.env.FRONTEND_URL.split(",").map(o =>
  o.trim().replace(/\/+$/, "")
);

app.use(
  cors({
   origin: function (origin, callback) {
  const cleanOrigin = origin ? origin.trim().replace(/\/+$/, "") : origin;

  console.log("🌐 Incoming origin:", cleanOrigin);
  console.log("✅ Allowed origins:", allowedOrigins);

  if (!cleanOrigin || allowedOrigins.includes(cleanOrigin)) {
    callback(null, true);
  } else {
    console.error("❌ Blocked by CORS:", cleanOrigin);
    callback(new Error("Not allowed by CORS: " + cleanOrigin));
  }
},

    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// We need rawBody for webhook signature verification. Save rawBody on request.
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
  limit: '1mb'
}));

//admin routes
app.use('/api/admin',adminRoutes);
app.use('/api/donate',donateRoutes);
app.use('/api/message',message);
app.use('/api/homevideo',homeVideo);
app.use("/api/galleryphoto",gallery);
app.use("/api/event",event);
app.use("/api/webhook", webhooksroutes);

app.options("/api/homevideo/stream/:filename", cors());

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
    res.setHeader("Accept-Ranges", "bytes"); // allow video streaming
    next(); // ✅ don't block express.static
  },
  express.static(path.join(process.cwd(), "uploads"))
);

app.use('/api/camera',camera);

app.get("/", (req, res) => res.send("Camera proxy server running"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
 
});

connectDB();

