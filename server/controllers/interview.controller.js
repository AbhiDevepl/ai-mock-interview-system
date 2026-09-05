import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

const UPLOAD_ROOT = path.resolve(process.cwd(), "public");

// The contract shared by analyzeResume's output and generateQuestion's input.
// analyzeResume feeds generateQuestion directly, so both must agree on these.
const MAX_LIST_ITEMS = 15;
const MAX_TEXT_LENGTH = 100;

// AI output is untrusted shape: coerce to the list contract above.
const toCleanList = (value) =>
  (Array.isArray(value) ? value : [])
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_TEXT_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

const toCleanText = (value) =>
  typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "";

const getSafeUploadPath = (inputPath) => {
  if (!inputPath || typeof inputPath !== "string") return null;

  // multer's diskStorage gives a path relative to the process cwd ("public/<file>"),
  // so relative input must resolve against cwd - resolving against UPLOAD_ROOT
  // would produce "public/public/<file>", which does not exist.
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  const relative = path.relative(UPLOAD_ROOT, resolvedPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return resolvedPath;
};

export const analyzeResume = async (req, res) => {
  const filepath = getSafeUploadPath(req.file?.path);

  try {
    if (req.file && !filepath) {
      console.error("Resume analysis: upload path outside upload root:", req.file.path);
      return res.status(400).json({ message: "Invalid resume upload path" });
    }

    const user = await User.findById(req.userId).select("isActive").lean();
    if (!user || user.isActive === false) {
      if (filepath && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return res.status(403).json({ message: "This account has been deactivated." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    // PERFORMANCE OPTIMIZATION: Parse PDF pages in parallel instead of sequentially.
    // This reduces processing latency significantly for multi-page resumes.
    const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => {
      const pageNum = i + 1;
      return pdf.getPage(pageNum).then(async (page) => {
        const content = await page.getTextContent();
        return content.items.map((item) => item.str).join(" ");
      });
    });

    const pagesTexts = await Promise.all(pagePromises);
    let resumeText = pagesTexts.join("\n").replace(/\s+/g, " ").trim();

    if (!resumeText) {
      fs.unlinkSync(filepath);
      return res
        .status(422)
        .json({ message: "Could not extract text from PDF" });
    }

    const messages = [
      {
        role: "system",
        content:
          'Extract structured data from resume. Return strictly JSON: ' +
          '{"role": "string", "experience": "string", "projects": ["project1"], "skills": ["skill1"]}. ' +
          'Rules: "role" is a job title under 100 characters. "experience" is a short phrase such as ' +
          '"2 years" or "Fresher", under 100 characters - not a description. "projects" and "skills" ' +
          'are each at most 15 of the most relevant entries, every entry a string under 100 characters.',
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi(messages);
    const cleaned = aiResponse
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    fs.unlinkSync(filepath);

    // The model does not reliably honour the limits above (a real resume yields
    // ~30 skills), so enforce the contract here rather than letting
    // generate-question reject the payload we just handed the client.
    return res.status(200).json({
      role: toCleanText(parsed.role),
      experience: toCleanText(parsed.experience),
      projects: toCleanList(parsed.projects),
      skills: toCleanList(parsed.skills),
      resumeText,
    });
  } catch (error) {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    console.error(
      "Resume analysis error:",
      error.response?.data || error.stack || error.message,
    );

    // A file we cannot parse is a bad request, not a server fault.
    if (error?.name === "InvalidPDFException" || /Invalid PDF/i.test(error.message || "")) {
      return res.status(422).json({ message: "Could not read the PDF. Please upload a valid PDF resume." });
    }

    // Out of AI quota is not a server fault and is actionable by the operator.
    if (error?.status === 429) {
      return res.status(429).json({
        message: "AI quota exceeded. Please try again later.",
        ...(process.env.NODE_ENV !== "production" && { error: error.upstreamMessage }),
      });
    }

    // Upstream AI failures (and unparseable AI output) are not our fault: 502.
    const isUpstream =
      error instanceof SyntaxError || /API Error|empty response/i.test(error.message || "");
    const status = isUpstream ? 502 : 500;
    const message = isUpstream
      ? "Resume analysis service is unavailable. Please try again."
      : "Failed to analyze resume";

    return res.status(status).json({
      message,
      // Never leak stack traces, keys or resume contents to clients in production.
      ...(process.env.NODE_ENV !== "production" && {
        error: error.upstreamMessage || error.message,
      }),
    });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    const { role: rawRole, experience: rawExperience, mode: rawMode, projects, skills, resumeText } = req.body;

    const role = typeof rawRole === "string" ? rawRole.trim() : "";
    const experience = typeof rawExperience === "string" ? rawExperience.trim() : "";
    const mode = typeof rawMode === "string" ? rawMode.trim() : "";

    if (!role || role.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: "Role is required and must be under 100 characters." });
    }
    if (!experience || experience.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: "Experience is required and must be under 100 characters." });
    }
    const allowedModes = ["Technical", "Behavioral", "System Design", "HR", "SystemDesign"];
    if (!mode || !allowedModes.includes(mode)) {
      return res.status(400).json({ message: "Invalid or missing interview mode." });
    }

    if (projects !== undefined && (!Array.isArray(projects) || projects.length > MAX_LIST_ITEMS || projects.some(p => typeof p !== "string" || p.length > MAX_TEXT_LENGTH))) {
      return res.status(400).json({ message: "Projects must be an array of up to 15 strings (max 100 chars each)." });
    }
    if (skills !== undefined && (!Array.isArray(skills) || skills.length > MAX_LIST_ITEMS || skills.some(s => typeof s !== "string" || s.length > MAX_TEXT_LENGTH))) {
      return res.status(400).json({ message: "Skills must be an array of up to 15 strings (max 100 chars each)." });
    }
    if (resumeText !== undefined && (typeof resumeText !== "string" || resumeText.length > 100000)) {
      return res.status(400).json({ message: "Resume text must be a string under 100k characters." });
    }

    // Map mode to valid DB enum values
    let dbMode = mode;
    if (mode === "Behavioral") dbMode = "HR";
    if (mode === "System Design") dbMode = "SystemDesign";

    // PERFORMANCE OPTIMIZATION: Check credits using a fast, read-only lean query
    // before calling the expensive AI service. This avoids fetching and hydrating
    // unused fields, saving database bandwidth and server memory, and avoids
    // AI calls for users with insufficient credits.
    const userPreCheck = await User.findById(req.userId).select("credits isActive").lean();
    if (!userPreCheck) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userPreCheck.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }
    if (userPreCheck.credits < 50) {
      return res
        .status(400)
        .json({ message: "Not enough credits. Minimum 50 required" });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(",") : "None";
    const skillText =
      Array.isArray(skills) && skills.length ? skills.join(",") : "None";
    const sefeResume = resumeText?.trim() || "None";

    const userPrompt = `
    Role:${role}
    Experience:${experience}
    InterviewMode:${mode}
    Projects:${projectText}
    Skills:${skillText}
    Resume:${resumeText}`;

    if (!userPrompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }
    const messages = [
      {
        role: "system",
        content: `You are a real human interview conducting a professional interview.
                  speak in simple natural English as if you are directly talking to the candidate.
                  Generate EXACTLY 5 interview questions strictly in this mode: ${mode}.
                  strict rules:
                  Generate exactly 5 interview questions.
                  Strict Rules:
                  Each question must contain between 15 and 25 words.
                  Each question must be a single complete sentence.
                  Do NOT number them.
                  Do NOT add explanations.
                  Do NOT add extra text before or after.
                  One question per line only.
                  Keep language simple and conversational.
                  Questions must feel practical and realistic.

                  Difficulty progression
                  Question 1 - easy
                  Question 2 - easy
                  Question 3 - medium
                  Question 4 - medium
                  Question 5 - hard

                  Mode-specific focus:
                  - "Technical": core language/framework/DSA/system implementation questions relevant to the role and the candidate's listed skills
                  - "Behavioral": STAR-format situational questions probing collaboration, conflict, ownership, and past project decisions — reference specific projects from the candidate's resume where possible
                  - "System Design": architecture, scalability, trade-off, and design-decision questions scoped to the candidate's experience level
                  Calibration rules:
                  - Difficulty must match the stated experience level (${experience}). Junior/fresher-level experience gets fundamentals and guided-depth questions. Senior-level experience gets trade-off, scale, and ambiguous open-ended questions.
                  - At least 2 of the 5 questions must directly reference the candidate's actual projects or skills (use specifics from Projects/Skills/Resume below, not generic phrasing).
                  - Do not repeat the same underlying concept twice across the 5 questions.
                  - Questions must be answerable in a spoken interview (no multi-part essay prompts, no take-home-style tasks).
                  - Do not include answers, hints, or explanations — questions only.
                  Return STRICTLY valid JSON, no markdown, no code fences, no prose before or after:
                  {"questions": ["question1", "question2", "question3", "question4", "question5"]}`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res
        .status(500)
        .json({ message: "Failed to generate questions from AI" });
    }
    // The prompt asks for {"questions": [...]}, so parse it as JSON. Splitting on
    // newlines turned the JSON envelope itself into questions ("{", "\"questions\": [").
    const cleanedResponse = aiResponse
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let rawQuestions;
    try {
      const parsed = JSON.parse(cleanedResponse);
      rawQuestions = Array.isArray(parsed) ? parsed : parsed?.questions;
    } catch {
      // Model ignored the JSON instruction: fall back to one question per line.
      rawQuestions = cleanedResponse.split("\n");
    }

    const questionsArray = (Array.isArray(rawQuestions) ? rawQuestions : [])
      .filter((q) => typeof q === "string")
      .map((q) => q.trim())
      .filter((q) => q.length)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res.status(500).json({ message: "Failed to generate questions" });
    }

    // PERFORMANCE OPTIMIZATION: State-changing DB operation (credit deduction) performed atomically.
    // Uses findOneAndUpdate with $inc and .lean() to prevent concurrent update race conditions (double-spending)
    // and completely bypass Mongoose model hydration and save/validation hooks overhead.
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId, credits: { $gte: 50 } },
      { $inc: { credits: -50 } },
      { new: true, select: "_id name email credits", lean: true }
    );

    if (!updatedUser) {
      const userExists = await User.findById(req.userId).select("_id").lean();
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }
      return res
        .status(400)
        .json({ message: "Not enough credits. Minimum 50 required" });
    }

    const interview = await Interview.create({
      userId: updatedUser._id,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
      role,
      experience,
      mode: dbMode,
      projects,
      skills,
      resumeText: sefeResume,
    });

    res.json({
      interviewId: interview._id,
      questions: interview.questions,
      userName: updatedUser.name,
      creditLeft: updatedUser.credits,
    });
  } catch (error) {
    console.error("Generate question error:", error);
    return res.status(500).json({ message: "Failed to generate questions" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("isActive").lean();
    if (user && user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }

    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview ID format." });
    }

    const interview = await Interview.findById(interviewId).select("-resumeText").lean();

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    if (
      questionIndex === undefined ||
      typeof questionIndex !== "number" ||
      !Number.isInteger(questionIndex) ||
      questionIndex < 0 || questionIndex >= interview.questions.length
    ) {
      return res.status(400).json({ message: "Invalid question index." });
    }

    if (timeTaken !== undefined && (typeof timeTaken !== "number" || timeTaken < 0)) {
      return res.status(400).json({ message: "Invalid time taken." });
    }

    if (answer !== undefined && typeof answer !== "string") {
      return res.status(400).json({ message: "Answer must be a string." });
    }

    if (answer !== undefined && answer.length > 5000) {
      return res.status(400).json({ message: "Answer must be a string under 5000 characters." });
    }

    const question = interview.questions[questionIndex];

    if (!answer) {
      // PERFORMANCE OPTIMIZATION: Use high-performance positional atomic updates
      // instead of hydrated save to skip Mongoose's full array tracking and validations.
      const updateQuery = {};
      updateQuery[`questions.${questionIndex}.score`] = 0;
      updateQuery[`questions.${questionIndex}.feedback`] = "No answer provided";
      updateQuery[`questions.${questionIndex}.answer`] = "";

      await Interview.updateOne({ _id: interviewId }, { $set: updateQuery });
      return res.json({ feedback: "No answer provided", score: 0 });
    }

    if (timeTaken > question.timeLimit) {
      // PERFORMANCE OPTIMIZATION: Use high-performance positional atomic updates
      // instead of hydrated save to skip Mongoose's full array tracking and validations.
      const updateQuery = {};
      updateQuery[`questions.${questionIndex}.score`] = 0;
      updateQuery[`questions.${questionIndex}.feedback`] = "Time limit exceeded";
      updateQuery[`questions.${questionIndex}.answer`] = answer;

      await Interview.updateOne({ _id: interviewId }, { $set: updateQuery });
      return res.json({ feedback: "Time limit exceeded", score: 0 });
    }

    const message = [
      {
        role: "system",
        content: `You are a professional interviewer evaluating a candidate's answer in a real interview.

                  Evaluate naturally and fairly, like a real person would.

                  Score the answer in these areas (0 to 10):

                  1. Confidence – Does the answer sound clear, confident, and well-presented?
                  2. Communication – Is the language simple, clear, and easy to understand?
                  3. Correctness – Is the answer accurate, relevant, and complete?

                  Rules:
                  - Be realistic and unbiased.
                  - Do not give random high scores.
                  - If the answer is weak, score low.
                  - If the answer is strong and detailed, score high.
                  - Consider clarity, structure, and relevance.

                  Calculate:
                  finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

                  Feedback Rules:
                  - Write natural human feedback.
                  - 10 to 15 words only.
                  - Sound like real interview feedback.
                  - Can suggest improvement if needed.
                  - Do NOT repeat the question.
                  - Do NOT explain scoring.
                  - Keep tone professional and honest.

                  Return ONLY valid JSON in this format:

                  {
                    "confidence": number,
                    "communication": number,
                    "correctness": number,
                    "finalScore": number,
                    "feedback": "short human feedback"
                  }`,
      },
      {
        role: "user",
        content: `
        Question:${question.question}
        Answer:${answer}
        `,
      },
    ];
    const aiResponse = await askAi(message);
    let parsedResponse;
    try {
      // Clean possible Markdown JSON code block fences
      const cleaned = aiResponse
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      parsedResponse = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("AI Evaluation JSON parse error:", parseErr, "Response was:", aiResponse);
      return res.status(500).json({ message: "Failed to parse evaluation from AI." });
    }

    if (!parsedResponse || typeof parsedResponse !== "object") {
      return res.status(500).json({ message: "Invalid evaluation response from AI." });
    }

    // Securely validate and clamp scores to ensure they are safe numbers within 0-10
    const sanitizeScore = (val) => {
      const num = Number(val);
      if (isNaN(num)) return 0;
      return Math.max(0, Math.min(10, Math.round(num)));
    };

    const confidence = sanitizeScore(parsedResponse.confidence);
    const communication = sanitizeScore(parsedResponse.communication);
    const correctness = sanitizeScore(parsedResponse.correctness);
    const score = sanitizeScore(parsedResponse.finalScore);

    // Sanitize feedback to prevent stored XSS attacks and limit to 500 characters
    const rawFeedback = typeof parsedResponse.feedback === "string" ? parsedResponse.feedback : "";
    const feedback = rawFeedback.substring(0, 500).replace(/[<>]/g, "");

    // PERFORMANCE OPTIMIZATION: Use high-performance positional atomic updates
    // instead of hydrated save to skip Mongoose's full array tracking and validations.
    const updateQuery = {};
    updateQuery[`questions.${questionIndex}.confidence`] = confidence;
    updateQuery[`questions.${questionIndex}.communication`] = communication;
    updateQuery[`questions.${questionIndex}.correctness`] = correctness;
    updateQuery[`questions.${questionIndex}.score`] = score;
    updateQuery[`questions.${questionIndex}.feedback`] = feedback;
    updateQuery[`questions.${questionIndex}.answer`] = answer;

    await Interview.updateOne({ _id: interviewId }, { $set: updateQuery });
    return res.status(200).json({ feedback, score });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to submit answer" });
  }
}

