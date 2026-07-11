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
    const parsed = JSON.parse(aiResponse);

    fs.unlinkSync(filepath);

    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText,
    });

    return res.status(200).json(parsed);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error(
      "Resume analysis error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: "Failed to analyze resume" });
  } finally {
    if (filepath) fs.promises.unlink(filepath).catch(() => {});
  }
};
