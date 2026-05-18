## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-16 - Authentication Bypass via Client-Side Identity Trust

**Vulnerability:** The backend `googleAuth` route trusted user identity information (name, email) sent directly from the client without verification. This allowed any user to log in as any other user by simply providing their email address in the request body.

**Learning:** Trusting identity data from the client without server-side verification by an authoritative source (like Firebase Admin SDK) is a critical security failure. It allows for trivial account takeover and identity spoofing.

**Prevention:** Never trust identity metadata from the client. Always use a secure, cryptographically signed token (like a Firebase ID token) and verify it on the server using an official SDK before establishing a session or granting access.
