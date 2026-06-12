# Sentinel Journal - Security Learnings

## 2026-05-24 - Enforcing Email Verification in Google Auth
**Vulnerability:** Impersonation and unauthorized access via unverified accounts.
**Learning:** Firebase ID tokens can sometimes contain unverified email addresses if the authentication provider or the account setup process allows it. Trusting the email without checking verification status can lead to account takeovers or impersonation.
**Prevention:** Always check the `email_verified` claim in the decoded Firebase ID token on the server side before establishing a local session.

## 2026-05-24 - Securing Session Metadata Cookies
**Vulnerability:** Session hijacking and tracking ID theft via XSS.
**Learning:** While the primary session token was secure, secondary tracking cookies like `deviceId` were explicitly set with `httpOnly: false`. This allowed client-side scripts to access them, which can be leveraged in session hijacking or fixation attacks if the server-side session logic relies on these IDs.
**Prevention:** Apply `httpOnly: true` to all cookies by default, especially those involved in session management or identification. Consistency in cookie security attributes across login and logout is essential.
