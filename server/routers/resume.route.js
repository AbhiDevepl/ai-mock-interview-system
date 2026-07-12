import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";
import { analyzeResume } from "../controllers/interview.controller.js";

const resumeRouter = express.Router();

resumeRouter.post("/analyze", isAuth, upload.single("resume"), analyzeResume);

export default resumeRouter;