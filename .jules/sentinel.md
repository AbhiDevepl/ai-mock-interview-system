# Sentinel Security Journal

## 2026-05-20 - [HIGH] Insecure Account Reactivation & Identity Spoofing
**Vulnerability:**
1. Deactivated users (`isActive: false`) are automatically re-activated upon a successful Google login in `googleAuth`.
2. `googleAuth` trusts the `name` and `picture` provided in the request body instead of the verified claims in the Firebase ID token.
3. Inconsistent cookie clearing across `isAuth`, `getCurrentUser`, and `getMe` leads to "zombie" sessions.

**Learning:**
The "Fail Fast" principle was partially applied, but the re-login flow lacked a check for the account's administrative state (`isActive`), allowing users to bypass bans. Additionally, trusting client-provided identity data is a classic spoofing risk.

**Prevention:**
Always verify account status (`isActive`) before issuing new tokens. Prefer identity claims from verified ID tokens over request body data. Ensure all authentication failure paths consistently clear all session cookies.
