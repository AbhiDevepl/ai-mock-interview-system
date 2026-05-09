# Sentinel's Journal - Critical Security Learnings

## 2025-05-14 - Insecure Cookie Configuration
**Vulnerability:** The authentication cookie was configured with `http: true` instead of `httpOnly: true` and `secure: false`.
**Learning:** A typo in the cookie option name (`http` instead of `httpOnly`) rendered the cookie accessible to client-side scripts, increasing the risk of token theft via XSS. Additionally, not enforcing `secure: true` in production allowed tokens to be transmitted over unencrypted connections.
**Prevention:** Always use `httpOnly: true` for session cookies and ensure `secure: true` is enabled in production environments.

## 2025-05-14 - Information Leakage in Error Handlers
**Vulnerability:** Backend controllers and middleware were returning raw error messages and stack traces to the client.
**Learning:** Using `${error}` or `${error.message}` in response JSON can leak sensitive information about the server's internal state, database structure, or library versions.
**Prevention:** Log detailed errors on the server and return generic, non-descriptive error messages to the client.
