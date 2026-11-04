# Multi-User Design

## Expected initial scale

- 10–50 simultaneous teachers
- Hundreds to a few thousand students
- Multiple browser sessions per organization

## Required controls

- RLS isolation between teachers and classes
- Database constraints for uniqueness and valid state
- Transactions for operations that read and then write totals
- Idempotency keys for retryable commands
- Realtime subscriptions scoped to authorized class records
- Pagination and server-side aggregation
- Visible write failures and retry status
- Backup and restore verification

## Concurrency examples

| Situation | Required outcome |
|---|---|
| Two teachers edit one student | Detect or deterministically resolve conflict |
| Same attendance submitted twice | One attendance record or idempotent result |
| Reward redeemed simultaneously | Balance cannot become invalid |
| Account deleted during active session | Access ends safely without data cascade |
