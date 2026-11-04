# Database Overview

Supabase PostgreSQL stores identities, organizations, classes, students, activities, quizzes, badges, rewards, and audit data.

## Ownership chain

`auth.users → profiles → teacher_classes → students → activities`

Churches group classes. Badges and rewards may be global or class-specific.

## Required improvements

- Add `student_badges`.
- Secure role changes through an admin RPC.
- Replace destructive owner cascades.
- Add attendance uniqueness/idempotency constraints.
- Add reward-redemption transaction logic.
- Make audit logging operational.

See [[ERD]], [[Tables and Relationships]], and [[RLS and Permissions]].
