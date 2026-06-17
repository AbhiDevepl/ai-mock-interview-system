## 2026-05-21 - [Session-to-Device Binding]
**Vulnerability:** JWT hijacking. If a JWT was stolen, it could be used by an attacker from any device until it expired.
**Learning:** The application already generated a `deviceId` and stored it in a session in Redis, but the `isAuth` middleware was only verifying the JWT itself, not binding it to the `deviceId` cookie.
**Prevention:** Always verify that the session associated with a JWT matches the device it was issued to by checking a secure, non-JS-accessible cookie (like `deviceId`) against the session store.
