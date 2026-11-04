# Environment Configuration

Required variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Rules

- URL and key must come from the same Supabase project.
- Configure Local, Preview, and Production environments deliberately.
- Never commit private service-role keys.
- Redeploy Vercel after production environment changes.
- Record variable names and purpose, never secret values, in this vault.
