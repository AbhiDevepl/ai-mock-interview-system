# Bolt's Journal

## 2026-07-21 - Mongoose `.lean()` and ID Serialization Gotchas
**Learning:** In Mongoose, using `.lean()` for read-only queries provides substantial performance benefits (typically 5x-10x speedup and significantly lower memory overhead) by skipping model hydration and returning plain objects. However, doing so bypasses schema-level transforms and virtual fields, such as converting `_id` to `id` (via `toJSON` or `toObject` transforms).
**Action:** When optimizing with `.lean()`, always manually serialize the `id` field (`user.id = user._id.toString()`) if the client application or other downstream code expects it, to prevent silent API contract breaks.
