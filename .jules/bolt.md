## 2026-06-11 - Server Startup Parallelization
**Learning:** Server `start()` in `server.js` calls `connectDB()` then `connectRedis()` sequentially. Since Redis is non-critical (handled gracefully everywhere via `getRedisClient()` returning null), it can fire without blocking. This reduces startup time by the duration of the Redis handshake (~200–500ms).
**Action:** Fire `connectRedis()` as a non-awaited promise (with `.catch()`) so the server starts listening immediately after MongoDB connects.
