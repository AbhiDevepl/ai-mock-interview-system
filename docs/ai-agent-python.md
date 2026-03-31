**Summary**
Root Cause:  
AgentSession.__init__() no longer accepts llm or room_options parameters. The API changed to require Pipeline objects and JobContext/WorkerJob for lifecycle management.
Key Changes:
OLD (broken)
llm=GeminiRealtime(...) passed to AgentSession
room_options passed to AgentSession
asyncio.run(session.start())
Module-level session creation
Architecture Flow:
GeminiRealtime → RealTimePipeline → AgentSession → WorkerJob → JobContext → RoomOptions
To run:
python interview_agent.py
# or for console testing:
python interview_agent.py console