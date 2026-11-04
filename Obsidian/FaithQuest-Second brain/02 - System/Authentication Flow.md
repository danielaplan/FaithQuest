# Authentication Flow

## Email/password

1. User submits credentials to Supabase Auth.
2. Supabase returns a session cookie.
3. Next.js Proxy refreshes and validates the session.
4. The application reads `public.profiles.role`.
5. Admins route to `/admin`; teachers route to `/dashboard`.

## Google OAuth

1. Application redirects to the Supabase Google authorization endpoint.
2. Google redirects to the Supabase callback.
3. Supabase redirects to `/auth/callback` in FaithQuest.
4. The callback exchanges the code, verifies the user, and loads the profile.
5. Role determines the destination.

## Security requirements

- New profiles always receive `teacher` from trusted database logic.
- Client metadata never decides authority.
- Only a protected admin operation changes roles.
- The final administrator cannot be demoted or deleted.
- Supabase Redirect URLs and Google callback URLs must be exact.
