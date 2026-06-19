## 2026-06-03 - [Harden Authentication and Session Management]
**Vulnerability:** Potential account spoofing via unverified emails and XSS-vulnerable device identifiers.
**Learning:** The Google OAuth flow accepted any email from the Firebase token without checking if it was verified, and the `deviceId` cookie was explicitly exposed to client-side scripts.
**Prevention:** Always verify the `email_verified` claim when using external identity providers and enforce `httpOnly` flags on all session-related cookies to prevent XSS exfiltration.
