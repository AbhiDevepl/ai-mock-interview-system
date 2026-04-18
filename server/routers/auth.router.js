import express from "express"
import { googleAuth, logout, EmailAuth, githubAuth } from "../controllers/auth.controller.js"

const authRouter = express.Router()

authRouter.post("/google", googleAuth)
authRouter.post("/logout", logout)
authRouter.post("/email", EmailAuth)
authRouter.post("/github", githubAuth)

export default authRouter