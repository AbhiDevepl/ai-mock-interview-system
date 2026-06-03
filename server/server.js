import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import cookieParser from 'cookie-parser';
import cors from "cors"
import helmet from 'helmet';
import authRouter from './routers/auth.route.js';
import userRouter from './routers/user.route.js';
dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
};
console.log("CORS origin:", corsOptions.origin);
app.use(helmet());
app.use(cors(corsOptions));

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB()
});