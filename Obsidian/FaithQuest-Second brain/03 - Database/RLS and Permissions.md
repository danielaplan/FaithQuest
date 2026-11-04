# RLS and Permissions

## Intended matrix

| Resource | Teacher | Admin |
|---|---|---|
| Own profile | Read and safe personal-field update | Read all |
| Authority role | No access | Change through protected RPC |
| Own classes | Create/read/update/archive | Read/manage all |
| Other teacher classes | No access | Read/manage all |
| Students and activities | Own classes only | All authorized organizations |
| Global badges/rewards | Read | Manage |
| Audit logs | No access | Read |

## Current critical gap

The migration permits a user to update their own profile row without protecting `role`, while signup logic accepts role metadata. This must be fixed before multi-user release.

## Verification rule

Every RLS test must use separate real sessions. Table Editor access as `postgres` bypasses normal user policies and does not prove application isolation.
