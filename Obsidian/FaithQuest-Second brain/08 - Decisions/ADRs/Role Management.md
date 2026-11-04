---
status: proposed
date: 2026-11-05
owner: Daniel
---

# ADR-002 — Protected Role Management

## Context

Current profile creation and update rules expose role escalation and prevent reliable admin management.

## Decision

New accounts always start as teachers. Role changes occur only through one protected database function that verifies the caller, protects the final admin, and writes an audit record.

## Consequences

- Direct client updates to `profiles.role` are denied.
- Admin UI calls the protected function.
- RLS tests must cover malicious direct requests.
