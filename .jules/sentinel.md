## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2026-05-17 - Critical Authentication Bypass via Unverified Identity Claims

**Vulnerability:** The backend `googleAuth` endpoint trusted identity information (email, name) provided directly in the request body from the frontend. An attacker could easily spoof any user's identity by sending a request with their email address, completely bypassing the Firebase authentication layer.

**Learning:** Frontend authentication status is only for UI/UX purposes. The server must never trust identity claims from the client without cryptographic verification. A "successful" login on the frontend only means the user proved their identity to the provider, not to your server.

**Prevention:** Always require and verify a server-side proof of identity, such as a Firebase ID Token, using the official `firebase-admin` SDK. Extract identity data (UID, email) only from the verified token payload.
