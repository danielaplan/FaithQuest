---
status: active
owner: Daniel
area: process
last_verified: 2026-11-05
---

# How to Use This Vault

## Rules

1. Start from [[Home]].
2. Link notes instead of duplicating the same explanation.
3. Record only important requirements, decisions, risks, and evidence.
4. Keep code details in the repository; explain why and behavior here.
5. Update `last_verified` when evidence is checked again.
6. Move replaced notes to `99 - Archive` instead of silently deleting history.

## Note lifecycle

`draft → proposed → approved → implemented → verified → archived`

## Required labels

- **Intent:** expected product behavior.
- **Source:** behavior found in code or migrations.
- **Local evidence:** result reproduced locally.
- **Production evidence:** result reproduced on hosted services.
- **Decision:** approved direction and reason.
- **Next action:** one concrete action with an owner.

## Update the vault when

- a requirement changes;
- a migration or RLS policy changes;
- an architecture decision is approved;
- a major bug is diagnosed;
- a release is tested or deployed;
- production behavior is verified;
- an incident occurs.

Small styling edits and routine refactors do not need separate notes.
