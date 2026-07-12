# FaithQuest — Major Redesign (Updated Plan)

## What This Changes

A complete rebuild as a **single teacher-controlled gamification display board**.
No student logins. No portals. Teacher runs it on a projector or screen.
Students watch and participate in real time.

---

> [!IMPORTANT]
> Complete rewrite of `page.tsx` and `globals.css`. Student data in `localStorage` stays compatible.

> [!WARNING]
> Portal selector is **fully removed**. One unified interface. No login of any kind.

---

## Navigation — 8 Tabs

| Tab | Icon | Purpose |
|-----|------|---------|
| **Dashboard** | 🏠 | Improved class overview with teacher quick-tools |
| **Students** | 👥 | Big student cards — profile, aquarium, faith tree, badges |
| **Attendance** | ✅ | Two sections: Sunday School & Outreach, auto-award points |
| **Live Points** | ⚡ | Instantly award any points to any student on the spot |
| **Quiz Builder** | 📝 | Pre-build multiple-choice quizzes, save for later |
| **Run Quiz** | 🎯 | Display quiz live, reveal answers, tap who got it right |
| **Leaderboard** | 🏆 | Full public rankings board |
| **Manage** | ⚙️ | Add/remove students, backup/restore, export CSV |

---

## 1. DASHBOARD (Improved for Teachers)

### Stats Row
- Total students enrolled
- Total Faith Points awarded today
- Present today (Sunday School + Outreach combined)
- Total quizzes run this session

### Top Student Spotlight
- Animated featured card for the #1 ranked student

### Quick Actions Panel (new)
Buttons for the most common teacher actions without switching tabs:
- ✅ Mark Attendance (opens quick attendance popup)
- ⚡ Quick Award Points (opens student picker + points)
- 🎯 Launch Last Quiz (re-run most recent quiz)
- ➕ Add Student (opens mini form)

### Class Health Alerts (new)
Auto-generated alerts visible to teacher:
- "🔔 Joshua is 10 pts away from a new badge!"
- "🔔 3 students have not attended in 2+ weeks"
- "🔔 Mika just unlocked a new badge: Scripture Learner!"
- "🎉 5 students hit 100 pts this week!"

### Recent Activity Feed
Last 15 point-award events across all students, real-time updated.

### Faith Tree Distribution Chart
Visual breakdown of how many students are at each tree level.

---

## 2. STUDENTS TAB

### Student Grid
- Large, vibrant, colorful cards for every student
- Each card shows: name, group, total Faith Points, badge count, top 3 badges
- Clicking a card → **Full Profile Modal/Overlay**:
  - Aquarium animation
  - Faith Tree visual
  - Full badge list
  - Complete activity history

### Badge Info Panel (always visible on this tab)
- A section titled **"How to Earn Badges"** lists ALL badges
- Each badge shows: icon, name, condition to earn it
- For students with no badges yet → clearly shows what they need to do first
- Badges the student already has are shown as unlocked (highlighted)
- Locked badges are shown grayed out with the requirement text

---

## 3. EXPANDED BADGE SYSTEM (25+ Auto-Awarded Badges)

Badges are **automatically awarded** whenever a student's stats hit the condition.
The system checks after every point award, attendance mark, or quiz completion.

### Attendance Badges
| Badge | Condition |
|-------|-----------|
| First Steps | Attend 1 session |
| Faithful Beginner | Attend 5 sessions |
| Dedicated Learner | Attend 10 sessions |
| Consistent Member | Attend 20 sessions |
| Always Present | Attend 50 sessions |
| Sunday Champion | Attend 10 Sunday School sessions |
| Outreach Hero | Attend 5 Outreach events |

### Outreach Badges (new category)
| Badge | Icon | Condition |
|-------|------|-----------|
| First Mission | 🌱 | Attend 1 Outreach |
| Outreach Faithful | 🌿 | Attend 3 Outreach events |
| Outreach Hero | 🌍 | Attend 5 Outreach events |
| Mission Dedicated | ✝️ | Attend 10 Outreach events |
| Outreach Champion | 🏅 | Attend 20 Outreach events |
| Mission Legend | 👑 | Attend 50 Outreach events |

These sit alongside the Sunday School attendance badges as their own category, auto-awarded the moment a student hits each milestone.

> Note: "Outreach Hero" appears in both the general Attendance Badges list (5 Outreach events) and the new Outreach Badges category (🌍, 5 Outreach events) — these are the same badge/condition and should be deduplicated into a single badge definition when implemented, living under the Outreach Badges category.

### Scripture Badges
| Badge | Condition |
|-------|-----------|
| Verse Explorer | Memorize 1 Bible verse |
| Scripture Learner | Memorize 5 verses |
| Word Keeper | Memorize 10 verses |
| Scripture Master | Memorize 20 verses |
| Living Word | Memorize 50 verses |

### Points / Performance Badges
| Badge | Condition |
|-------|-----------|
| Faith Starter | Earn 50 Faith Points |
| Growing in Faith | Earn 100 Faith Points |
| Shining Light | Earn 200 Faith Points |
| Role Model | Earn 300 Faith Points |
| Faith Champion | Earn 500 Faith Points |
| Legendary | Earn 1000 Faith Points |

### Quiz / Trivia Badges
| Badge | Condition |
|-------|-----------|
| Quiz Taker | Answer 1 quiz correctly |
| Bible Scholar | Answer 10 quizzes correctly |
| Trivia Master | Answer 25 quizzes correctly |

### Character / Helping Badges
| Badge | Condition |
|-------|-----------|
| Kind Heart | Help a classmate 1 time |
| Servant Leader | Help a classmate 5 times |
| Community Pillar | Help a classmate 10 times |

