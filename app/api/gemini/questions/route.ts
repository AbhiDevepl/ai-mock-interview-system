import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { env } from "@/lib/env";

interface GenerateQuestionsBody {
  role: string;
  level: string;
  techstack: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuestionsBody = await request.json();
    const { role, level, techstack } = body;

    if (!role || !level || !techstack?.length) {
      return NextResponse.json(
        { error: "role, level, and techstack are required" },
        { status: 400 }
      );
    }

    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const techList = techstack.join(", ");

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `You are an expert technical interviewer. Generate exactly 5 interview questions for a ${level}-level ${role} position.
The candidate has experience with: ${techList}.

Rules:
- Questions must be role-specific and progressively challenging
- Mix behavioral, technical, and situational questions
- Tailor depth to the ${level} experience level
- Keep each question concise (1-2 sentences max)
- Return ONLY a valid JSON array of 5 strings — no markdown, no explanation, no extra text

Example format:
["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]`,
    });

    // Parse and validate the response
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const questions: string[] = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format from Gemini");
    }

    return NextResponse.json({ questions: questions.slice(0, 5) });
  } catch (error) {
    console.error("[Gemini Questions] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
