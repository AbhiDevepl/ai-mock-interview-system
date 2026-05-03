## 2026-05-22 - [Insecure Cookie and Information Leakage]
**Vulnerability:** A typo in the cookie configuration (`http: true` instead of `httpOnly: true`) left authentication tokens vulnerable to XSS-based theft. Additionally, catch blocks were returning internal error messages (e.g., `${error.message}`) to the client, potentially leaking stack traces or internal server details.
**Learning:** Even standard security properties like `httpOnly` can be easily misconfigured or mistyped. Information leakage through verbose error messages is a common oversight that can aid attackers in reconnaissance.
**Prevention:** Always use `httpOnly: true` for sensitive cookies. Standardize error responses to return generic messages to the client while logging detailed errors on the server.
