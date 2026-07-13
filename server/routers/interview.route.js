import express from "express";
import isAth from "../middleware/isAuth.js"
import {upload} from "../middleware/multer.js"
import {analyzeResume,generateQuestion,submitAnswer,finishInterview} from "../controllers/interview.controller.js"

const interviewRouter = express.Router();

interviewRouter.post("/resume",isAth,upload.single("resume"),analyzeResume)
interviewRouter.post("/generate-question",isAth,generateQuestion)
interviewRouter.post("/submit-answer",isAth,submitAnswer)
interviewRouter.get("/finish",isAth,finishInterview)

export default interviewRouter;
