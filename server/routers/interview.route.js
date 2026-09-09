import express from "express";
import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";
import { sessionLimiter } from "../middleware/rateLimiter.js";
import {
  analyzeResume,
  generateQuestion,
  submitAnswer,
  finishInterview,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

interviewRouter.post(
  "/resume",
  isAuth,
  sessionLimiter,
  upload.single("resume"),
  analyzeResume,
);
interviewRouter.post(
  "/generate-question",
  isAuth,
  sessionLimiter,
  generateQuestion,
);
interviewRouter.post("/submit-answer", isAuth, sessionLimiter, submitAnswer);
interviewRouter.post("/finish", isAuth, sessionLimiter, finishInterview);

export default interviewRouter;
