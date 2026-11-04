# Vercel Deployment

## Pre-deployment

- Reviewed commit identified
- Build passes
- Lint and tests pass
- Migration impact reviewed
- Environment configuration verified
- Backup and rollback evidence recorded

## Deployment

1. Deploy the reviewed commit.
2. Record deployment URL and commit hash.
3. Verify authentication and protected routes.
4. Run critical teacher/admin smoke tests.
5. Record results in `09 - Evidence/Deployment Evidence`.

A completed Vercel build does not prove database or OAuth correctness.
