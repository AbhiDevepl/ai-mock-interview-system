# Replace VAPI with VideoSDK + Google Gemini Live

The goal is to replace the current VAPI implementation with a new architecture using VideoSDK and Google's Gemini Live AI.

## Proposed Changes

### Configuration
#### [MODIFY] .env.local
#### [NEW] .env
Add `VIDEOSDK_AUTH_TOKEN`, `VIDEOSDK_ROOM_ID`, and `GOOGLE_API_KEY`.

### Dependencies
#### [MODIFY] package.json
Install `@videosdk.live/react-sdk`.

### Backend (Python Agent)
#### [NEW] agent/requirements.txt
Add `videosdk-agents`, `videosdk-plugins-google`, `python-dotenv`.
#### [NEW] agent/run.sh
Startup script for the agent.
#### [NEW] agent/interview_agent.py
Implement `InterviewAgent` using `videosdk.agents` and `GeminiLiveSession`.

### Next.js API Routes
#### [NEW] app/api/interview/room/route.ts
POST endpoint to create a VideoSDK room and return the `roomId` and `token`.

### Frontend Components & Types
#### [DELETE] lib/vapi.sdk.ts
#### [DELETE] types/vapi.d.ts
#### [NEW] types/voice.d.ts
Rename types and adjust for the new VideoSDK integration.
#### [MODIFY] components/Agent.tsx
Rewrite using `@videosdk.live/react-sdk` hooks (`MeetingProvider`, `useMeeting`, `useParticipant`).
Retain existing CSS classes and error handling with `sonner`.

## Verification Plan
1. Run `pip install -r agent/requirements.txt` and `npm install @videosdk.live/react-sdk`.
2. Start the Python agent: `cd agent && bash run.sh`.
3. Run the Next.js development server: `npm run dev`.
4. Verify that navigating to `/interview` and clicking "Call" successfully connects the frontend to the same Room ID as the Python agent.
