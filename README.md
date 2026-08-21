# FaithQuest

FaithQuest is a teacher-first ministry tracking app for Sunday school, youth groups, and outreach programs. It helps leaders manage students, award faith points, track attendance, unlock badges, run Bible quizzes, and celebrate growth in a fun, game-like classroom experience.

The app is designed for live use on a projector or shared screen during class. It keeps the experience simple: one unified interface, no student login flow, and fast teacher controls for awarding points and tracking participation in real time.

## Overview

FaithQuest gives ministry leaders a single place to:

- Manage student profiles and groups
- Record Sunday School and Outreach attendance
- Award points for participation, scripture memorization, helping others, and quiz success
- Unlock progression badges and motivational milestones
- Redeem fish and decor rewards from a reward catalog
- Create and run Bible quizzes live in class
- Maintain session continuity with browser storage or Supabase persistence

## Core features

### Student dashboard

- Add and manage students by group or class
- Review each student’s points, rewards, and badges
- View recent activity and progress highlights
- Explore student profiles in a visual ministry dashboard

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

## Tech stack

- Next.js
- React
- TypeScript
- Lucide React icons
- Supabase client for optional cloud persistence

## Project structure

```text
.
├── app/
│   ├── components/
│   ├── lib/
│   │   └── persistence.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── FaithQuest-Redesign-Plan.md
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

When those values are present, the app automatically uses Supabase-backed persistence instead of relying only on browser storage.

## Notes

- This project is intended for ministry leaders and teachers managing kids and youth engagement.
- Data is primarily stored client-side unless Supabase is configured.
- The interface is optimized for quick, classroom-friendly operation during lessons, events, and outreach programs.

## License

This project does not currently include a license file. If you plan to distribute or deploy it publicly, add the appropriate licensing terms before release.
