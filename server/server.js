import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import cookieParser from 'cookie-parser';
import cors from "cors"
import authRouter from './routers/auth.route.js';
import userRouter from './routers/user.route.js';
dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
};
console.log("CORS origin:", corsOptions.origin);
app.use(cors(corsOptions));

app.use(express.json({ limit: "10kb" }))
app.use(cookieParser())
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB()
});