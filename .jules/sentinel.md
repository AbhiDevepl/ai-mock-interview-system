# Sentinel Security Journal

## 2026-06-28 - Identity Metadata Spoofing
**Vulnerability:** The `googleAuth` controller prioritized client-provided `name` and `picture` over cryptographically verified claims from the Firebase ID token.
**Learning:** Authenticated metadata should always prefer server-verified claims to prevent users from spoofing their profile information during the login flow.
**Prevention:** Extract and prioritize profile metadata directly from the verified OIDC/Firebase token claims.

## 2026-06-28 - Insecure Session Clearing
**Vulnerability:** Authentication failure paths in middleware and controllers inconsistently cleared cookies, often leaving the `deviceId` cookie behind while clearing the JWT `token`.
**Learning:** Leaving partial session state (like a valid device identifier) can facilitate session replay or hijacking if the server-side binding is not strictly enforced on every request.
**Prevention:** Consistently clear both `token` and `deviceId` cookies on all authentication failure paths.

## 2026-06-28 - Weak Optional Authentication Binding
**Vulnerability:** The `optionalAuth` middleware verified the JWT signature but failed to enforce the device-to-session binding required by `isAuth`.
**Learning:** Security middleware, even when "optional", must enforce the same defense-in-depth constraints as required authentication if a credential (token) is actually presented.
**Prevention:** Mirror the device-to-session binding verification in `optionalAuth` to ensure stolen JWTs cannot be used even in optional contexts.
