# Google OAuth Setup

## Google Cloud

Authorized redirect URI:

```text
https://PROJECT-REF.supabase.co/auth/v1/callback
```

## Supabase URL Configuration

- Site URL: official production FaithQuest URL
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - official production `/auth/callback`
  - reviewed Vercel preview pattern if previews require OAuth

## Verification

Test new user, existing teacher, existing admin, rejected redirect, logout, and session refresh.
