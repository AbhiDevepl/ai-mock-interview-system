# Bolt's Journal

## 2026-07-21 - Mongoose `.lean()` and ID Serialization Gotchas
**Learning:** In Mongoose, using `.lean()` for read-only queries provides substantial performance benefits (typically 5x-10x speedup and significantly lower memory overhead) by skipping model hydration and returning plain objects. However, doing so bypasses schema-level transforms and virtual fields, such as converting `_id` to `id` (via `toJSON` or `toObject` transforms).
**Action:** When optimizing with `.lean()`, always manually serialize the `id` field (`user.id = user._id.toString()`) if the client application or other downstream code expects it, to prevent silent API contract breaks.

## 2026-07-22 - Parallel PDF Extraction and Partial Field Selection in Document Models
**Learning:** Sequential processing of PDF pages via `pdfjs-dist` acts as an event loop bottle-neck. Fetching page content concurrently via `Promise.all` dramatically speeds up resume parsing. Additionally, loading huge text strings (like `resumeText` up to 100KB) into memory during interactive workflows (like submitting answers or finishing interviews) consumes substantial heap memory and DB bandwith; using `.select("-resumeText")` keeps `.save()` functional while avoiding fetching large unused fields.
**Action:** Always parallelize async PDF text parsing with `Promise.all` and project out heavy, unused optional fields using `.select("-fieldName")` before saving interactive Mongoose documents.

## 2026-07-25 - Atomic Balance Updates and Concurrency Protection
**Learning:** Performing state-changing operations (like credit deductions) using non-atomic patterns (`findOne`, check balance, `.save()`) is highly vulnerable to concurrent race conditions (double spending) and introduces substantial database round-trip overhead. Simply converting query objects to `.lean()` causes downstream `.save()` calls to fail.
**Action:** Use `findOneAndUpdate` with query-level balance validation (e.g., `{ credits: { $gte: cost } }`) and `$inc` operators with `.lean()` to execute atomic balance modifications in a single efficient query.
