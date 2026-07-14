import express from "express";

const healthRouter = express.Router();

// Health check endpoint for Docker healthcheck and load balancers
healthRouter.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default healthRouter;
