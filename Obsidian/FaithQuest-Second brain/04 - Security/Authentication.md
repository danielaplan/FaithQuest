# Authentication

## Supported methods

- Supabase email/password
- Google OAuth through Supabase

## Configuration locations

- Vercel environment variables
- Supabase Authentication providers
- Supabase URL Configuration
- Google Cloud OAuth credentials

## Required checks

- Project URL and public key belong to the same project.
- Production and localhost callback URLs are allow-listed.
- Google Authorized Redirect URI points to Supabase `/auth/v1/callback`.
- FaithQuest callback exchanges the code and routes by stored profile role.
- Sign-out clears the session and protected routes reject stale sessions.

Passwords are never stored or recoverable in the application database.
