## 2025-05-15 - Insecure Cookie Configuration and Information Leakage

**Vulnerability:** The JWT authentication cookie was incorrectly configured with a typo (`http: true` instead of `httpOnly: true`) and was missing the `secure` flag. This left the token vulnerable to XSS and insecure transmission. Furthermore, the authentication middleware and controllers leaked detailed internal error messages and stack traces to the client.

**Learning:** Typographical errors in security configurations can silently disable critical browser-level protections. Standardizing error responses is essential to prevent information disclosure that could assist an attacker in reconnaissance.

**Prevention:** Always use `httpOnly`, `secure`, and `sameSite` attributes for sensitive cookies. Implement a centralized or standardized error handling pattern that logs details server-side but returns generic messages to the client.

## 2025-05-16 - Authentication Bypass via Client-Reported Identity

**Vulnerability:** The backend authentication endpoint (`/api/auth/google`) trusted user profile data (email, name) sent directly from the client without verification. This allowed an attacker to impersonate any user by providing their email address in the request body.

**Learning:** Client-side authentication (like Firebase on the frontend) is insufficient for securing backend resources. The backend must independently verify the user's identity using a cryptographically signed token (ID Token) provided by the authentication provider.

**Prevention:** Never trust identity claims sent from the frontend. Always require and verify an ID Token server-side using the appropriate Admin SDK. Use immutable identifiers like `firebaseUID` instead of potentially mutable ones like `email` for primary user mapping.
