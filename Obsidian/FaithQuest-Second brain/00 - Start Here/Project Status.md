---
status: active
owner: Daniel
area: project
source: source-code-and-local-build
last_verified: 2026-11-05
---

# Project Status

## Current state

FaithQuest now has a local multi-user foundation on branch `codex/multi-user-foundation`. Email/password and Google OAuth flows exist, with role-based teacher and administrator routing.

New migrations and application commands make Supabase authoritative for shared classroom records. These changes are locally implemented but have not been applied to or accepted against production Supabase.

## Working in source and local evidence

- Teacher and administrator authentication flows exist.
- Google OAuth callback and role routing exist.
- Teacher class creation and classroom routes exist.
- Administrator dashboards and analytics pages exist.
- The production build completed successfully on 2026-11-04.

## Remaining release blockers

1. Apply migrations 04–08 to an isolated Supabase project.
2. Execute real-session RLS tests with Admin A, Teacher A, and Teacher B.
3. Verify cross-device Realtime behavior and concurrent activity commands.
4. Restore-test a backup before any production migration.
5. Run browser acceptance for quizzes, badges, rewards, archives, and analytics.
6. Review the remaining moderate dependency advisory.

See [[../06 - Quality/Findings Register|Findings Register]].

## Evidence boundary

Local tests and compilation prove source-level behavior only. Production RLS isolation, multi-device behavior, backups, and user acceptance remain unverified.
