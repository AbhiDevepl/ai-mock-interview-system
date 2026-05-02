## 2026-05-02 - [Insecure Cookie Config and Information Leakage]
**Vulnerability:** Insecure cookie configuration due to a typo (`http: true` instead of `httpOnly: true`) and lack of `secure` flag in production. Additionally, multiple endpoints were leaking internal error details and stack traces in API responses.
**Learning:** Typos in security configurations can silently disable critical protections like `httpOnly`. Verbose error messages in catch blocks can inadvertently expose system internals.
**Prevention:** Use a standard security configuration object for cookies. Implement a global error handler or a utility function to sanitize error responses before sending them to the client. Always use `httpOnly: true` and `secure: process.env.NODE_ENV === 'production'` for session cookies.
