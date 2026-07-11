import axios from "axios";
export const askAi = async (messages) => {
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Message array is empty.");
    }
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      throw new Error("AI returned empty response");
    }
    return content;
  } catch (error) {
    if (error.message === "AI returned empty response") throw error;
    console.error("Groq Error:", error.response?.data || error.message);
    throw new Error("Groq API Error");
  }
};
