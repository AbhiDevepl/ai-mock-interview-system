## 2026-06-25 - [HIGH] Insecure Direct Object Reference (IDOR) in Interview Endpoints
**Vulnerability:** The `/api/interview/submit-answer` and `/api/interview/finish` endpoints lacked ownership checks, allowing any authenticated user to modify or finalize another user's interview session by providing its ID.
**Learning:** Middleware-level authentication (`isAuth`) only verifies that a user is logged in, but does not guarantee they have permission to access specific resources (authorization).
**Prevention:** Always verify that the resource being accessed or modified belongs to the authenticated user (`req.userId`) by comparing it with the resource's owner field in the database.

## 2026-06-25 - [HIGH] Identity Spoofing and Deactivation Bypass in Google Auth
**Vulnerability:** The `googleAuth` controller trusted user-provided `name` and `photo` from the request body instead of verified claims in the Firebase ID token. Additionally, it automatically reactivated deactivated accounts upon login.
**Learning:** External authentication providers (like Firebase) provide verified identity claims that must be used as the source of truth. Trusting the client-side for profile data allows identity spoofing. Furthermore, session management must explicitly respect administrative deactivation flags.
**Prevention:** Always source user metadata from verified authentication token claims. Ensure that account status checks (e.g., `isActive`) are performed during the login process and that deactivation cannot be bypassed by simply re-authenticating.

## 2026-07-16 - [MEDIUM] Denial of Service (DoS) and Resource Exhaustion on AI Endpoints
**Vulnerability:** Expensive AI-powered endpoints (resume analysis and question generation) were not rate-limited, allowing a single user or bot to exhaust API credits and server resources.
**Learning:** High-cost operations (AI, PDF processing) are primary targets for DoS attacks. Relying solely on credit-based limiting is insufficient if the limiting itself can be bypassed or hammered.
**Prevention:** Implement global and endpoint-specific rate limiting (e.g., using `express-rate-limit`) to throttle requests before they hit expensive logic. Use `trust proxy` when behind a reverse proxy to ensure accurate IP-based limiting.
