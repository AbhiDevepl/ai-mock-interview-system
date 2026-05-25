import express from 'express';
import { googleAuth, logOut } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
// Security: Use POST for logout to mitigate CSRF and align with frontend
authRouter.post("/logout", logOut)

export default authRouter