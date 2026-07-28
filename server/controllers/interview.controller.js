import fs from "fs";
import mongoose from "mongoose";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

export const analyzeResume = async (req, res) => {
  const filepath = req.file?.path;

  try {
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
          'Extract structured data from resume. Return strictly JSON: {"role": "string", "experience": "string", "projects": ["project1", "project2"], "skills": ["skill1", "skill2"]}',
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

    return res.status(200).json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
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
    return res.status(500).json({ message: "Failed to analyze resume" });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    const { role: rawRole, experience: rawExperience, mode: rawMode, projects, skills, resumeText } = req.body;
    const role = typeof rawRole === "string" ? rawRole.trim() : "";
    const experience = typeof rawExperience === "string" ? rawExperience.trim() : "";
    const mode = typeof rawMode === "string" ? rawMode.trim() : "";

    if (!role || role.length > 100) {
      return res.status(400).json({ message: "Role is required and must be under 100 characters." });
    }
    if (!experience || experience.length > 100) {
      return res.status(400).json({ message: "Experience is required and must be under 100 characters." });
    }
    const allowedModes = ["Technical", "Behavioral", "System Design", "HR", "SystemDesign"];
    if (!mode || !allowedModes.includes(mode)) {
      return res.status(400).json({ message: "Invalid or missing interview mode." });
    }

    if (projects !== undefined && (!Array.isArray(projects) || projects.length > 15 || projects.some(p => typeof p !== "string" || p.length > 100))) {
      return res.status(400).json({ message: "Projects must be an array of up to 15 strings (max 100 chars each)." });
    }
    if (skills !== undefined && (!Array.isArray(skills) || skills.length > 15 || skills.some(s => typeof s !== "string" || s.length > 100))) {
      return res.status(400).json({ message: "Skills must be an array of up to 15 strings (max 100 chars each)." });
    }
    if (resumeText !== undefined && (typeof resumeText !== "string" || resumeText.length > 100000)) {
      return res.status(400).json({ message: "Resume text must be a string under 100k characters." });
    }

    // Map mode to valid DB enum values
    let dbMode = mode;
    if (mode === "Behavioral") dbMode = "HR";
    if (mode === "System Design") dbMode = "SystemDesign";

    // PERFORMANCE OPTIMIZATION: Retrieve only required user fields (_id, name, email, credits)
    // with .lean() to avoid fetching and hydrating unused fields, saving database bandwidth and server memory.
    const user = await User.findById(req.userId).select("_id name email credits").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.credits < 50) {
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
    const questionsArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res.status(500).json({ message: "Failed to generate questions" });
    }

    // PERFORMANCE OPTIMIZATION: Perform an atomic credit update on the plain DB document to prevent
    // race conditions, avoid document save/hooks overhead, and use .lean() to bypass hydration.
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId, credits: { $gte: 50 } },
      { $inc: { credits: -50 } },
      { new: true, select: "credits" }
    ).lean();

    if (!updatedUser) {
      return res
        .status(400)
        .json({ message: "Not enough credits. Minimum 50 required" });
    }

    const interview = await Interview.create({
      userId: user._id,
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
      userName: user.name,
      creditLeft: updatedUser.credits,
    });
  } catch (error) {
    console.error("Generate question error:", error);
    return res.status(500).json({ message: "Failed to generate questions" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview ID format." });
    }

    if (
      questionIndex === undefined ||
      typeof questionIndex !== "number" ||
      !Number.isInteger(questionIndex) ||
      questionIndex < 0
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

    // PERFORMANCE OPTIMIZATION: Use .select("userId questions").lean() to bypass document hydration,
    // saving considerable CPU/memory. Exclude heavy fields like 'resumeText' (which can be up to 100KB).
    const interview = await Interview.findById(interviewId).select("userId questions").lean();

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    if (questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: "Invalid question index." });
    }

    const question = interview.questions[questionIndex];

    if (!answer) {
      // PERFORMANCE OPTIMIZATION: Perform a direct atomic update using updateOne
      // instead of hydrated .save(), saving document overhead and bypassing change-tracking.
      await Interview.updateOne(
        { _id: interviewId },
        {
          $set: {
            [`questions.${questionIndex}.score`]: 0,
            [`questions.${questionIndex}.feedback`]: "No answer provided",
            [`questions.${questionIndex}.answer`]: "",
          }
        }
      );
      return res.json({ feedback: "No answer provided", score: 0 });
    }

    if (timeTaken > question.timeLimit) {
      // PERFORMANCE OPTIMIZATION: Perform a direct atomic update using updateOne.
      await Interview.updateOne(
        { _id: interviewId },
        {
          $set: {
            [`questions.${questionIndex}.score`]: 0,
            [`questions.${questionIndex}.feedback`]: "Time limit exceeded",
            [`questions.${questionIndex}.answer`]: answer,
          }
        }
      );
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

    // PERFORMANCE OPTIMIZATION: Perform a direct atomic update using updateOne
    // instead of hydrated .save(), saving document overhead, bypassing change-tracking.
    await Interview.updateOne(
      { _id: interviewId },
      {
        $set: {
          [`questions.${questionIndex}.confidence`]: confidence,
          [`questions.${questionIndex}.communication`]: communication,
          [`questions.${questionIndex}.correctness`]: correctness,
          [`questions.${questionIndex}.score`]: score,
          [`questions.${questionIndex}.feedback`]: feedback,
          [`questions.${questionIndex}.answer`]: answer,
        }
      }
    );

    return res.status(200).json({ feedback, score });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to submit answer" });
  }
}

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview ID format." });
    }

    // PERFORMANCE OPTIMIZATION: Retrieve only the required 'userId' and 'questions' fields as a plain,
    // lean object. This completely bypasses Mongoose model hydration, subdocument instantiation, and memory overhead.
    const interview = await Interview.findById(interviewId).select("userId questions").lean();
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    const totalQuestion = interview.questions.length;
   
   let totalScore = 0;
   let totelConfidence=0;
   let totelCommunication=0;
   let totelCorrectness=0;

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
        
    // PERFORMANCE OPTIMIZATION: Perform a direct update via updateOne to write only modified fields.
    // This avoids fully serializing, validating, and saving the entire heavy document back to the DB.
    await Interview.updateOne(
      { _id: interviewId },
      { $set: { finalScore, status: "completed" } }
    );

    return res.status(200).json({ 
      finalScore: Number(finalScore).toFixed(1),
      confidence: Number(avgConfidence).toFixed(1),
      communication: Number(avgCommunication).toFixed(1),
      correctness: Number(avgCorrectness).toFixed(1),
      questionWiseScore: interview.questions.map((q)=>{
        return {
          question: q.question,
          score: q.score || 0,
          confidence: q.confidence || 0,
          communication: q.communication || 0,
          correctness: q.correctness || 0,
          feedback: q.feedback || "",
        }
      })
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to finish interview" });
  }
}
