import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionIndex, question, answer } = body;

    if (!sessionId || questionIndex === undefined || !question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: session } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const prompt = `You are a professional job interviewer evaluating a candidate's response.
Role: ${session.role}
Level: ${session.level}
Tech Stack: ${session.techstack?.join(", ") || "General"}
Question: ${question}
Answer: ${answer}

Evaluate the answer and provide:
1. A score from 0-100
2. Brief feedback on the answer
3. Key strengths in the response
4. Areas for improvement

Format your response as JSON:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "areasForImprovement": ["string"]
}`;

    const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error("Failed to evaluate with Gemini");
    }

    const geminiData = await geminiResponse.json();
    const evaluationText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let evaluation;
    try {
      evaluation = JSON.parse(evaluationText || "{}");
    } catch {
      evaluation = {
        score: 50,
        feedback: evaluationText || "Could not evaluate response",
        strengths: [],
        areasForImprovement: []
      };
    }

    const { data, error } = await supabase
      .from("interview_responses")
      .insert({
        session_id: sessionId,
        question_index: questionIndex,
        question,
        answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving response:", error);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...data,
      evaluation
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
