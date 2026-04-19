import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import authRouter from './routers/auth.route.js';
import cookieParser from 'cookie-parser';
import userRouter from './routers/user.route.js';
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
app.use("/api/user", userRouter)

const PORT = process.env.PORT;
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});