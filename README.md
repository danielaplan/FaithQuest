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

- Store application state in local browser storage by default
- Support Supabase-backed persistence when environment variables are configured
- Restore prior state automatically across sessions

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
├── middleware.ts          # Session refresh and route protection
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

The app works in local-only mode without any setup. If you want to enable optional Supabase persistence, create a `.env.local` file in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

When those values are present, the app uses Supabase Auth and database-backed persistence. Without them, the local classroom persistence layer can still be used for local development, but authenticated portal features require a configured Supabase project.

## Notes

- This project is intended for ministry leaders and teachers managing kids and youth engagement.
- Data is stored in browser storage for local classroom use and in Supabase when configured.
- The interface is optimized for quick, classroom-friendly operation during lessons, events, and outreach programs.
- Classroom data should remain scoped to the selected class when using the multitenant Supabase schema.

## License

This project does not currently include a license file. If you plan to distribute or deploy it publicly, add the appropriate licensing terms before release.
