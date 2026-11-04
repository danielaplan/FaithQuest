# Roles and Permissions

## Role source

`public.profiles.role` is the application authority source after Supabase establishes identity.

## Rules

- New accounts always start as `teacher`.
- Client metadata cannot assign `admin`.
- Teachers cannot update their role.
- Admin promotion/demotion uses one protected database function.
- The last admin cannot be demoted or deleted.
- Every change records actor, target, old role, new role, and timestamp.

## UI rule

Teacher/Admin tabs are presentation choices. Access control must continue to work if someone calls Supabase directly without using the interface.
