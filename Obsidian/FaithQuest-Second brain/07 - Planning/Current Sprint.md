---
status: implemented-local
owner: Daniel
area: planning
last_verified: 2026-11-05
---

# Current Sprint

## Objective

Close the authorization and destructive-deletion blockers before redesigning classroom synchronization.

## Proposed scope

- [x] FQ-001: force new profiles to `teacher`
- [x] FQ-002: prevent self-promotion
- [x] FQ-003: require ownership transfer before deletion
- [x] FQ-006: add protected admin role-management RPC
- [x] Add ordered migrations and source contract tests
- [ ] Apply migrations to an isolated Supabase project
- [ ] Run RLS tests using separate sessions
- [ ] Verify backup restoration and rollback plan

## Not in scope

- Visual redesign
- New gamification features
- Production deletion
- Full offline synchronization

Implementation begins only after scope and migration approach are approved.
