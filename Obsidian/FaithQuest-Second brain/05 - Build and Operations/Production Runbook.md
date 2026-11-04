# Production Runbook

## Authentication failure

1. Confirm Supabase project health.
2. Verify the exact project hostname using public DNS.
3. Check Vercel environment variables.
4. Check Supabase URL Configuration.
5. Check Google callback configuration.
6. Separate browser cache symptoms from server failure.

## Data issue

1. Stop destructive changes.
2. Record user, class, timestamp, and action.
3. Preserve logs and screenshots.
4. Check database records and RLS using the correct role.
5. Verify backup before repair.
6. Record repair and independent verification.

## Deployment issue

1. Identify deployed commit and environment.
2. Compare source, build output, and production behavior.
3. Roll back only to a known verified deployment.
