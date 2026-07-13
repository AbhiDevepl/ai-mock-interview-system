import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";

export const analyzeResume = async (req, res) => {
  const filepath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }

    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }
    resumeText = resumeText.replace(/\s+/g, " ").trim();

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
    const {role, experience, mode, projects, skills, resumeText} = req.body;
    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();
    if (!role || !experience || !mode){
      return res.status(400).json({ message: "Role, Experience and Mode are required" });
    }
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.credits < 50){
      return res.status(400).json({ message: "Not enough credits. Minimum 50 required" });
    }
    const projectText = Array.isArray(projects) && projects.length
    ? projects.join(",")
        :"None";
    const skillText = Array.isArray(skills) && skills.length
    ? skills.join(",")
        : "None";
    const sefeResume = resumeText?.trim() || "None"

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
    const messages=[
      {
        role: "system",
        content: ``
      }
    ]

  }catch (error) {

  }
}