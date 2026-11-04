---
status: proposed
date: 2026-11-05
owner: Daniel
---

# ADR-001 — Supabase as Source of Truth

## Context

Classroom data currently exists in React state, browser storage, and partially synchronized database tables. Multiple devices can disagree.

## Decision

Supabase PostgreSQL will be authoritative for shared operational data. Browser storage may cache data or queue explicit offline commands.

## Consequences

- Every domain action needs a clear database operation.
- Write failures must remain visible.
- Offline support needs pending state, retries, and conflict handling.
- Cross-device behavior becomes testable and deterministic.
