# Bolt's Journal

## 2026-07-21 - Mongoose `.lean()` and ID Serialization Gotchas
**Learning:** In Mongoose, using `.lean()` for read-only queries provides substantial performance benefits (typically 5x-10x speedup and significantly lower memory overhead) by skipping model hydration and returning plain objects. However, doing so bypasses schema-level transforms and virtual fields, such as converting `_id` to `id` (via `toJSON` or `toObject` transforms).
**Action:** When optimizing with `.lean()`, always manually serialize the `id` field (`user.id = user._id.toString()`) if the client application or other downstream code expects it, to prevent silent API contract breaks.

## 2026-07-22 - Parallel PDF Extraction and Partial Field Selection in Document Models
**Learning:** Sequential processing of PDF pages via `pdfjs-dist` acts as an event loop bottle-neck. Fetching page content concurrently via `Promise.all` dramatically speeds up resume parsing. Additionally, loading huge text strings (like `resumeText` up to 100KB) into memory during interactive workflows (like submitting answers or finishing interviews) consumes substantial heap memory and DB bandwith; using `.select("-resumeText")` keeps `.save()` functional while avoiding fetching large unused fields.
**Action:** Always parallelize async PDF text parsing with `Promise.all` and project out heavy, unused optional fields using `.select("-fieldName")` before saving interactive Mongoose documents.

## 2026-07-24 - Atomic Decrements for Credit/Balance Updates
**Learning:** Using the typical Mongoose find-then-save pattern for state-changing DB operations like credit deductions or balance updates is vulnerable to concurrent update race conditions (e.g. double-spending) and carries high overhead due to Mongoose model hydration and validation/save hooks. Performing an atomic `findOneAndUpdate` with a constraint (e.g. `credits: { $gte: required }`) and `$inc: { credits: -required }` with `.lean()` completely prevents race conditions while bypassing unnecessary hydration and hooks.
**Action:** For credit or balance deductions, use an atomic `findOneAndUpdate` with a conditional match and `$inc` with `.lean()` to ensure safety under concurrency and maximize performance.
