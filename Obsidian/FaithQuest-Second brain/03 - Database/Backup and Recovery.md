# Backup and Recovery

## Release gate

A backup is not verified until it has been restored into an isolated project and essential records have been checked.

## Required evidence

- Backup timestamp and project
- Backup method and responsible person
- Restore target
- Restore result
- Row-count and relationship checks
- Recovery time

## Before destructive operations

- Identify exact affected users and owned records.
- Transfer ownership where required.
- Verify a recent recoverable backup.
- Record rollback steps.
- Obtain explicit approval for production execution.
