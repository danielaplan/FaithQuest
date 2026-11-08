# Test Results Index

Store detailed results in the `Test Results` folder and link them here.

| Date | Scope | Environment | Result | Evidence |
|---|---|---|---|---|
| 2026-11-04 | Next.js production build | Local | PASS | Build completed; middleware warning remains |
| 2026-11-04 | Lint command | Local | FAIL | `next lint` removed in Next.js 16 |
| 2026-11-05 | Multi-user source contracts | Local | PASS | 9 Node tests |
| 2026-11-05 | TypeScript | Local | PASS | `tsc --noEmit` reported no errors |
| 2026-11-05 | ESLint | Local | PASS WITH WARNINGS | 0 errors; legacy unused-import warnings remain |
| 2026-11-05 | Production dependency audit | Local | PARTIAL | Critical Next.js advisory removed; one moderate advisory remains |
| 2026-11-09 | Admin directory consistency contracts | Local | PASS | 12/12 Node tests |
| 2026-11-09 | TypeScript | Local | PASS | `tsc --noEmit` reported no errors |
| 2026-11-09 | ESLint | Local | PASS | `eslint .` reported no errors |
| 2026-11-09 | Next.js production build | Local | PASS | Next.js 16.4.5 compiled and generated 17 routes |
| 2026-11-09 | Admin UI pattern detector | Local | PASS | No Impeccable detector findings across five changed admin pages |

Migration 09 staging acceptance and production RLS acceptance have not been recorded yet.
