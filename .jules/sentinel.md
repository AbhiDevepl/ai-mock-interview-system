## 2026-05-20 - Enforced Email Verification for Google Auth
**Vulnerability:** Authentication bypass via unverified email addresses from certain identity providers.
**Learning:** Some identity providers (like GitHub or certain email configurations) may allow users to log in with an unverified email address. If the backend only checks for the presence of an email in the Firebase ID token, it may inadvertently trust an unverified identity.
**Prevention:** Always verify the `email_verified` claim in the decoded Firebase ID token on the server side before allowing user authentication or account creation.
