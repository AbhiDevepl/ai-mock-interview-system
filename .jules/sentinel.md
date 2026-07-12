## 2026-05-19 - [HIGH] Insecure Filename Handling in Multer
**Vulnerability:** User-provided filenames were used directly in the filesystem (`Data.new() + "-" + file.originalname`), which could lead to path traversal or other filesystem-related exploits if a malicious filename was provided. Additionally, `Data.new()` was a typo for `Date.now()`.
**Learning:** Relying on `file.originalname` without sanitization is a common oversight that introduces security risks.
**Prevention:** Always sanitize user-provided filenames using a strict whitelist of allowed characters (e.g., alphanumeric, dots, and dashes) before using them in the filesystem.
