---
status: active
owner: Daniel
area: project
source: source-code-and-local-build
last_verified: 2026-11-09
---

# Project Status

## Current state

FaithQuest now has a local multi-user foundation on branch `codex/multi-user-foundation`. Email/password and Google OAuth flows exist, with role-based teacher and administrator routing.

Migrations 01–08 and the multi-user preview have been rehearsed on FaithQuest Staging. Migration 09 fixes the administrator directory mismatch by making a staff member's church assignment persistent and synchronizing it to their active classes. Migration 09 is locally implemented but not yet applied to staging or production.

## Working in source and local evidence

- Teacher and administrator authentication flows exist.
- Google OAuth callback and role routing exist.
- Teacher class creation and classroom routes exist.
- Administrator dashboards and analytics pages exist.
- The production build completed successfully on 2026-11-09.
- Admin students now reads relational badge awards instead of the removed legacy column.
- Attendance charts include a stable eight-week baseline and unique-student summary.
- Points analytics includes average points and a clearer responsive donut chart.

## Remaining release blockers

1. Apply migration 09 to FaithQuest Staging, then redeploy the preview.
2. Re-test student listings, church assignment persistence, church/class counts, and analytics with the staging data.
3. Verify cross-device Realtime behavior and concurrent activity commands.
4. Restore-test a backup before any production migration.
5. Run browser acceptance for quizzes, badges, rewards, archives, and analytics.
6. Review the remaining moderate dependency advisory.

See [[../06 - Quality/Findings Register|Findings Register]].

## Evidence boundary

Local tests and compilation prove source-level behavior only. Production RLS isolation, multi-device behavior, backups, and user acceptance remain unverified.
