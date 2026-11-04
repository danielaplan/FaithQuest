---
status: proposed
date: 2026-11-05
owner: Daniel
---

# ADR-003 — LocalStorage Strategy

## Context

LocalStorage currently behaves as a parallel database and can preserve stale or incomplete state.

## Decision

LocalStorage will hold only non-critical preferences and, if offline support is approved, a versioned queue of pending commands.

## Consequences

- Theme and sound preferences may remain local.
- Students, activities, quizzes, badges, and rewards load from Supabase.
- Offline writes need idempotency keys and visible sync status.
