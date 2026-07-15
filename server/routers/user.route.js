import express from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import isAuth from "../middleware/isAuth.js";
import { sessionLimiter } from "../middleware/rateLimiter.js";

const userRouter = express.Router();

userRouter.get("/current-user", isAuth, sessionLimiter, getCurrentUser);

export default userRouter;
