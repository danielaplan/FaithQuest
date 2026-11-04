# Test Strategy

## Layers

1. **Unit:** deterministic badge, points, validation, and mapping logic.
2. **Database:** constraints, RPC transactions, and migration checks.
3. **RLS:** separate teacher/admin sessions against real Supabase policies.
4. **Integration:** authentication callback and CRUD flows.
5. **Browser:** complete teacher and administrator journeys.
6. **Load:** concurrent classroom actions and analytics.
7. **Recovery:** backup restore and rollback rehearsal.

## Critical release scenarios

- Teacher A cannot read or change Teacher B's class.
- Teacher cannot make themselves admin.
- New empty class remains empty.
- Concurrent attendance does not duplicate records.
- Deleted/archived records do not return.
- Admin replacement preserves churches and classes.
- Cross-device classroom state agrees.
