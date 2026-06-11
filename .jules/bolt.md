# Bolt's Journal - AI Mock Interview System Performance

## 2025-05-15 - Initial Assessment
**Learning:** Started exploring the AI Mock Interview System. It's a monorepo with React frontend and Express backend.
**Action:** Identifying potential bottlenecks in both frontend and backend.

## 2025-05-15 - Auth Path Optimization
**Learning:** For every authenticated request, the system was making two separate Redis calls and a full Mongoose document query.
**Action:** Consolidated Redis lookups using `MGET` and optimized user retrieval with `.lean()` and `.select()`. Centralized public field definitions in the model to ensure consistency across controllers.
