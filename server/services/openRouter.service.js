import axios from "axios";

// Free-tier daily quotas differ sharply per model (gemini-3.6-flash allows only
// 20 requests/day, which this project exhausts immediately). The lite model has a
// far larger free quota and answers in ~1s, which is plenty for extraction and
// feedback. Swappable without a code change.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export const askAi = async (messages) => {
  try {
    if (
      !messages ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      throw new Error("Message array is empty.");
    }

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: String(message.content || ""),
        },
      ],
    }));

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        contents,
        // gemini-3.x thinks by default, which pushed extraction latency past the
        // request timeout. Low thinking is plenty for extraction/feedback prompts.
        // ponytail: raise to "high" if answer quality regresses.
        generationConfig: { thinkingConfig: { thinkingLevel: "low" } },
      },
      {
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json",
        },

        // Bound the external request to prevent hanging requests. A full resume
        // extraction measures ~11s, so 15s raced the model and failed intermittently.
        timeout: 45000,
      }
    );

    // Gemini can split one answer across several parts (and interleave thought
    // parts), so reading parts[0] alone truncates the response mid-JSON.
    const content = (response?.data?.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text)
      .join("");

    if (!content || !content.trim()) {
      throw new Error("AI returned empty response");
    }

    return content;
  } catch (error) {
    if (
      error.message === "AI returned empty response" ||
      error.message === "Message array is empty."
    ) {
      throw error;
    }

    const status = error.response?.status;
    const upstream = error.response?.data?.error?.message || error.message;

    console.error(`Gemini Error (model=${MODEL}, status=${status ?? "n/a"}):`, upstream);

    // Keep the upstream status/reason on the error so callers can map it to a
    // meaningful HTTP response instead of a blanket 502.
    const err = new Error("Gemini API Error");
    err.status = status;
    err.upstreamMessage = upstream;
    throw err;
  }
};