# Requirements

## Functional

- FR-01 Authenticate teachers and administrators.
- FR-02 Support email/password and Google OAuth.
- FR-03 Route users according to their stored role.
- FR-04 Create and manage teacher-owned classes.
- FR-05 Manage students within an authorized class.
- FR-06 Record attendance and point activities.
- FR-07 Create and conduct quizzes.
- FR-08 Award badges and redeem rewards.
- FR-09 Provide administrator management and analytics.
- FR-10 Preserve data across browsers and devices.

## Non-functional

- NFR-01 Enforce tenant isolation in PostgreSQL RLS.
- NFR-02 Support concurrent classroom use without lost updates.
- NFR-03 Keep an auditable history of privileged actions.
- NFR-04 Back up and restore production data.
- NFR-05 Provide responsive classroom interaction.
- NFR-06 Fail visibly when a database write does not succeed.

Status and acceptance evidence belong in [[../06 - Quality/Test Strategy|Test Strategy]].
