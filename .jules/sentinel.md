## 2026-06-25 - [HIGH] Insecure Direct Object Reference (IDOR) in Interview Endpoints
**Vulnerability:** The `/api/interview/submit-answer` and `/api/interview/finish` endpoints lacked ownership checks, allowing any authenticated user to modify or finalize another user's interview session by providing its ID.
**Learning:** Middleware-level authentication (`isAuth`) only verifies that a user is logged in, but does not guarantee they have permission to access specific resources (authorization).
**Prevention:** Always verify that the resource being accessed or modified belongs to the authenticated user (`req.userId`) by comparing it with the resource's owner field in the database.
