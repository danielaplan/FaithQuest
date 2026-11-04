# Release Checklist

## Code

- [ ] Exact commit recorded
- [ ] Production build passes
- [ ] Lint passes
- [ ] Automated tests pass
- [ ] No unresolved critical findings

## Database and security

- [ ] Migration tested in isolation
- [ ] RLS tests pass with separate sessions
- [ ] Backup restored successfully
- [ ] Ownership/deletion impact reviewed

## Deployment

- [ ] Environment variables verified
- [ ] OAuth redirect configuration verified
- [ ] Rollback steps prepared
- [ ] Production smoke tests pass
- [ ] Evidence saved

## Acceptance

- [ ] Product owner accepts the release
- [ ] Remaining limitations are documented