export const finishInterview = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("isActive").lean();
    if (user && user.isActive === false) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }

    const { interviewId } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview ID format." });
    }

    // PERFORMANCE OPTIMIZATION: Exclude 'resumeText' (which can be up to 100KB)
    // and use .lean() to completely bypass Mongoose document hydration overhead.
    const interview = await Interview.findById(interviewId).select("-resumeText").lean();
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const totalQuestion = interview.questions.length;
  
    let totalScore = 0;
    let totelConfidence = 0;
    let totelCommunication = 0;
    let totelCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totelConfidence += q.confidence || 0;
      totelCommunication += q.communication || 0;
      totelCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestion
          ? totalScore / totalQuestion
          : 0;
    const avgConfidence = totelConfidence
          ? totelConfidence / totalQuestion
          : 0;
    const avgCommunication = totelCommunication
          ? totelCommunication / totalQuestion
          : 0;
    const avgCorrectness = totelCorrectness
          ? totelCorrectness / totalQuestion
          : 0;
       
    // PERFORMANCE OPTIMIZATION: Persist updates atomically via updateOne to skip
    // full serialization and Mongoose document validation overhead.
    await Interview.updateOne(
      { _id: interviewId },
      { $set: { finalScore, status: "complete" } }
    );

    return res.status(200).json({ 
      finalScore: Number(finalScore).toFixed(1),
      confidence: Number(avgConfidence).toFixed(1),
      communication: Number(avgCommunication).toFixed(1),
      correctness: Number(avgCorrectness).toFixed(1),
      questionWiseScore: interview.questions.map(q => ({
        score: q.score,
        confidence: q.confidence,
        communication: q.communication,
        correctness: q.correctness,
        difficulty: q.difficulty
      })),
      totalQuestions: totalQuestion
    });
  } catch (error) {
    console.error("Finish interview error:", error);
    return res.status(500).json({ message: "Failed to finish interview" });
  }
};