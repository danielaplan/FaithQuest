---
status: needs-redesign
owner: Daniel
area: persistence
last_verified: 2026-11-05
---

# Data Synchronization

## Current behavior

- Classroom state is held in React.
- Full state is written to browser `localStorage`.
- Students and activities are partially upserted into Supabase.
- Quizzes, badges, rewards, deletions, and archives are not consistently synchronized.
- Realtime reloads parts of class state.

## Target behavior

| Action | Authoritative operation |
|---|---|
| Add student | Insert one `students` row |
| Edit student | Update one authorized row |
| Remove student | Set `archived_at` after confirmation |
| Award points | Insert one immutable `activities` row |
| Record attendance | Transactional insert/upsert with uniqueness rule |
| Save quiz | Insert/update one `quizzes` row |
| Award badge | Insert one `student_badges` row |
| Redeem reward | Transaction verifies balance and inserts `student_rewards` |

## Offline rule

Offline commands must have stable IDs, visible pending status, retries, and conflict handling. Do not claim success before server confirmation unless the UI clearly labels the action as pending.
