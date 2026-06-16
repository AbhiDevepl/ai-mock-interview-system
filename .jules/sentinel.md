# Sentinel's Journal - Critical Security Learnings

## 2026-06-12 - [Insecure `deviceId` Cookie]
**Vulnerability:** The `deviceId` cookie was set with `httpOnly: false`, allowing client-side scripts to access it.
**Learning:** This exposed the device identifier to potential theft via XSS, which could be used in session hijacking or tracking.
**Prevention:** Always use `httpOnly: true` for any sensitive identifiers or tokens stored in cookies unless there is a specific, well-justified need for client-side access.
