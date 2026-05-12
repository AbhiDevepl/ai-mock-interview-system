## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable website-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-15 - Authentication Bypass via Client-Side Identity Trust

**Vulnerability:** The backend `googleAuth` controller trusted `email` and `name` fields sent directly from the client without verification. An attacker could spoof any user's email address in the request body to gain unauthorized access to their account.

**Learning:** Never trust identity assertions from the client. Always use a server-side verification mechanism (like Firebase Admin SDK to verify `idToken`) to confirm the user's identity with the authentication provider.

**Prevention:** Implement server-side token verification for all authentication flows. The backend should receive an integrity-protected token (JWT/IdToken), verify its signature and claims, and only then proceed with user session creation.
