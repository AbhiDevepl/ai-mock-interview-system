# Sentinel Security Journal

## 2026-06-21 - Unverified Identity Metadata Spoofing
**Vulnerability:** The authentication controller relied on unverified client-provided `name` and `photo` fields during Google login, even when a verified Firebase ID token was present.
**Learning:** Trusting any part of a client request for identity-related data when a cryptographically verified alternative exists creates a spoofing risk where users can misrepresent their profile metadata.
**Prevention:** Always prioritize claims from verified tokens (like Firebase ID tokens) for all identity metadata, including display names and profile pictures.

## 2026-06-21 - Inconsistent Cookie Clearing on Auth Failure
**Vulnerability:** The `isAuth` middleware was inconsistent in clearing session-related cookies (`token` and `deviceId`) when authentication failed due to session invalidity or blacklisting.
**Learning:** Failing to clear all related identifiers on session revocation can leave stale or orphaned state on the client, which might be misused or lead to unexpected behavior in defense-in-depth layers.
**Prevention:** Ensure all session-related cookies are cleared whenever an authentication or session validation check fails.
