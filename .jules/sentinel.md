## 2025-05-22 - [Insecure Cookie Configuration and Information Leakage]
**Vulnerability:** The authentication cookie was configured with an invalid attribute `http: true` (instead of `httpOnly: true`) and `secure: false`. Additionally, error handlers were leaking raw error messages to the client.
**Learning:** Typos in cookie configuration (like `http` vs `httpOnly`) can silently fail to provide the intended security protections (preventing XSS from accessing the cookie). Generic error handling `res.send(error)` or `res.json(error)` is a common source of information leakage.
**Prevention:** Always use a standard security checklist for cookie configuration. Implement centralized error handling or ensure all catch blocks sanitize messages before sending them to the client.

## 2025-05-22 - [NoSQL Injection Risk in User Lookup]
**Vulnerability:** The `googleAuth` controller performed a database lookup using `User.findOne({email})` where `email` was taken directly from `req.body` without type validation.
**Learning:** In Express/Mongoose, if a client sends a JSON object like `{"email": {"$gt": ""}}`, it can bypass intended logic if not properly validated as a string.
**Prevention:** Always validate the type of user-provided input before using it in database queries.
