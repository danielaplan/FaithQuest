# Findings Register

| ID | Priority | Finding | Owner | Status | Release gate |
|---|---|---|---|---|---|
| FQ-001 | Critical | Signup metadata can assign authority | Unassigned | Open | Malicious signup remains teacher |
| FQ-002 | Critical | User can update own profile role | Unassigned | Open | Direct role update is rejected |
| FQ-003 | Critical | Owner deletion cascades into data | Unassigned | Open | Ownership transfer preserves records |
| FQ-004 | Critical | Empty classes load starter students | Unassigned | Open | New class remains empty |
| FQ-005 | Critical | Persistence omits important domains | Unassigned | Open | Cross-device CRUD tests pass |
| FQ-006 | High | Admin role update conflicts with RLS | Unassigned | Open | Protected admin RPC passes |
| FQ-007 | High | Student badges lack relational storage | Unassigned | Open | Badge survives new device session |
| FQ-008 | High | Audit actor deletion rule conflicts | Unassigned | Open | Actor removal preserves audit row |
| FQ-009 | Medium | Four-digit join codes collide | Unassigned | Open | Collision retry test passes |
| FQ-010 | Medium | Analytics load unbounded records | Unassigned | Open | Load benchmark passes |
| FQ-011 | High | Lint and automated tests absent | Unassigned | Open | CI quality gate passes |

Do not mark a finding complete without linked evidence.
