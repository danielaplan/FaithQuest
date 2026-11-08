# FaithQuest

FaithQuest is a teacher-first ministry management and classroom gamification app for Sunday schools, youth groups, and outreach programs. It helps ministry leaders manage classes and students, award Faith Points, track attendance, unlock badges, run Bible quizzes, and celebrate growth in a fun, game-like classroom experience.

The app combines authenticated teacher and administrator portals with a live classroom experience. Teachers use fast controls to award points and track participation in real time, while students participate through the teacher-controlled projector or shared-screen view without needing individual accounts.

## Overview

FaithQuest gives ministry leaders a connected system to:

- Sign in as a teacher or administrator
- Manage churches, teachers, classes, and student profiles
- Open class-specific classroom workspaces
- Record Sunday School and Outreach attendance
- Award points for participation, scripture memorization, helping others, and quiz success
- Unlock progression badges and motivational milestones
- Redeem fish and decor rewards from a reward catalog
- Create and run Bible quizzes live in class
- Maintain session continuity with browser storage or Supabase persistence
- View organization-wide analytics as an administrator

## Core features

### Student dashboard

- Add and manage students by group or class
- Review each student’s points, rewards, and badges
- View recent activity and progress highlights
- Explore student profiles in a visual ministry dashboard

### Teacher dashboard

- View all classes owned by the signed-in teacher
- Create new classes and generate join codes
- Open a classroom scoped to a specific class
- See class student counts and recent activity

### Administrator portal

- View system-wide churches, teachers, classes, and students
- Manage churches, teachers and staff, and classes
- Review student, attendance, points, quiz, badge, and Faith Tree analytics
- Use protected administrator navigation and role-based access control

### Attendance tracking

- Track Sunday School attendance separately from Outreach attendance
- Use a shared date selector for same-day tracking
- Mark each student present or absent with quick toggles
- Automatically award points for attendance entries

### Live points and rewards

- Award points instantly from a teacher-friendly control panel
- Support quick preset actions such as +5, +10, +15, and +20
- Enter custom activity labels for each award
- Redeem reward items such as fish and decor using point totals

### Badges and progression

- Trigger automatic badge checks after attendance, quiz results, and point awards
- Include badge categories for attendance, outreach, scripture, points, quiz performance, and character
- Display unlock conditions and progression in the student experience

### Quiz system

- Build Bible-themed quizzes with multiple-choice questions
- Set custom points per correct answer
- Run quizzes live and reveal correct answers during class
- Award points based on student performance and question accuracy

### Persistence

- Use Supabase PostgreSQL as the authoritative store for shared classroom data
- Store only local UI preferences such as theme and sound in browser storage
- Synchronize authorized classroom changes through Supabase Realtime
- Archive students and preserve historical activities

### Authentication and access

- Supabase Auth supports email/password and Google OAuth sign-in
- User profiles determine teacher or administrator access
- Unauthenticated users are redirected to `/auth/signin`
- Teachers are routed to `/dashboard`
- Administrators are routed to `/admin`
- Each teacher classroom is available at `/teacher/[classId]`
- Middleware refreshes sessions and protects dashboard, classroom, and admin routes

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Supabase Auth, database, and optional realtime persistence
- `@supabase/ssr` for browser, server, and middleware clients
- Lucide React icons
- Recharts for analytics visualizations

## Project structure

```text
.
├── app/
│   ├── admin/             # Protected administrator portal and analytics
│   ├── auth/              # Sign in, sign up, and OAuth callback
│   ├── components/        # Shared UI primitives
│   ├── dashboard/         # Teacher class dashboard
│   ├── teacher/[classId]/ # Class-scoped classroom experience
│   ├── fq-admin-7m3p/     # Administrator sign-in entry
│   ├── lib/
│   │   ├── persistence.ts
│   │   └── supabase/      # Supabase browser, server, and middleware clients
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── FaithQuest-Redesign-Plan.md
├── proxy.ts               # Session refresh and route protection
├── supabase/migrations/   # Multitenancy and RLS database schema
├── design-system/         # FaithQuest visual design references
├── design-system/
│   └── faithquest/
├── context/
├── lib/
├── styles/
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── README.md
├── next-env.d.ts
└── package-lock.json
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local development server:

   ```bash
   npm run dev
   ```

3. Open the app in a browser:

   ```text
   http://localhost:3000
   ```

## Available scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Creates a production build for deployment.

```bash
npm run start
```

Runs the production build locally.

```bash
npm run lint
```

Runs ESLint checks against the project.

## Environment configuration

Multi-user development requires a configured Supabase project. Create a `.env.local` file in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The URL and public key must belong to the same Supabase project. Never expose a service-role key in a browser environment variable.

## Database migrations

Apply the SQL migrations in numeric order to an isolated Supabase project before production:

1. `01_multitenancy_schema.sql`
2. `02_fix_rls_policies.sql`
3. `03_add_updated_at_soft_delete.sql`
4. `04_multi_user_security.sql`
5. `05_multi_user_classroom.sql`
6. `06_admin_analytics.sql`
7. `07_classroom_commands.sql`
8. `08_class_scoped_realtime.sql`
9. `09_admin_directory_consistency.sql`

Migrations 04–09 secure role changes and ownership, add relational badge awards, seed stable catalogs, move admin aggregation into PostgreSQL, add idempotent classroom commands, scope Realtime invalidation to one class, and keep staff/church/class assignments consistent. Back up and restore-test any existing project before applying them.

## Notes

- This project is intended for ministry leaders and teachers managing kids and youth engagement.
- Data is stored in browser storage for local classroom use and in Supabase when configured.
- The interface is optimized for quick, classroom-friendly operation during lessons, events, and outreach programs.
- Classroom data should remain scoped to the selected class when using the multitenant Supabase schema.

## License

This project does not currently include a license file. If you plan to distribute or deploy it publicly, add the appropriate licensing terms before release.
