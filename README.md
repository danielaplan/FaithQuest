# FaithQuest

FaithQuest is a child ministry and Bible study tracking system built for Sunday school and youth programs. It helps leaders manage student participation, award faith points, record attendance, organize outreach events, and celebrate spiritual growth through badges, rewards, and quizzes.

The app is designed as a local-first dashboard with optional cloud persistence through Supabase, making it easy to use in sessions without a backend while still supporting remote sync when configured.

## Overview

FaithQuest gives ministry leaders a single place to:

- Track students by group and enrollment date
- Record Sunday school and outreach attendance
- Award points for participation, scripture memorization, helping others, and quiz success
- Unlock achievement badges based on progress milestones
- Assign fish and decor rewards to students
- Create and run Bible quizzes
- Save and restore state across sessions

## Key features

### Student management

- Add and edit student profiles
- Organize students by group or ministry class
- View joined date and all activity history
- Review progress through badges and rewards

### Attendance and participation tracking

- Log Sunday school attendance
- Log outreach attendance
- Track other ministry activities such as Bible verse memorization, discussion participation, event attendance, and helping classmates

### Points and rewards

- Award points for activity completion
- Track each student's total earned points
- Spend points on fish and decor rewards
- Visualize reward collection over time

### Badges and motivation

- Reward progress with themed milestones across categories like:
  - attendance
  - outreach
  - scripture
  - points
  - quiz
  - character
- Automatically update badges as students hit thresholds

### Quiz system

- Create custom Bible-themed quizzes
- Add multiple-choice questions with answer keys
- Score student performance
- Award points based on correct responses

### Persistence

- Saves app state in browser local storage by default
- Supports Supabase-backed persistence for optional cloud syncing
- Restores the previous session automatically when available

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
│   ├── lib/
│   │   └── persistence.ts        # Local and Supabase state persistence
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout and metadata
│   └── page.tsx                  # Main FaithQuest dashboard and logic
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── package-lock.json
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser at:

   ```text
   http://localhost:3000
   ```

## Available scripts

In the project root, you can run:

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Runs the production build locally.

```bash
npm run lint
```

Runs ESLint checks using the project configuration.

## Environment configuration

This app can run in local-only mode without setup. If you want to enable Supabase-backed persistence, create a `.env.local` file in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The app checks for these values and automatically uses Supabase when they are present.

## Notes

- The app is intended for ministry leaders and teachers managing children and youth participation.
- Data is primarily stored client-side unless Supabase is configured.
- It is optimized for quick, in-session tracking during classes, events, and outreach activities.

## License

This project does not currently include a custom license file. If you plan to distribute it publicly or in a team environment, add the appropriate open-source or internal-use licensing terms before deployment.
