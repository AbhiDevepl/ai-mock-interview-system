import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sessionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many requests." },
  standardHeaders: true,
  legacyHeaders: false,
});
