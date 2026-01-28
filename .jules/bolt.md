## 2025-05-22 - UI Stability vs Server Optimization
**Learning:** Removing memoization (`useMemo`) from components that use randomized values (like `Math.random()`) can cause UI flickering and instability if the component is hydrated or re-rendered on the client. Even if a component is intended to be a Server Component, preserving stability for random values is crucial for UX.
**Action:** Avoid removing stability hooks for randomized values unless the component is strictly a non-hydrated Server Component and the randomization is desired on every request.

## 2025-05-22 - Dependency Management Hygiene
**Learning:** Running `pnpm install` in a repository that uses `npm` (has `package-lock.json`) can generate a massive `pnpm-lock.yaml` which should not be included in performance-focused PRs.
**Action:** Always use the repository's native package manager and ensure lockfiles are not accidentally included in PRs unless explicitly requested.
