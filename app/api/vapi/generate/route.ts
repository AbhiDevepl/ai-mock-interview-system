import { getRandomInterviewCover } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, type, techstack, level, amount } = body;

    // 1. Try to get user from session (for browser calls)
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. Use session data OR fallback to body data (for Postman testing)
    const finalUserId = user?.id || body.userid;
    const finalName = body.name || "Guest";
    const finalEmail = body.email || "guest@example.com";

    // If still no user ID, then it's truly unauthorized
    if (!finalUserId) {
      return Response.json(
        { success: false, error: "Unauthorized: No UserID provided" },
        { status: 401 }
      );
    }

    console.log("Processing for:", { finalUserId, finalName, finalEmail });

    const { text: questions } = await generateText({
      model: google("gemini-flash-001"),
      prompt: `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Please return only the questions, without any additional text.
Return format:
["Question 1", "Question 2", "Question 3"]`,
    });

    // Handle potential Markdown formatting from AI
    const cleanedQuestions = questions.replace(/```json|```/g, "").trim();

    const interviewData = {
      role: role || "General",
      type: type || "Mixed",
      level: level || "Junior",
      techstack: techstack
        ? techstack.split(",").map((t: string) => t.trim())
        : [],
      questions: JSON.parse(cleanedQuestions),
      finalized: true,
      user_id: finalUserId,
      user_name: finalName,
      user_email: finalEmail,
      cover_image: getRandomInterviewCover(),
    };

    const { error: dbError } = await supabase
      .from("interviews")
      .insert(interviewData);

    if (dbError) {
      console.error("Database error:", dbError);
      return Response.json(
        { success: false, error: dbError.message },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, data: "Interview saved!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
