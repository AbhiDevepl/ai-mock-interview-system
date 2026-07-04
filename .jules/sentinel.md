# Sentinel Security Journal

## 2026-05-21 - Identity Metadata Spoofing in OAuth
**Vulnerability:** The `googleAuth` controller trusted client-provided `name` and `photo` metadata even after verifying the Firebase ID token.
**Learning:** Authenticating a user via ID token proves their identity (UID/email) but does not automatically validate other metadata sent in the request body. An attacker could spoof their display name or picture in the application database while logging in with a valid account.
**Prevention:** Always prioritize cryptographically verified claims (like `name` and `picture`) from the ID token over unverified client-provided data.

## 2026-05-21 - Insecure Optional Authentication
**Vulnerability:** The `optionalAuth` middleware was only checking for the presence of a JWT and its blacklist status, but skipped the `deviceId` session binding check enforced in `isAuth`.
**Learning:** Security middleware that provides "optional" context (like setting `req.userId`) can still be exploited if it's less rigorous than its mandatory counterpart. A stolen JWT could still be used to establish a partial session if device binding was ignored.
**Prevention:** Maintain security parity between mandatory and optional authentication filters; if a token is presented, it must meet all security requirements (binding, expiry, blacklist) regardless of whether the route is protected or public.

## 2026-05-21 - Inconsistent Session Clearing
**Vulnerability:** Multiple authentication failure paths (inactive user, missing deviceId, invalid session) only cleared the `token` cookie, leaving the `deviceId` cookie behind.
**Learning:** Partial session clearing can lead to inconsistent client state and potential session fixation or tracking issues.
**Prevention:** Ensure all authentication cookies are cleared consistently on any security failure to force a clean slate for the client.
