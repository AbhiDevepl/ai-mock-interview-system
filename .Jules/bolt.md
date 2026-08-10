# Bolt's Journal

## 2026-07-21 - Mongoose `.lean()` and ID Serialization Gotchas
**Learning:** In Mongoose, using `.lean()` for read-only queries provides substantial performance benefits (typically 5x-10x speedup and significantly lower memory overhead) by skipping model hydration and returning plain objects. However, doing so bypasses schema-level transforms and virtual fields, such as converting `_id` to `id` (via `toJSON` or `toObject` transforms).
**Action:** When optimizing with `.lean()`, always manually serialize the `id` field (`user.id = user._id.toString()`) if the client application or other downstream code expects it, to prevent silent API contract breaks.

## 2026-07-22 - Parallel PDF Extraction and Partial Field Selection in Document Models
**Learning:** Sequential processing of PDF pages via `pdfjs-dist` acts as an event loop bottle-neck. Fetching page content concurrently via `Promise.all` dramatically speeds up resume parsing. Additionally, loading huge text strings (like `resumeText` up to 100KB) into memory during interactive workflows (like submitting answers or finishing interviews) consumes substantial heap memory and DB bandwith; using `.select("-resumeText")` keeps `.save()` functional while avoiding fetching large unused fields.
**Action:** Always parallelize async PDF text parsing with `Promise.all` and project out heavy, unused optional fields using `.select("-fieldName")` before saving interactive Mongoose documents.

## 2026-07-23 - Atomic Credit/Balance Updates to Prevent Race Conditions and Bypass Mongoose Hydration
**Learning:** Performing a non-atomic credit deduction like `user.credits -= 50; await user.save()` not only introduces Mongoose document hydration and validation hook overhead, but also introduces critical concurrency race conditions (e.g. double-spending credits). Replacing this sequence with an atomic `findOneAndUpdate` query using `$inc` and `.lean()` completely guarantees security against double-spends and speeds up execution by avoiding hydrated save/validation hooks.
**Action:** For all state-changing or balance/credit operations, prefer atomic Mongoose operations combined with `.lean()` to ensure race-condition safety and high database throughput.

## 2026-07-24 - MongoDB Memory Server Version Conflict and SIGSEGV Resolution
**Learning:** The default version of `mongodb-memory-server` downloads MongoDB `8.2.6` binaries, which experience a segmentation fault (SIGSEGV) in certain Docker/Sandbox environments due to missing AVX instruction support or other low-level OS incompatibilities. Using version `6.0.16` instead completely resolves this issue and allows the unit and integration tests to run cleanly.
**Action:** For all test environments showing MongoDB binary SIGSEGV, set `MONGOMS_VERSION=6.0.16` explicitly during execution to bypass binary incompatibilities.

## 2026-07-25 - Safe Transaction Ordering and High-Performance UpdateOne Workflows
**Learning:** For operations combining slow external API calls (e.g. AI/LLM generation) and transactional debiting (e.g. user credits), always run the API call successfully *before* executing the database debit to prevent users from being charged for failed requests. Additionally, when updating document status fields based on values calculated across nested arrays (like in `finishInterview`), database performance can be optimized by fetching only the necessary fields with `.select().lean()` to completely bypass model hydration, and then persisting updates atomically via `updateOne` to skip full serialization and document validation overhead.
**Action:** Always maintain correct transaction ordering to ensure reliability, and use targeted `.select().lean()` queries paired with `updateOne` for heavy document status transitions in Mongoose.

## 2026-07-26 - High-Performance Positional Subdocument Updates in Mongoose
**Learning:** When retrieving and modifying specific elements inside subdocument arrays (such as the `questions` array in the `Interview` model), a hydrated document's `.save()` method is extremely slow due to Mongoose tracking changes across the entire array and casting/validating all subdocuments. Bypassing hydration using `.lean()` and executing targeted positional array updates using `updateOne` with `questions.${index}.field` dot notation is incredibly efficient and avoids any change-tracking or full document serialization overhead.
**Action:** For all updates modifying specific indexes of nested arrays in Mongo schemas, fetch the doc with `.lean()` and write changes atomically using positional paths with `updateOne`.

## 2026-07-27 - High-Performance OAuth Login Workflows with Atomic Updates
**Learning:** For high-frequency OAuth login paths (such as `googleAuth`), querying the user via `.findOne().lean()` avoids costly Mongoose document hydration. Furthermore, updating user details (e.g., name, picture, lastLoginAt) using an atomic `findOneAndUpdate` with `{ new: true }` and `.lean()` completely bypasses model change tracking, schema validations, and `.save()` hook execution overhead.
**Action:** Always prefer `.findOne().lean()` followed by an atomic `findOneAndUpdate` update with `.lean()` for high-throughput login update flows.

## 2026-07-25 - Atomic Balance Updates and Concurrency Protection
**Learning:** Performing state-changing operations (like credit deductions) using non-atomic patterns (`findOne`, check balance, `.save()`) is highly vulnerable to concurrent race conditions (double spending) and introduces substantial database round-trip overhead. Simply converting query objects to `.lean()` causes downstream `.save()` calls to fail.
**Action:** Use `findOneAndUpdate` with query-level balance validation (e.g., `{ credits: { $gte: cost } }`) and `$inc` operators with `.lean()` to execute atomic balance modifications in a single efficient query.

## 2026-07-28 - High-Performance Lean Positional Updates and Atomic Finish Workflows
**Learning:** Mongoose hydrated `.save()` on heavy documents containing nested arrays degrades response times because of change-tracking and validation overhead on the entire array. Combining `.lean()` with custom positional object queries (`questions.${index}.field`) inside atomic `updateOne` calls completely skips hydration, array validation, and serialization. This optimizes CPU usage and database write size from O(N_array) to O(1) fields updated.
**Action:** Utilize `.lean()` for retrieving documents that contain heavy nested arrays, and write modifications atomically using targeted positional paths via `updateOne`.
