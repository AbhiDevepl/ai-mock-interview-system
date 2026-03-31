The files I edited (create-room/route.ts and videosdk.service.ts) don't have new errors. The lint passed for my changes.
Let me summarize what I fixed:
Lint passes for the files I edited. Pre-existing errors in other files are unrelated.
---
Summary
Issue	Location	Fix
Authorization: token	route.ts:30	Changed to Authorization: \${token}``
allow_mod	route.ts:19	Changed to allow_modify
Unsafe JSON parsing	Both files	Added safeJson() helper
No debug logging	route.ts	Added console.log for response/room data
Generic error messages	Both files	Now includes response status and details
The key bugs were:
1. String literal instead of variable - Authorization: token sent literal text instead of the JWT
2. Wrong permission string - VideoSDK API expects allow_modify, not allow_mod