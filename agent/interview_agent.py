import asyncio
import os
from dotenv import load_dotenv
from videosdk.agents import Agent, AgentSession, RoomOptions
from videosdk.plugins.google import GeminiRealtime

load_dotenv(dotenv_path="../.env")

ROOM_ID = os.getenv("NEXT_PUBLIC_VIDEOSDK_ROOM_ID")
AUTH_TOKEN = os.getenv("NEXT_PUBLIC_VIDEOSDK_TOKEN")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class InterviewAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="""You are a professional AI interviewer conducting 
            a real-time voice interview. Ask the interview questions one by one, 
            wait for the candidate's response, provide brief acknowledgment, 
            then move to the next question. Be professional, warm, and concise. 
            Keep responses short as this is a voice conversation.
            The questions will be provided at session start."""
        )

    async def on_enter(self):
        pass

    async def on_participant_joined(self, participant):
        await self.session.say("Hello! Welcome to your mock interview. I'll be your AI interviewer today. Are you ready to begin?")

    async def on_exit(self):
        pass

session = AgentSession(
    agent=InterviewAgent(),
    llm=GeminiRealtime(api_key=GOOGLE_API_KEY),
    room_options=RoomOptions(
        room_id=ROOM_ID,
        auth_token=AUTH_TOKEN,
        name="AI Interviewer"
    )
)

if __name__ == "__main__":
    asyncio.run(session.start())
