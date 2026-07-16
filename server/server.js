import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routers/auth.route.js";
import userRouter from "./routers/user.route.js";
import interviewRouter from "./routers/interview.route.js";
import resumeRouter from "./routers/resume.route.js";
dotenv.config();

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/resume", resumeRouter);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);
  return res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();