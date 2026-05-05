## 2025-05-14 - Insecure Authentication Cookies and Information Leakage

**Vulnerability:**
1. The `googleAuth` controller used an invalid cookie option `http: true` instead of `httpOnly: true`, leaving the JWT token accessible to client-side scripts (XSS risk).
2. Authentication middleware and controllers were leaking internal error details and stack traces to the client in the 500 error responses.
3. Lack of input validation on `req.body.email` in `googleAuth` could potentially lead to NoSQL injection.

**Learning:**
Simple typos in security configurations (like `http` vs `httpOnly`) can completely negate intended security controls. Also, default error handling often favors developer convenience over security, leading to information disclosure.

**Prevention:**
Always use `httpOnly: true` for sensitive cookies. Implement a generic error handling strategy for production that logs details server-side but returns opaque messages to the client. Use validation libraries or strict type checking for all user-provided input used in database queries.
