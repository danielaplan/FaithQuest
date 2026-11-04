---
status: active
owner: Daniel
area: project
source: source-code-and-local-build
last_verified: 2026-11-05
---

# Project Status

## Current state

FaithQuest builds successfully with Next.js 16 and connects to Supabase Auth and PostgreSQL. Email/password and Google OAuth flows exist, with role-based teacher and administrator routing.

The application is still a prototype for multi-user operation because classroom state is split between browser `localStorage` and partially synchronized Supabase tables.

## Working in source and local evidence

- Teacher and administrator authentication flows exist.
- Google OAuth callback and role routing exist.
- Teacher class creation and classroom routes exist.
- Administrator dashboards and analytics pages exist.
- The production build completed successfully on 2026-11-04.

## Release blockers

1. Prevent teacher-to-admin privilege escalation.
2. Prevent account deletion from cascading into churches and classes.
3. Remove starter data from real empty classes.
4. Make Supabase the single source of truth.
5. Persist quizzes, badges, rewards, deletions, and archives consistently.
6. Add multi-user isolation and concurrency tests.

See [[../06 - Quality/Findings Register|Findings Register]].

## Evidence boundary

The successful local and Vercel builds prove compilation only. Production RLS isolation, multi-device behavior, backups, and user acceptance remain unverified.
