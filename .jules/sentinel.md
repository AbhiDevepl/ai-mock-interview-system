## 2026-03-04 - Secure Firebase Identity Verification
**Vulnerability:** Trusting unverified email addresses and allowing client-side profile data to override verified identity provider data.
**Learning:** Identity providers like Firebase include claims such as `email_verified` that MUST be checked to prevent authentication bypass via unverified accounts. Furthermore, using client-provided `name` or `picture` in the auth flow allows for identity spoofing if not validated against the token's claims.
**Prevention:** Always verify the `email_verified` claim on the server side. Prioritize claims from the verified ID token (e.g., `decodedToken.name`, `decodedToken.picture`) over data sent in the request body. Ensure all sensitive cookies are `httpOnly: true`.
