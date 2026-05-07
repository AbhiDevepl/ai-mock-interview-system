## 2025-05-14 - Insecure Cookies and Information Leakage

**Vulnerability:**
1. The `token` cookie was being set with `http: true` instead of `httpOnly: true`, making it accessible to client-side scripts and vulnerable to XSS.
2. Error handlers were returning raw error messages and stack traces to the client, potentially leaking sensitive system information.
3. `googleAuth` was trusting client-provided email/name without server-side verification of a Firebase ID token (despite `AuthFlow.md` claiming this was fixed).

**Learning:**
A typo in cookie options (`http` instead of `httpOnly`) can silently disable a critical security feature.
Also, `AuthFlow.md` in this repo seems to describe a state that doesn't exist in the current codebase, which is misleading.

**Prevention:**
Always use `httpOnly: true` for sensitive cookies.
Use generic error messages for the client and log specific errors to the server console.
Verify third-party auth tokens (like Firebase ID tokens) on the backend.
