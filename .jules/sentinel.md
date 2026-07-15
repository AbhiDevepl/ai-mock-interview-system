## 2026-06-25 - [HIGH] Insecure Direct Object Reference (IDOR) in Interview Endpoints
**Vulnerability:** The `/api/interview/submit-answer` and `/api/interview/finish` endpoints lacked ownership checks, allowing any authenticated user to modify or finalize another user's interview session by providing its ID.
**Learning:** Middleware-level authentication (`isAuth`) only verifies that a user is logged in, but does not guarantee they have permission to access specific resources (authorization).
**Prevention:** Always verify that the resource being accessed or modified belongs to the authenticated user (`req.userId`) by comparing it with the resource's owner field in the database.

## 2026-06-25 - [HIGH] Identity Spoofing and Deactivation Bypass in Google Auth
**Vulnerability:** The `googleAuth` controller trusted user-provided `name` and `photo` from the request body instead of verified claims in the Firebase ID token. Additionally, it automatically reactivated deactivated accounts upon login.
**Learning:** External authentication providers (like Firebase) provide verified identity claims that must be used as the source of truth. Trusting the client-side for profile data allows identity spoofing. Furthermore, session management must explicitly respect administrative deactivation flags.
**Prevention:** Always source user metadata from verified authentication token claims. Ensure that account status checks (e.g., `isActive`) are performed during the login process and that deactivation cannot be bypassed by simply re-authenticating.
