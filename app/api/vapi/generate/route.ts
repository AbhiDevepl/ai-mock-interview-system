import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { createClient, createAdminClient } from "@/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, type, techstack, level, amount } = body;

    // Validate required interview metadata
    if (!role || !type || !techstack || !level || !amount) {
      return Response.json(
        {
          success: false,
          error:
            "Missing required interview parameters (role, type, techstack, level, or amount)",
        },
        { status: 400 }
      );
    }

    // 1. Get database clients
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const admin = createAdminClient();

    // 2. Get User ID from session or body
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const finalUserId = user?.id || body.userid;

    if (!finalUserId) {
      return Response.json(
        { success: false, error: "Unauthorized: No UserID provided" },
        { status: 401 }
      );
    }

    // 3. Fetch user profile from database ONLY
    // We use the admin client to ensure we can read the profile even if no session exists (Postman)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", finalUserId)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      return Response.json(
        {
          success: false,
          error:
            "User profile not found in database. Please ensure you are registered.",
        },
        { status: 404 }
      );
    }

    const { full_name: finalName, email: finalEmail } = profile;

    console.log("Processing for:", { finalUserId, finalName, finalEmail });

    const { text: questions } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    // Handle potential Markdown formatting from AI
    const cleanedQuestions = questions.replace(/```json|```/g, "").trim();

    const interviewData = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((t: string) => t.trim()),
      questions: JSON.parse(cleanedQuestions),
      finalized: true,
      user_id: finalUserId,
      user_name: finalName,
      user_email: finalEmail,
      cover_image: getRandomInterviewCover(),
    };

    // Use admin client for insertion to ensure it bypasses RLS if needed
    const { error: dbError } = await admin
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
      { success: true, data: "Interview saved!", questions: JSON.parse(cleanedQuestions)},
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

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
