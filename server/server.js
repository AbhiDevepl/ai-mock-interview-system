import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { connectRedis } from "./config/redis.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRouter from "./routers/auth.route.js";
import userRouter from "./routers/user.route.js";

dotenv.config();

const app = express();

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

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  return res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    // Fire Redis connection in parallel — non-critical for startup
    // Server starts immediately; Redis handles its own reconnection
    // getRedisClient() gracefully returns null if unavailable
    connectRedis().catch((err) => {
      console.warn(
        "Redis unavailable — server will proceed without Redis:",
        err.message,
      );
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
