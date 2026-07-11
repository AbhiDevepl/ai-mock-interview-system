import express from "express";
import isAth from "../middleware/isAuth.js"
import {upload} from "../middleware/multer.js"
import {analyzeResume} from "../controllers/interview.controller.js"

const interviewRouter = express.Router();

interviewRouter.post("/resume",isAth,upload.single("resume"),analyzeResume)

export default interviewRouter;
