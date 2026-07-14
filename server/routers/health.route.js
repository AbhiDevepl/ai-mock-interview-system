import express from "express";

const healthRouter = express.Router();

// Health check endpoint for Docker healthcheck and monitoring
healthRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default healthRouter;
