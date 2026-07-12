import express from "express";
import { googleAuth, logOut, getMe } from "../controllers/auth.controller.js";
import isAuth, { optionalAuth } from "../middleware/isAuth.js";
import { authLimiter, sessionLimiter } from "../middleware/rateLimiter.js";

const authRouter = express.Router();

authRouter.post("/google", authLimiter, googleAuth);
authRouter.post("/logout", optionalAuth, logOut);
authRouter.get("/me", isAuth, sessionLimiter, getMe);

export default authRouter;
