## 2026-05-20 - Insecure Session Clearing and Leaky Optional Auth
**Vulnerability:** Authentication tokens (`token` and `deviceId`) were inconsistently cleared on verification failure, and `optionalAuth` did not enforce device-to-session binding.
**Learning:** Inconsistent cookie clearing leaves stale credentials on the client, and permissive optional middleware allows replaying stolen tokens if device binding is not checked.
**Prevention:** Always clear ALL related authentication cookies on ANY verification failure (fail securely) and ensure `optionalAuth` is as strict as `isAuth` for the fields it verifies.
