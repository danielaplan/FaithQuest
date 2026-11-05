# Findings Register

| ID | Priority | Finding | Owner | Status | Release gate |
|---|---|---|---|---|---|
| FQ-001 | Critical | Signup metadata can assign authority | Daniel | Implemented locally | Malicious signup remains teacher |
| FQ-002 | Critical | User can update own profile role | Daniel | Implemented locally | Direct role update is rejected |
| FQ-003 | Critical | Owner deletion cascades into data | Daniel | Implemented locally | Ownership transfer preserves records |
| FQ-004 | Critical | Empty classes load starter students | Daniel | Implemented locally | New class remains empty |
| FQ-005 | Critical | Persistence omits important domains | Daniel | Implemented locally | Cross-device CRUD tests pass |
| FQ-006 | High | Admin role update conflicts with RLS | Daniel | Implemented locally | Protected admin RPC passes |
| FQ-007 | High | Student badges lack relational storage | Daniel | Implemented locally | Badge survives new device session |
| FQ-008 | High | Audit actor deletion rule conflicts | Daniel | Implemented locally | Actor removal preserves audit row |
| FQ-009 | Medium | Four-digit join codes collide | Daniel | Implemented locally | Collision retry test passes |
| FQ-010 | Medium | Analytics load unbounded records | Daniel | Partially implemented | Load benchmark passes |
| FQ-011 | High | Lint and automated tests absent | Daniel | Implemented locally | CI quality gate passes |

Do not mark a finding complete without linked evidence.

`Implemented locally` is not `Verified`: database and browser acceptance evidence is still required.
