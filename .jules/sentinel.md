# Sentinel's Journal - Critical Security Learnings

## 2026-04-24 - [Identity Spoofing and Unverified Email Access]
**Vulnerability:** The authentication flow trusted client-provided user profile data (name and photo) and did not verify the `email_verified` claim from the Firebase ID token.
**Learning:** Even with server-side token verification, trusting other parts of the request body for user profile creation/updates allows for profile spoofing. Additionally, allowing unverified emails to authenticate can lead to account hijacking.
**Prevention:** Always use the verified token as the primary source of truth for user identity and profile information. Explicitly check for verification claims (like `email_verified`) before granting access.
