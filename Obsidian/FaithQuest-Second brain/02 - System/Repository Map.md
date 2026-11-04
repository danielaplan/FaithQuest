# Repository Map

Repository: `C:\Users\acer\Desktop\Outreach`

| Path | Responsibility |
|---|---|
| `app/auth` | Sign-in, signup, and OAuth callback |
| `app/dashboard` | Teacher class dashboard |
| `app/teacher/[classId]` | Class-scoped classroom entry |
| `app/admin` | Administrator portal and analytics |
| `app/page.tsx` | Main classroom application and domain behavior |
| `app/lib/persistence.ts` | LocalStorage and Supabase synchronization |
| `app/lib/supabase` | Browser/server Supabase clients and session middleware |
| `supabase/migrations` | Schema, RLS, soft-delete, and audit migrations |
| `middleware.ts` | Route/session protection; deprecated name in Next.js 16 |

## High-change areas

- Authentication and authorization
- Persistence and offline behavior
- Database migrations and RLS
- Classroom state in `app/page.tsx`

## Refactoring boundary

Split the classroom by domain responsibility only when behavior is covered by tests: students, attendance/points, quizzes, badges/rewards, and persistence.
