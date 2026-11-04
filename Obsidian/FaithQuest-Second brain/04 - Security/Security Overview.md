# Security Overview

## Primary assets

- User identities and sessions
- Student records and activity history
- Church and class ownership
- Administrator authority
- OAuth and environment configuration

## Trust boundaries

1. Browser input is untrusted.
2. UI role checks improve navigation but do not authorize data.
3. Supabase Auth establishes identity.
4. PostgreSQL RLS and protected functions establish authority.
5. Vercel and Supabase environment variables must be controlled and reviewed.

## Immediate priorities

- Remove user-controlled role assignment.
- Protect role changes and last-admin status.
- Prevent destructive ownership cascades.
- Test tenant isolation with multiple accounts.
