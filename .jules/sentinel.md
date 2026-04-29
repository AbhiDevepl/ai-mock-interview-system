# Sentinel's Journal - Critical Security Learnings

## 2025-05-14 - [Insecure Authentication Cookies & Information Leakage]
**Vulnerability:** Authentication cookies were missing `httpOnly` and `secure` flags (due to a typo `http: true`), and internal error messages were being leaked in API responses.
**Learning:** Even small typos in security configurations can leave the application vulnerable to XSS-based token theft. Additionally, verbose error messages in production can expose internal system details (e.g., stack traces, database errors) to attackers.
**Prevention:** Always use `httpOnly: true` and `secure: process.env.NODE_ENV === 'production'` for sensitive cookies. Standardize error handling to return generic messages to the client while logging detailed errors internally.
