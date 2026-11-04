# Migrations

## Current files

1. `01_multitenancy_schema.sql` — core schema and initial RLS
2. `02_fix_rls_policies.sql` — church and badge policy adjustments
3. `03_add_updated_at_soft_delete.sql` — timestamps, soft-delete, and audit table

## Required process

1. Review migration and rollback impact.
2. Apply to an isolated test project.
3. Run structural and RLS tests.
4. Back up production and verify restoration before destructive changes.
5. Apply migration once.
6. Record deployment evidence and schema version.

Do not rely on manually editing production tables without recording an equivalent migration.
