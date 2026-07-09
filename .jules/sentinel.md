## 2026-07-09 - [CRITICAL] Fix Deactivation Bypass and Identity Spoofing in Google Auth

**Vulnerability:** The Google authentication flow was re-activating deactivated user accounts (`isActive: false`) and prioritizing client-provided metadata over verified Firebase ID token claims. Additionally, the JWT generation was inconsistent with the `isAuth` middleware's expectation for a `type: 'access'` claim.

**Learning:** Trusting client-provided metadata (like `name` and `photo`) in an authentication flow allows for identity spoofing. Furthermore, missing state checks (like `isActive`) during the login process can bypass administrative account suspensions. Inconsistent token claims between generation and verification can lead to authentication failures or security gaps if not properly aligned.

**Prevention:** Always source user metadata from verified identity provider claims (e.g., Firebase ID tokens) on the server side. Enforce account status checks (`isActive`) during every authentication attempt and return appropriate 403 Forbidden responses. Ensure that all security-critical JWT claims (like `type`) are consistently applied and verified across the codebase.
