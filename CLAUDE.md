# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FaithQuest** is a teacher-first ministry tracking app for Sunday school, youth groups, and outreach programs. Built with Next.js 16, React 19, TypeScript, and Supabase (optional). It runs as a single-page client-side application with client-side state persistence (localStorage by default, Supabase when configured).

### Key Features
- Student management (add, group, delete, profile view)
- Attendance tracking (Sunday School vs Outreach)
- Live points awarding with presets (+5, +10, +15, +20) and custom amounts
- Badge system with 6 categories (attendance, outreach, scripture, points, quiz, character)
- Reward catalog (fish & decor items purchased with points)
- Quiz builder & live projector mode for classroom use
- Faith Tree progression visualization (5 levels: Seed → Sapling → Growing Tree → Blossom Tree → Tree of Wisdom)
- Student aquarium with collectible fish/decor
- Data export (CSV/JSON) and import/restore

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Turbopack)
npm run dev

# Production build
npm run build

# Run production build locally
npm run start

# Lint (ESLint with Next.js config)
npm run lint
```

## Architecture

### Single-File SPA Structure
The entire application lives in **`app/page.tsx`** (~3,450 lines). This is a deliberate choice for a teacher-facing classroom tool that runs on a projector. All state, components, logic, and views are in one file using React hooks.

### State Management
- **Local React state** (`useState`) for all UI state: students, quizzes, theme, sound, modals, filters, etc.
- **No global store** (Redux, Zustand, Context) — everything is in the root `Home` component
- **Persistence layer** in `app/lib/persistence.ts` handles localStorage + optional Supabase sync

### Key Type Definitions (in `app/page.tsx`)
```typescript
type ActivityKind = "attendance" | "outreach" | "verse" | "quiz" | "discussion" | "bible" | "event" | "helping" | "custom"

type Activity = { id, date, kind, label, points }
type Student = { id, name, group, joinedAt, activities[], rewards[], badges?[] }
type Reward = { id, name, cost, type: "fish" | "decor" }
type QuizQuestion = { id, question, options[4], correctIndex }
type SavedQuiz = { id, title, pointsPerCorrect, questions[], createdAt }
type Badge = { id, name, icon, description, condition, category, check(student) => boolean }
```

### 8 Main Views (Tabs)
1. **Dashboard** — Spotlight student, quick actions, activity feed, tree distribution
2. **Students** — Searchable/filterable grid, click for profile modal
3. **Attendance** — Session type + date, multi-select checkbox grid, bulk save
4. **Live Points** — Student picker + point presets + custom form + live session log
5. **Quiz Builder** — Create/edit quizzes with 4-option multiple choice questions
6. **Run Quiz** — Projector-optimized: question → options → reveal → award → next
7. **Leaderboard** — Podium (top 3) + full ranked table with Faith Tree levels
8. **Manage** — Student roster CRUD, data export/import/reset, audio test pad

### Persistence (`app/lib/persistence.ts`)
- **localStorage** (default): key `faithquest-state-v2`, auto-migrates from legacy keys
- **Supabase** (optional): requires `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Real-time sync via Supabase Realtime channel `faithquest-state-changes`
- State shape: `{ students, quizzes, theme, sound }`

### Theming
3 themes controlled by `[data-theme]` on `<html>`: `emerald` (default), `gold`, `aqua`. All colors via CSS custom properties in `app/globals.css`.

### Design System (Claymorphic)
- **Clay cards**: elevated with layered shadows, hover lift
- **Clay buttons**: tactile 3D press (shadow offset on active), 4 variants (primary, accent, secondary, danger)
- **Fonts**: Baloo 2 (headings), Plus Jakarta Sans (body), Outfit (fallback)
- **Animations**: respect `prefers-reduced-motion`

### Audio Feedback
Synthetic Web Audio API sounds (no assets): `sparkles`, `success`, `fanfare`, `splash`, `pop`. Controlled by `soundOn` state.

## Important Patterns

### Adding a New Activity Type
1. Add to `ActivityKind` union
2. Add entry to `activityOptions` catalog (label + points)
3. Add badge definitions in `badgeDefinitions` if needed
4. Update `checkAndAwardBadges` logic if badge conditions reference it

### Adding a Badge
Push to `badgeDefinitions` array with:
- Unique `id`
- `check: (student) => boolean` predicate
- Category for grouping

### Modifying Reward Catalog
Edit `rewardCatalog` array. Fish types (`small-fish`, `color-fish`, `rare-fish`, `golden-fish`) render in aquarium; decor types (`water-plant`, `castle`, `coral`, `rocks`) render on sand.

### Faith Tree Levels
`treeLevel(points)` returns `{ level, name, stage, percent, nextAt, icon }`. Thresholds: 80, 220, 400, 650.

## Environment

```bash
# Optional Supabase persistence
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## File Map
```
app/
├── page.tsx              # Main application (all views, state, logic) ~3,450 lines
├── layout.tsx            # HTML shell, fonts, metadata
├── globals.css           # Design system, themes, animations (claymorphic, CSS variables)
├── lib/
│   └── persistence.ts    # localStorage + Supabase sync (multi-tenant class support)
├── components/           # (empty - all components in page.tsx)
└── FaithQuest-Redesign-Plan.md  # Complete redesign spec (25+ badges, new attendance flow, quiz modes)

.next/                    # Next.js build output (gitignored)
node_modules/             # Dependencies (gitignored)
```

## Multi-Tenant Architecture (Supabase)

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured:

- **Authentication**: Supabase Auth with email/password + magic links
- **RLS Policies**: Row-level security on `students`, `activities`, `quizzes`, `teacher_classes` tables
- **Class Isolation**: Each teacher gets a `class_id` — all data scoped to their class
- **Real-time Sync**: Supabase Realtime channels (`faithquest-class-{classId}`) for live collaboration
- **Admin Dashboard**: Teacher can manage class settings, view analytics
- **Schema**: `teacher_classes`, `students`, `activities`, `quizzes`, `student_rewards` tables

The app gracefully falls back to localStorage-only mode when Supabase env vars are absent.

## Testing
No test framework configured. Manual testing via `npm run dev` on `http://localhost:3000`.

## Deployment
Standard Next.js deployment (Vercel recommended). No server-side logic — fully static export compatible if Supabase env vars omitted.