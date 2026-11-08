# Migrations

## Current files

1. `01_multitenancy_schema.sql` — core schema and initial RLS
2. `02_fix_rls_policies.sql` — church and badge policy adjustments
3. `03_add_updated_at_soft_delete.sql` — timestamps, soft-delete, and audit table
4. `04_multi_user_security.sql` — protected roles, ownership, and RLS hardening
5. `05_multi_user_classroom.sql` — classroom catalogs and server commands
6. `06_admin_analytics.sql` — server-side administrator summaries
7. `07_classroom_commands.sql` — idempotent classroom mutations
8. `08_class_scoped_realtime.sql` — class-scoped Realtime invalidation
9. `09_admin_directory_consistency.sql` — persistent staff church assignments and class synchronization

Migrations 01–08 were rehearsed on FaithQuest Staging. Migration 09 is locally verified and must be applied to staging before the related admin UI is accepted.

## Required process

1. Review migration and rollback impact.
2. Apply to an isolated test project.
3. Run structural and RLS tests.
4. Back up production and verify restoration before destructive changes.
5. Apply migration once.
6. Record deployment evidence and schema version.

Do not rely on manually editing production tables without recording an equivalent migration.
