# Sentinel Security Journal

## 2026-04-24 - Identity Metadata Spoofing via Trusted Request Body
**Vulnerability:** The `googleAuth` controller trusted client-provided `name` and `photo` metadata in the request body, allowing users to potentially spoof their profile information during sign-up/login despite having a verified email.
**Learning:** Even when using cryptographically verified tokens (like Firebase ID tokens), all associated metadata that is available within the token (claims) should be prioritized over client-provided fields to ensure data integrity and prevent identity metadata spoofing.
**Prevention:** Always extract and use identity metadata (`name`, `picture`, etc.) directly from the verified ID token claims rather than relying on the request body.

## 2026-04-24 - Incomplete Device Binding in Optional Auth
**Vulnerability:** The `optionalAuth` middleware verified the JWT signature but failed to enforce device-to-session binding or check the blacklist. This allowed stolen or revoked tokens to remain valid on endpoints using "optional" authentication.
**Learning:** Security constraints must be applied consistently across both mandatory and optional authentication paths if a token is present. "Optional" auth should mean "authenticated or anonymous", not "authenticated with lower security standards".
**Prevention:** Hardened `optionalAuth` to perform the same session record and device-to-session binding verification as `isAuth` when a token is presented.

## 2026-04-24 - Inconsistent Authentication State Cleanup
**Vulnerability:** Authentication failure paths (like token expiration or missing device binding) were inconsistent in clearing session-related cookies, sometimes clearing only the `token` and leaving `deviceId`, which could lead to inconsistent client state or session replay risks.
**Learning:** Authentication state cleanup must be atomic and comprehensive. If one part of the authentication credentials is found to be invalid, all associated identifiers should be cleared from the client.
**Prevention:** Enforced consistent clearing of both `token` and `deviceId` cookies on all authentication failure paths in middleware and controllers.
