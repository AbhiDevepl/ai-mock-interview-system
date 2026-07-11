import express from "express";
import { googleAuth, logOut, getMe } from "../controllers/auth.controller.js";
import isAuth, { optionalAuth } from "../middleware/isAuth.js";

const authRouter = express.Router();

authRouter.post("/google", googleAuth);
authRouter.post("/logout", optionalAuth, logOut);
authRouter.get("/me", isAuth, getMe);

export default authRouter;
