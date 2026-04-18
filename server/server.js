import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import authRouter from './routers/auth.router.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'

dotenv.config();
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRouter)

const PORT = process.env.PORT || 8001;
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});