Each badge has:
- A unique emoji icon
- A short name
- A description / flavor text
- The exact unlock condition

---

## 4. ATTENDANCE TAB (Two Sections, Same Sunday)

Sunday School and Outreach both happen the same day — Sunday School first, then Outreach right after. They're always on the same date but tracked separately as two independent attendance records.

### Layout
Two clearly separated panels side by side (or stacked on mobile):
- **Sunday School** (left)
- **Outreach** (right)

### Shared Date Picker
- **One date picker shared by both sections** (defaults to today), since both always fall on the same Sunday
- No need to pick the date twice — selecting a date updates both panels at once

### Each Section Has:
- "Mark All Present" shortcut button
- Student list — each student has a **Present / Absent** toggle button
  - Present = green highlight + checkmark
  - Absent = neutral/gray
- Attendance summary: "X of Y students present"
- Confirmation animation when tapping Present

### Independent Tracking
- A student can be marked present for Sunday School but absent/missing for Outreach, or attend both
- Marking one section does not affect the other — they're recorded as separate attendance entries for the same date

### Auto-Point Award on Attendance
When a student is marked **Present**:
- **Sunday School** → automatically awards **+10 Faith Points** (label: "Sunday School Attendance")
- **Outreach** → automatically awards **+15 Faith Points** (label: "Outreach Attendance")
- Points are only awarded once per student per date per section
- If already marked for that date, toggling again removes the attendance (and the points)

### Typical Sunday Flow
1. Teacher opens the Attendance tab
2. Picks the Sunday date (defaults to today) — applies to both sections
3. Marks Sunday School attendance → points awarded
4. After Sunday School ends, marks Outreach attendance → more points awarded

### Badge Check
After marking attendance in either section, the system auto-checks and awards any newly earned badges (including the new Outreach Badges category).

---

## 5. LIVE POINTS TAB

- All student cards in a grid
- Each card: name, group, current total pts, session gain badge
- Quick-tap preset buttons: **+5 / +10 / +15 / +20**
- Custom number input + Award button
- Activity label field at top (e.g. "Helped clean the room")
- Celebration animation (pulse + pop) on the card when points awarded
- Running session log at bottom (time, student, label, points)
- "Reset Session Log" button

---

## 6. QUIZ BUILDER TAB

Teacher builds quizzes in advance:
- Quiz title (e.g. "Week 3 Bible Quiz")
- Points per correct answer (default: 15, teacher sets any number)
- Add questions dynamically (no limit):
  - Question text
  - 2 to 6 answer options (add/remove)
  - Mark which option is correct
- Save quiz → stored in localStorage
- Saved quizzes list: title, question count, points per question
- Each saved quiz has: **Edit**, **Delete**, **Launch** buttons

---

## 7. RUN QUIZ TAB (Live Quiz Mode)

Flow:
1. Teacher picks a saved quiz to launch
2. **Question Display Screen** — large readable text, all answer options shown (A, B, C, D...)
3. Teacher reads question aloud to students
4. **"Reveal Answer"** button → correct answer highlighted green
5. **Student Cards** appear below → teacher taps each student who got it right
6. Points automatically added to tapped students, animated confirmation
7. **"Next Question"** → repeats for all questions
8. After last question → **Quiz Session Leaderboard** shows:
   - Who got the most correct in this quiz
   - Points earned in this quiz session
   - Overall rank change (↑/↓)

---

## 8. LEADERBOARD TAB

- Full-screen public rankings
- Top 3 with gold/silver/bronze animated styling
- All students listed below with rank, name, group, total points, badge count

---

## 9. MANAGE TAB

- Add student (name + group)
- Student list with Remove button + confirmation
- Backup → download JSON
- Restore → upload JSON
- Export → download CSV

---

## Technical Notes

### Types to Add
```ts
type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string; // human-readable
  category: "attendance" | "outreach" | "scripture" | "points" | "quiz" | "character";
  check: (student: Student) => boolean; // auto-check function
};

type AttendanceRecord = {
  studentId: string;
  date: string; // shared Sunday date
  sundaySchoolPresent: boolean;
  outreachPresent: boolean;
};

type SavedQuiz = {
  id: string;
  title: string;
  pointsPerCorrect: number;
  questions: QuizQuestion[];
  createdAt: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};
```

### localStorage Keys
- `faithquest-students` — student data (existing, compatible)
- `faithquest-attendance` — attendance records, keyed by shared date (new/updated)
- `faithquest-quizzes` — saved quizzes (new)
- `faithquest-theme` — theme (existing)

### Auto-Badge Check
- Runs after every: point award, attendance mark (Sunday School or Outreach), quiz correct answer
- Compares student stats against all 25+ badge conditions (including the Outreach Badges category)
- Newly earned badges are added to `student.badges[]` automatically
- Flash notification shown: "🏅 [Name] earned: [Badge Name]!"

---

## Verification Plan
- All 8 tabs load without error
- Attendance: shared date picker updates both Sunday School and Outreach panels
- Attendance: mark Sunday School present → +10 pts added, badge check runs
- Attendance: mark Outreach present (same date, after Sunday School) → +15 pts added, tracked independently
- Attendance: student can be present for one section and absent for the other on the same date
- Badge info panel shows all badges with conditions, including the new Outreach Badges category
- Earning a badge (including Outreach badges) → auto-awarded, flash shown
- Quiz Builder: create quiz → appears in saved list → launch it
- Run Quiz: question displays large → reveal → tap students → quiz leaderboard at end
- Dashboard alerts show correct near-badge warnings
- Manage: add/remove students, backup/restore round-trip
