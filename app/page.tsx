"use client";

import {
  Award,
  CalendarDays,
  Check,
  Fish,
  Leaf,
  Medal,
  Plus,
  Sparkles,
  Sprout,
  Trophy,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Palette,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Upload,
  Home as HomeIcon,
  Zap,
  ClipboardList,
  Target,
  Settings,
  Trash2,
  Edit,
  Play,
  CheckSquare,
  AlertCircle,
  HelpCircle,
  Search,
  Activity,
  X,
  ArrowUp
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { loadPersistedState, savePersistedState } from "./lib/persistence";

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export type ActivityKind =
  | "attendance"
  | "outreach"
  | "verse"
  | "quiz"
  | "discussion"
  | "bible"
  | "event"
  | "helping"
  | "custom";

export type Activity = {
  id: string;
  date: string;
  kind: ActivityKind;
  label: string;
  points: number;
};

export type Student = {
  id: string;
  name: string;
  group: string;
  joinedAt: string;
  activities: Activity[];
  rewards: string[];
  badges?: string[];
};

export type Reward = {
  id: string;
  name: string;
  cost: number;
  type: "fish" | "decor";
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type SavedQuiz = {
  id: string;
  title: string;
  pointsPerCorrect: number;
  questions: QuizQuestion[];
  createdAt: string;
};

export type AttendanceRecord = {
  date: string;
  sundaySchool: string[]; // List of student IDs present
  outreach: string[];     // List of student IDs present
};

export type BadgeCategory =
  | "attendance"
  | "outreach"
  | "scripture"
  | "points"
  | "quiz"
  | "character";

export type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  category: BadgeCategory;
  check: (student: Student) => boolean;
};

// ==========================================
// 2. STATIC CONFIGURATIONS & DICTIONARIES
// ==========================================

export const rewardCatalog: Reward[] = [
  { id: "small-fish", name: "Small Fish", cost: 50, type: "fish" },
  { id: "color-fish", name: "Colorful Fish", cost: 100, type: "fish" },
  { id: "rare-fish", name: "Rare Fish", cost: 300, type: "fish" },
  { id: "golden-fish", name: "Golden Fish", cost: 500, type: "fish" },
  { id: "water-plant", name: "Water Plant", cost: 70, type: "decor" },
  { id: "castle", name: "Treasure Castle", cost: 180, type: "decor" },
  { id: "coral", name: "Coral Reef", cost: 140, type: "decor" },
  { id: "rocks", name: "Smooth Rocks", cost: 60, type: "decor" }
];

export const activityOptions: Record<ActivityKind, { label: string; points: number }> = {
  attendance: { label: "Sunday School Attendance", points: 10 },
  outreach: { label: "Outreach Attendance", points: 15 },
  verse: { label: "Bible Verse Memorized", points: 20 },
  quiz: { label: "Quiz Question Correct", points: 15 },
  discussion: { label: "Discussion Participation", points: 5 },
  bible: { label: "Brought Bible", points: 2 },
  event: { label: "Church Event Joined", points: 20 },
  helping: { label: "Helped a Classmate", points: 10 },
  custom: { label: "Custom Teacher Award", points: 5 }
};

// Expanded Badge List (27 badges)
export const badgeDefinitions: Badge[] = [
  // SS Attendance Badges
  {
    id: "first-steps",
    name: "First Steps",
    icon: "👣",
    description: "Attend 1 session",
    condition: "Attend 1 session",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" || a.kind === "outreach").length >= 1
  },
  {
    id: "faithful-beginner",
    name: "Faithful Beginner",
    icon: "🌱",
    description: "Attend 5 sessions",
    condition: "Attend 5 sessions",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" || a.kind === "outreach").length >= 5
  },
  {
    id: "dedicated-learner",
    name: "Dedicated Learner",
    icon: "📖",
    description: "Attend 10 sessions",
    condition: "Attend 10 sessions",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" || a.kind === "outreach").length >= 10
  },
  {
    id: "consistent-member",
    name: "Consistent Member",
    icon: "⚓",
    description: "Attend 20 sessions",
    condition: "Attend 20 sessions",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" || a.kind === "outreach").length >= 20
  },
  {
    id: "always-present",
    name: "Always Present",
    icon: "☀️",
    description: "Attend 50 sessions",
    condition: "Attend 50 sessions",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" || a.kind === "outreach").length >= 50
  },
  {
    id: "sunday-champion",
    name: "Sunday Champion",
    icon: "⛪",
    description: "Attend 10 Sunday School sessions",
    condition: "Attend 10 Sunday School sessions",
    category: "attendance",
    check: (s) => s.activities.filter(a => a.kind === "attendance" && a.label.includes("Sunday School")).length >= 10
  },
  
  // Outreach Badges
  {
    id: "first-mission",
    name: "First Mission",
    icon: "🌱",
    description: "Attend 1 Outreach",
    condition: "Attend 1 Outreach",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 1
  },
  {
    id: "outreach-faithful",
    name: "Outreach Faithful",
    icon: "🌿",
    description: "Attend 3 Outreach events",
    condition: "Attend 3 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 3
  },
  {
    id: "outreach-hero",
    name: "Outreach Hero",
    icon: "🌍",
    description: "Attend 5 Outreach events",
    condition: "Attend 5 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 5
  },
  {
    id: "mission-dedicated",
    name: "Mission Dedicated",
    icon: "✝️",
    description: "Attend 10 Outreach events",
    condition: "Attend 10 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 10
  },
  {
    id: "outreach-champion",
    name: "Outreach Champion",
    icon: "🏅",
    description: "Attend 20 Outreach events",
    condition: "Attend 20 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 20
  },
  {
    id: "mission-legend",
    name: "Mission Legend",
    icon: "👑",
    description: "Attend 50 Outreach events",
    condition: "Attend 50 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter(a => a.kind === "outreach").length >= 50
  },

  // Scripture Badges
  {
    id: "verse-explorer",
    name: "Verse Explorer",
    icon: "🔍",
    description: "Memorize 1 Bible verse",
    condition: "Memorize 1 Bible verse",
    category: "scripture",
    check: (s) => s.activities.filter(a => a.kind === "verse").length >= 1
  },
  {
    id: "scripture-learner",
    name: "Scripture Learner",
    icon: "🧠",
    description: "Memorize 5 verses",
    condition: "Memorize 5 verses",
    category: "scripture",
    check: (s) => s.activities.filter(a => a.kind === "verse").length >= 5
  },
  {
    id: "word-keeper",
    name: "Word Keeper",
    icon: "📥",
    description: "Memorize 10 verses",
    condition: "Memorize 10 verses",
    category: "scripture",
    check: (s) => s.activities.filter(a => a.kind === "verse").length >= 10
  },
  {
    id: "scripture-master",
    name: "Scripture Master",
    icon: "🎓",
    description: "Memorize 20 verses",
    condition: "Memorize 20 verses",
    category: "scripture",
    check: (s) => s.activities.filter(a => a.kind === "verse").length >= 20
  },
  {
    id: "living-word",
    name: "Living Word",
    icon: "🔥",
    description: "Memorize 50 verses",
    condition: "Memorize 50 verses",
    category: "scripture",
    check: (s) => s.activities.filter(a => a.kind === "verse").length >= 50
  },

  // Points Badges
  {
    id: "faith-starter",
    name: "Faith Starter",
    icon: "✨",
    description: "Earn 50 Faith Points",
    condition: "Earn 50 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 50
  },
  {
    id: "growing-in-faith",
    name: "Growing in Faith",
    icon: "📈",
    description: "Earn 100 Faith Points",
    condition: "Earn 100 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 100
  },
  {
    id: "shining-light",
    name: "Shining Light",
    icon: "💡",
    description: "Earn 200 Faith Points",
    condition: "Earn 200 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 200
  },
  {
    id: "role-model",
    name: "Role Model",
    icon: "🌟",
    description: "Earn 300 Faith Points",
    condition: "Earn 300 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 300
  },
  {
    id: "faith-champion",
    name: "Faith Champion",
    icon: "🏆",
    description: "Earn 500 Faith Points",
    condition: "Earn 500 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 500
  },
  {
    id: "legendary",
    name: "Legendary",
    icon: "🛡️",
    description: "Earn 1000 Faith Points",
    condition: "Earn 1000 Faith Points",
    category: "points",
    check: (s) => totalPoints(s).earned >= 1000
  },

  // Quiz Badges
  {
    id: "quiz-taker",
    name: "Quiz Taker",
    icon: "🎯",
    description: "Answer 1 quiz correctly",
    condition: "Answer 1 quiz correctly",
    category: "quiz",
    check: (s) => s.activities.filter(a => a.kind === "quiz").length >= 1
  },
  {
    id: "bible-scholar",
    name: "Bible Scholar",
    icon: "📜",
    description: "Answer 10 quizzes correctly",
    condition: "Answer 10 quizzes correctly",
    category: "quiz",
    check: (s) => s.activities.filter(a => a.kind === "quiz").length >= 10
  },
  {
    id: "trivia-master",
    name: "Trivia Master",
    icon: "👑",
    description: "Answer 25 quizzes correctly",
    condition: "Answer 25 quizzes correctly",
    category: "quiz",
    check: (s) => s.activities.filter(a => a.kind === "quiz").length >= 25
  },

  // Character Badges
  {
    id: "kind-heart",
    name: "Kind Heart",
    icon: "❤️",
    description: "Help a classmate 1 time",
    condition: "Help a classmate 1 time",
    category: "character",
    check: (s) => s.activities.filter(a => a.kind === "helping").length >= 1
  },
  {
    id: "servant-leader",
    name: "Servant Leader",
    icon: "🤝",
    description: "Help a classmate 5 times",
    condition: "Help a classmate 5 times",
    category: "character",
    check: (s) => s.activities.filter(a => a.kind === "helping").length >= 5
  },
  {
    id: "community-pillar",
    name: "Community Pillar",
    icon: "🏛️",
    description: "Help a classmate 10 times",
    condition: "Help a classmate 10 times",
    category: "character",
    check: (s) => s.activities.filter(a => a.kind === "helping").length >= 10
  }
];

const starterStudents: Student[] = [
  {
    id: "joshua",
    name: "Joshua",
    group: "Sunday School",
    joinedAt: "2026-07-01",
    rewards: ["small-fish", "color-fish", "water-plant", "castle"],
    activities: [
      { id: "init-ss-1", date: "2026-07-05", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-ss-2", date: "2026-07-12", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-ss-3", date: "2026-07-19", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-verse", date: "2026-07-12", kind: "verse", label: "Bible Verse Memorized", points: 20 },
      { id: "init-quiz", date: "2026-07-19", kind: "quiz", label: "Quiz Question Correct", points: 15 },
      { id: "init-help", date: "2026-07-19", kind: "helping", label: "Helped a Classmate", points: 10 }
    ],
    badges: []
  },
  {
    id: "mika",
    name: "Mika",
    group: "Sunday School",
    joinedAt: "2026-07-01",
    rewards: ["small-fish", "water-plant", "coral"],
    activities: [
      { id: "init-ss-m1", date: "2026-07-05", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-ss-m2", date: "2026-07-12", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-verse-m", date: "2026-07-12", kind: "verse", label: "Bible Verse Memorized", points: 20 },
      { id: "init-disc-m", date: "2026-07-12", kind: "discussion", label: "Discussion Participation", points: 5 },
      { id: "init-bible-m", date: "2026-07-19", kind: "bible", label: "Brought Bible", points: 2 }
    ],
    badges: []
  },
  {
    id: "elijah",
    name: "Elijah",
    group: "Youth Bible Class",
    joinedAt: "2026-07-01",
    rewards: ["small-fish", "rocks"],
    activities: [
      { id: "init-ss-e1", date: "2026-07-05", kind: "attendance", label: "Sunday School Attendance", points: 10 },
      { id: "init-event-e", date: "2026-07-07", kind: "event", label: "Church Event Joined", points: 20 },
      { id: "init-disc-e", date: "2026-07-12", kind: "discussion", label: "Discussion Participation", points: 5 },
      { id: "init-help-e", date: "2026-07-19", kind: "helping", label: "Helped a Classmate", points: 10 }
    ],
    badges: []
  }
];

const starterQuizzes: SavedQuiz[] = [
  {
    id: "quiz-bible-basics",
    title: "Bible Basics Quiz",
    pointsPerCorrect: 15,
    createdAt: "2026-07-12T12:00:00Z",
    questions: [
      { id: "q1", question: "How many books are in the Bible?", options: ["46", "66", "72", "39"], correctIndex: 1 },
      { id: "q2", question: "What is the first book of the Bible?", options: ["Exodus", "Genesis", "Matthew", "John"], correctIndex: 1 },
      { id: "q3", question: "In what town was Jesus born?", options: ["Nazareth", "Jerusalem", "Bethlehem", "Rome"], correctIndex: 2 }
    ]
  },
  {
    id: "quiz-ot-heroes",
    title: "Old Testament Heroes",
    pointsPerCorrect: 15,
    createdAt: "2026-07-12T12:05:00Z",
    questions: [
      { id: "q4", question: "Who built the Ark according to God's instructions?", options: ["Moses", "Noah", "Abraham", "David"], correctIndex: 1 },
      { id: "q5", question: "Who was swallowed by a great fish when running from God?", options: ["Jonah", "Daniel", "Paul", "Peter"], correctIndex: 0 },
      { id: "q6", question: "What giant did the young boy David defeat with a sling and a stone?", options: ["Goliath", "Og", "Saul", "Samson"], correctIndex: 0 }
    ]
  }
];

// ==========================================
// 3. UTILITIES & REUSABLE LOGIC
// ==========================================

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCalendarDate(dateString: string) {
  const value = new Date(`${dateString}T00:00:00`);
  return value.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export function totalPoints(student: Student) {
  const earned = student.activities.reduce((sum, activity) => sum + activity.points, 0);
  const spent = student.rewards.reduce((sum, rewardId) => {
    const reward = rewardCatalog.find((item) => item.id === rewardId);
    return sum + (reward?.cost ?? 0);
  }, 0);

  return { earned, spent, available: Math.max(earned - spent, 0) };
}

export function treeLevel(points: number) {
  if (points >= 650) {
    return { level: 5, name: "Tree of Wisdom", percent: 100 };
  }
  if (points >= 400) {
    const progress = points - 400;
    return { level: 4, name: "Strong Tree", percent: Math.min(100, Math.round((progress / 250) * 100)) };
  }
  if (points >= 220) {
    const progress = points - 220;
    return { level: 3, name: "Growing Tree", percent: Math.min(100, Math.round((progress / 180) * 100)) };
  }
  if (points >= 80) {
    const progress = points - 80;
    return { level: 2, name: "Young Plant", percent: Math.min(100, Math.round((progress / 140) * 100)) };
  }
  return { level: 1, name: "Seed", percent: Math.min(100, Math.round((points / 80) * 100)) };
}

// Auto badge award scanner
export function checkAndAwardBadges(
  student: Student,
  onAward: (badgeName: string) => void
): Student {
  const currentBadges = student.badges || [];
  const updatedBadges = [...currentBadges];
  let awarded = false;

  badgeDefinitions.forEach((badge) => {
    if (!updatedBadges.includes(badge.id)) {
      if (badge.check(student)) {
        updatedBadges.push(badge.id);
        onAward(badge.name);
        awarded = true;
      }
    }
  });

  if (awarded) {
    return { ...student, badges: updatedBadges };
  }
  return student;
}

const themeStyles = {
  emerald: { "--teal": "#086d64", "--teal-dark": "#034842" } as React.CSSProperties,
  gold: { "--teal": "#b45309", "--teal-dark": "#78350f" } as React.CSSProperties,
  aqua: { "--teal": "#0284c7", "--teal-dark": "#0369a1" } as React.CSSProperties,
};

// ==========================================
// 4. MAIN HOME COMPONENT
// ==========================================

export default function Home() {
  // --- Persistent States ---
  const [students, setStudents] = useState<Student[]>(starterStudents);
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>(starterQuizzes);
  const [theme, setTheme] = useState<"emerald" | "gold" | "aqua">("emerald");
  const [soundOn, setSoundOn] = useState(true);

  // --- UI Navigation / View States ---
  const [activeView, setActiveView] = useState<
    "dashboard" | "students" | "attendance" | "livePoints" | "quizBuilder" | "runQuiz" | "leaderboard" | "manage"
  >("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // --- Modals / Popups States ---
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [showQuickAward, setShowQuickAward] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [pendingDeleteStudentId, setPendingDeleteStudentId] = useState<string | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  // --- Quick Award States (Dashboard / Mini-modal) ---
  const [quickAwardStudentId, setQuickAwardStudentId] = useState("");
  const [quickAwardAmount, setQuickAwardAmount] = useState(10);
  const [quickAwardLabel, setQuickAwardLabel] = useState("");

  // --- Live Points Tab Session State ---
  const [sessionGains, setSessionGains] = useState<Record<string, number>>({});
  const [sessionActivityLog, setSessionActivityLog] = useState<
    Array<{ id: string; time: string; studentName: string; label: string; points: number }>
  >([]);
  const [livePointsLabel, setLivePointsLabel] = useState("");

  // --- Quiz Builder Tab States ---
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderPoints, setBuilderPoints] = useState(15);
  const [builderQuestions, setBuilderQuestions] = useState<QuizQuestion[]>([
    { id: `q-${Date.now()}-0`, question: "", options: ["", ""], correctIndex: 0 }
  ]);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // --- Run Quiz Tab Live States ---
  const [activeQuiz, setActiveQuiz] = useState<SavedQuiz | null>(null);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizState, setQuizState] = useState<"idle" | "question" | "reveal" | "results">("idle");
  const [correctStudentsMap, setCorrectStudentsMap] = useState<Record<string, string[]>>({}); // questionId -> list of studentIds
  const [quizRankSnapshot, setQuizRankSnapshot] = useState<Record<string, number>>({}); // studentId -> rank index (1-based)
  const [quizSessionPoints, setQuizSessionPoints] = useState<Record<string, number>>({}); // studentId -> points earned this quiz

  // --- Add Student Form State ---
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("Sunday School");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 5. LIFECYCLE HOOKS (localStorage Integration)
  // ==========================================

  // On Mount: Load items and sync badge compatibility
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const persisted = await loadPersistedState();
      if (cancelled) return;

      if (!persisted) {
        setStudents(starterStudents);
        setQuizzes(starterQuizzes);
        setTheme("emerald");
        setSoundOn(true);
        return;
      }

      const loadedStudents = Array.isArray(persisted.students)
        ? (persisted.students as Student[])
        : starterStudents;
      const loadedQuizzes = Array.isArray(persisted.quizzes)
        ? (persisted.quizzes as SavedQuiz[])
        : starterQuizzes;

      const migrated = loadedStudents.map((student) => {
        const existingBadges = student.badges || [];
        let sCopy = { ...student, badges: existingBadges };
        badgeDefinitions.forEach((badge) => {
          if (!sCopy.badges?.includes(badge.id) && badge.check(sCopy)) {
            sCopy.badges = [...(sCopy.badges || []), badge.id];
          }
        });
        return sCopy;
      });

      setStudents(migrated);
      setTheme(persisted.theme);
      setSoundOn(persisted.sound);
      setQuizzes(loadedQuizzes);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save app state whenever relevant data changes
  useEffect(() => {
    void savePersistedState({
      students,
      quizzes,
      theme,
      sound: soundOn
    });
  }, [students, quizzes, theme, soundOn]);

  // ==========================================
  // 6. SYNTHETIC SOUND CHIMES & FLASH ALERTS
  // ==========================================

  function playSynthSound(type: "sparkles" | "success" | "splash") {
    if (typeof window === "undefined" || !soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "sparkles") {
        // High sparkling bell arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          gain.gain.setValueAtTime(0.06, now + index * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 0.3);
        });
      } else if (type === "success") {
        // Energetic achievement fanfare
        [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 783.99].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + index * 0.06);
          gain.gain.setValueAtTime(0.08, now + index * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.06);
          osc.stop(now + index * 0.06 + 0.4);
        });
      } else if (type === "splash") {
        // Water bubbles pop sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn("Web AudioContext play synth failed", e);
    }
  }

  function triggerFlash(message: string) {
    setFlashMessage(message);
    setTimeout(() => {
      setFlashMessage((prev) => (prev === message ? null : prev));
    }, 4500);
  }

  function changeTheme(newTheme: "emerald" | "gold" | "aqua") {
    setTheme(newTheme);
    window.localStorage.setItem("faithquest-theme", newTheme);
    playSynthSound("sparkles");
  }

  function toggleSound() {
    const nextSound = !soundOn;
    setSoundOn(nextSound);
    window.localStorage.setItem("faithquest-sound", String(nextSound));
  }

  // ==========================================
  // 7. CORE CORE MUTATOR FUNCTIONS
  // ==========================================

  // Wrap updates to students to enforce badge rules & notifications
  const modifyStudents = (updater: (prev: Student[]) => Student[]) => {
    setStudents((prev) => {
      const nextList = updater(prev);
      return nextList.map((student) => {
        return checkAndAwardBadges(student, (badgeName) => {
          triggerFlash(`🏅 ${student.name} unlocked the badge: ${badgeName}!`);
          playSynthSound("success");
        });
      });
    });
  };

  // Add a new Student
  function handleAddStudent(name: string, groupName: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const newS: Student = {
      id: newId,
      name: trimmed,
      group: groupName || "Sunday School",
      joinedAt: today(),
      activities: [],
      rewards: [],
      badges: []
    };

    modifyStudents((curr) => [...curr, newS]);
    triggerFlash(`🎉 Added student: ${trimmed}!`);
    playSynthSound("success");
  }

  // Award custom points
  function awardPoints(studentId: string, amount: number, labelText: string) {
    const label = labelText.trim() || "Teacher Reward";
    const dateStr = today();
    const actId = `award-${studentId}-${Date.now()}`;

    modifyStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          activities: [
            ...student.activities,
            { id: actId, date: dateStr, kind: "custom", label, points: amount }
          ]
        };
      })
    );

    // Track Session Gains
    setSessionGains((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || 0) + amount
    }));

    // Find student name
    const studentName = students.find((s) => s.id === studentId)?.name || "Student";
    const timeStr = new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSessionActivityLog((prev) => [
      { id: actId, time: timeStr, studentName, label, points: amount },
      ...prev
    ]);

    playSynthSound("sparkles");
  }

  // Delete Student helper
  function requestDeleteStudent(studentId: string) {
    const s = students.find((item) => item.id === studentId);
    if (!s) return;
    setPendingDeleteStudentId(studentId);
    setDeleteConfirmationName(s.name);
    setDeleteConfirmationInput("");
  }

  function handleConfirmDelete() {
    if (!pendingDeleteStudentId) return;
    if (deleteConfirmationInput !== deleteConfirmationName) {
      triggerFlash("Name did not match. Removal canceled.");
      setPendingDeleteStudentId(null);
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== pendingDeleteStudentId));
    triggerFlash(`Removed student ${deleteConfirmationName}.`);
    setPendingDeleteStudentId(null);
    playSynthSound("success");
  }

  // Unlock virtual reward
  function unlockReward(studentId: string, rewardId: string) {
    const s = students.find((item) => item.id === studentId);
    const reward = rewardCatalog.find((r) => r.id === rewardId);
    if (!s || !reward) return;

    const points = totalPoints(s);
    if (points.available < reward.cost) {
      triggerFlash(`❌ Not enough points to unlock ${reward.name}!`);
      return;
    }

    if (s.rewards.includes(rewardId)) {
      triggerFlash(`❌ Already unlocked ${reward.name}!`);
      return;
    }

    modifyStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        return {
          ...student,
          rewards: [...student.rewards, rewardId]
        };
      })
    );

    triggerFlash(`🐠 ${s.name} unlocked: ${reward.name}!`);
    playSynthSound("splash");
  }

  // ==========================================
  // 8. TABS CALCULATED DATA
  // ==========================================

  // Leaderboard ranking memo
  const rankedStudents = useMemo(() => {
    return [...students].sort((a, b) => totalPoints(b).earned - totalPoints(a).earned);
  }, [students]);

  // SS present and Outreach present list helper mapped by date picker
  const ssPresentList = useMemo(() => {
    return students
      .filter((s) =>
        s.activities.some(
          (a) => a.date === attendanceDate && a.kind === "attendance" && a.id.startsWith("ss-attendance")
        )
      )
      .map((s) => s.id);
  }, [students, attendanceDate]);

  const outreachPresentList = useMemo(() => {
    return students
      .filter((s) =>
        s.activities.some(
          (a) => a.date === attendanceDate && a.kind === "outreach" && a.id.startsWith("outreach-attendance")
        )
      )
      .map((s) => s.id);
  }, [students, attendanceDate]);

  // Attendance Toggles
  function toggleSundaySchool(studentId: string, checked: boolean) {
    const actId = `ss-attendance-${studentId}-${attendanceDate}`;
    modifyStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        let acts = [...student.activities];
        const exists = acts.some((a) => a.id === actId);

        if (checked && !exists) {
          acts.push({
            id: actId,
            date: attendanceDate,
            kind: "attendance",
            label: "Sunday School Attendance",
            points: 10
          });
          playSynthSound("sparkles");
        } else if (!checked && exists) {
          acts = acts.filter((a) => a.id !== actId);
          playSynthSound("splash");
        }
        return { ...student, activities: acts };
      })
    );
  }

  // Toggle Outreach Attendance
  function toggleOutreach(studentId: string, checked: boolean) {
    const actId = `outreach-attendance-${studentId}-${attendanceDate}`;
    modifyStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        let acts = [...student.activities];
        const exists = acts.some((a) => a.id === actId);

        if (checked && !exists) {
          acts.push({
            id: actId,
            date: attendanceDate,
            kind: "outreach",
            label: "Outreach Attendance",
            points: 15
          });
          playSynthSound("sparkles");
        } else if (!checked && exists) {
          acts = acts.filter((a) => a.id !== actId);
          playSynthSound("splash");
        }
        return { ...student, activities: acts };
      })
    );
  }

  function markAllSSPresent() {
    modifyStudents((prev) =>
      prev.map((student) => {
        const actId = `ss-attendance-${student.id}-${attendanceDate}`;
        const exists = student.activities.some((a) => a.id === actId);
        if (!exists) {
          return {
            ...student,
            activities: [
              ...student.activities,
              {
                id: actId,
                date: attendanceDate,
                kind: "attendance",
                label: "Sunday School Attendance",
                points: 10
              }
            ]
          };
        }
        return student;
      })
    );
    playSynthSound("success");
    triggerFlash("Marked all students present for Sunday School!");
  }

  // Mark all Outreach Present
  function markAllOutreachPresent() {
    modifyStudents((prev) =>
      prev.map((student) => {
        const actId = `outreach-attendance-${student.id}-${attendanceDate}`;
        const exists = student.activities.some((a) => a.id === actId);
        if (!exists) {
          return {
            ...student,
            activities: [
              ...student.activities,
              {
                id: actId,
                date: attendanceDate,
                kind: "outreach",
                label: "Outreach Attendance",
                points: 15
              }
            ]
          };
        }
        return student;
      })
    );
    playSynthSound("success");
    triggerFlash("Marked all students present for Outreach!");
  }

  // ==========================================
  // 9. DASHBOARD STATS & ALERTS ENGINE
  // ==========================================

  const totalPointsAwardedToday = useMemo(() => {
    const todayStr = today();
    return students.reduce((sum, s) => {
      return (
        sum +
        s.activities.filter((a) => a.date === todayStr).reduce((sub, a) => sub + a.points, 0)
      );
    }, 0);
  }, [students]);

  const presentTodayCount = useMemo(() => {
    const todayStr = today();
    // Count student who had SS or Outreach attendance today
    return students.filter((s) => {
      return s.activities.some(
        (a) =>
          a.date === todayStr &&
          (a.kind === "attendance" || a.kind === "outreach")
      );
    }).length;
  }, [students]);

  // Dash Class Health Alerts calculation
  const dashboardAlerts = useMemo(() => {
    const alerts: string[] = [];
    const todayMs = new Date().getTime();

    students.forEach((s) => {
      const earned = totalPoints(s).earned;

      // 1. Milestone alerts
      const nextMilestones = [50, 100, 200, 300, 500, 1000];
      const milestoneNames: Record<number, string> = {
        50: "Faith Starter",
        100: "Growing in Faith",
        200: "Shining Light",
        300: "Role Model",
        500: "Faith Champion",
        1000: "Legendary"
      };
      const nextVal = nextMilestones.find((val) => val > earned);
      if (nextVal) {
        const gap = nextVal - earned;
        if (gap > 0 && gap <= 15) {
          alerts.push(`🔔 ${s.name} is only ${gap} pts away from a new badge (${milestoneNames[nextVal]})!`);
        }
      }

      // 2. Scripture milestone near check
      const verseCount = s.activities.filter((a) => a.kind === "verse").length;
      const nextVerses = [1, 5, 10, 20, 50];
      const verseBadgeNames: Record<number, string> = {
        1: "Verse Explorer",
        5: "Scripture Learner",
        10: "Word Keeper",
        20: "Scripture Master",
        50: "Living Word"
      };
      const nextV = nextVerses.find((val) => val > verseCount);
      if (nextV) {
        const gapV = nextV - verseCount;
        if (gapV === 1) {
          alerts.push(`🔔 ${s.name} is 1 verse away from unlocking a new badge (${verseBadgeNames[nextV]})!`);
        }
      }

      // 3. Highlight student's latest unlocked badge
      if (s.badges && s.badges.length > 0) {
        const lastBadgeId = s.badges[s.badges.length - 1];
        const lastBadge = badgeDefinitions.find((b) => b.id === lastBadgeId);
        if (lastBadge) {
          alerts.push(`🎉 ${s.name} recently unlocked the badge: ${lastBadge.name} ${lastBadge.icon}`);
        }
      }
    });

    // 4. Inactivity check (2+ weeks)
    let inactiveCount = 0;
    students.forEach((s) => {
      const attendanceActs = s.activities.filter(
        (a) => a.kind === "attendance" || a.kind === "outreach"
      );
      if (attendanceActs.length > 0) {
        // sort by date desc
        const dates = attendanceActs.map((a) => new Date(a.date).getTime());
        const latestDate = Math.max(...dates);
        const daysAgo = (todayMs - latestDate) / (1000 * 60 * 60 * 24);
        if (daysAgo >= 14) {
          inactiveCount++;
        }
      } else {
        const joinedDate = new Date(s.joinedAt).getTime();
        const daysAgo = (todayMs - joinedDate) / (1000 * 60 * 60 * 24);
        if (daysAgo >= 14) {
          inactiveCount++;
        }
      }
    });
    if (inactiveCount > 0) {
      alerts.push(`🔔 ${inactiveCount} student${inactiveCount > 1 ? "s" : ""} have not attended in 2+ weeks`);
    }

    // 5. Hits 100 points this week count
    let hit100Count = 0;
    students.forEach((s) => {
      const earned = totalPoints(s).earned;
      if (earned >= 100) {
        // check if they gained points in the last 7 days
        const recentPoints = s.activities.some((a) => {
          const daysAgo = (todayMs - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        });
        if (recentPoints) {
          hit100Count++;
        }
      }
    });
    if (hit100Count > 0) {
      alerts.push(`🎉 ${hit100Count} student${hit100Count > 1 ? "s" : ""} hit 100+ total points this week!`);
    }

    // If no alerts, insert placeholders
    if (alerts.length === 0) {
      alerts.push("✨ Roster is fully healthy and up to date!");
    }

    return alerts.slice(0, 8);
  }, [students]);

  // Recent activity log feed
  const recentActivitiesFeed = useMemo(() => {
    const feed: Array<{ id: string; studentName: string; label: string; points: number; date: string; kind: ActivityKind }> = [];
    students.forEach((s) => {
      s.activities.forEach((a) => {
        feed.push({
          id: a.id,
          studentName: s.name,
          label: a.label,
          points: a.points,
          date: a.date,
          kind: a.kind
        });
      });
    });
    return feed.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }, [students]);

  // Distribution chart level stats
  const treeDistribution = useMemo(() => {
    const levels = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };
    students.forEach((s) => {
      const earned = totalPoints(s).earned;
      const lvl = treeLevel(earned).level;
      if (lvl === 5) levels.level5++;
      else if (lvl === 4) levels.level4++;
      else if (lvl === 3) levels.level3++;
      else if (lvl === 2) levels.level2++;
      else levels.level1++;
    });
    return levels;
  }, [students]);

  // ==========================================
  // 10. QUIZ CONTROLLERS (Run & Builder)
  // ==========================================

  // Builder functions
  function handleAddQuestion() {
    setBuilderQuestions((prev) => [
      ...prev,
      { id: `q-${Date.now()}-${prev.length}`, question: "", options: ["", ""], correctIndex: 0 }
    ]);
  }

  function handleRemoveQuestion(idx: number) {
    if (builderQuestions.length <= 1) return;
    setBuilderQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleQuestionChange(idx: number, text: string) {
    setBuilderQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, question: text } : q))
    );
  }

  function handleOptionChange(qIdx: number, oIdx: number, val: string) {
    setBuilderQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = val;
        return { ...q, options: opts };
      })
    );
  }

  function handleAddOption(qIdx: number) {
    setBuilderQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length >= 6) return q;
        return { ...q, options: [...q.options, ""] };
      })
    );
  }

  function handleRemoveOption(qIdx: number, oIdx: number) {
    setBuilderQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;
        const opts = q.options.filter((_, o) => o !== oIdx);
        let corr = q.correctIndex;
        if (corr >= opts.length) corr = opts.length - 1;
        return { ...q, options: opts, correctIndex: corr };
      })
    );
  }

  function handleSetCorrectOption(qIdx: number, oIdx: number) {
    setBuilderQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctIndex: oIdx } : q))
    );
  }

  function handleSaveQuiz(e: FormEvent) {
    e.preventDefault();
    if (!builderTitle.trim()) {
      triggerFlash("❌ Quiz must have a Title!");
      return;
    }
    // Validation
    const invalid = builderQuestions.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()));
    if (invalid) {
      triggerFlash("❌ All questions and options must be filled!");
      return;
    }

    const quizData: SavedQuiz = {
      id: editingQuizId || `quiz-${Date.now()}`,
      title: builderTitle.trim(),
      pointsPerCorrect: Number(builderPoints) || 15,
      createdAt: new Date().toISOString(),
      questions: builderQuestions.map((q, idx) => ({
        ...q,
        id: q.id || `q-${Date.now()}-${idx}`
      }))
    };

    if (editingQuizId) {
      setQuizzes((prev) => prev.map((q) => (q.id === editingQuizId ? quizData : q)));
      triggerFlash("🎉 Quiz updated successfully!");
    } else {
      setQuizzes((prev) => [...prev, quizData]);
      triggerFlash("🎉 Quiz created successfully!");
    }

    // Reset Builder Form
    setBuilderTitle("");
    setBuilderPoints(15);
    setBuilderQuestions([{ id: `q-${Date.now()}-0`, question: "", options: ["", ""], correctIndex: 0 }]);
    setEditingQuizId(null);
    setActiveView("quizBuilder");
    playSynthSound("success");
  }

  function handleEditQuiz(quiz: SavedQuiz) {
    setEditingQuizId(quiz.id);
    setBuilderTitle(quiz.title);
    setBuilderPoints(quiz.pointsPerCorrect);
    setBuilderQuestions(quiz.questions);
    setActiveView("quizBuilder");
    playSynthSound("sparkles");
  }

  function handleDeleteQuiz(quizId: string) {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      triggerFlash("Quiz deleted.");
      playSynthSound("splash");
    }
  }

  // Live Run Quiz Functions
  function launchQuizSession(quiz: SavedQuiz) {
    setActiveQuiz(quiz);
    setQuizQuestionIndex(0);
    setQuizState("question");
    setCorrectStudentsMap({});
    setQuizSessionPoints({});

    // Capture Rank Snapshot before points are added
    const ranksSnapshot: Record<string, number> = {};
    const sorted = [...students].sort((a, b) => totalPoints(b).earned - totalPoints(a).earned);
    sorted.forEach((student, index) => {
      ranksSnapshot[student.id] = index + 1;
    });
    setQuizRankSnapshot(ranksSnapshot);

    setActiveView("runQuiz");
    playSynthSound("success");
    triggerFlash(`🎯 Launched live quiz: ${quiz.title}`);
  }

  function handleToggleCorrectStudent(studentId: string) {
    if (!activeQuiz) return;
    const q = activeQuiz.questions[quizQuestionIndex];
    const prevList = correctStudentsMap[q.id] || [];
    const isCorrect = prevList.includes(studentId);

    const actId = `quiz-correct-${activeQuiz.id}-${q.id}-${studentId}`;

    if (!isCorrect) {
      // Award points
      modifyStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;
          const exists = student.activities.some((a) => a.id === actId);
          if (!exists) {
            return {
              ...student,
              activities: [
                ...student.activities,
                {
                  id: actId,
                  date: today(),
                  kind: "quiz",
                  label: `Quiz Correct: ${activeQuiz.title} (Q${quizQuestionIndex + 1})`,
                  points: activeQuiz.pointsPerCorrect
                }
              ]
            };
          }
          return student;
        })
      );
      setCorrectStudentsMap((prev) => ({
        ...prev,
        [q.id]: [...prevList, studentId]
      }));
      setQuizSessionPoints((prev) => ({
        ...prev,
        [studentId]: (prev[studentId] || 0) + activeQuiz.pointsPerCorrect
      }));
      playSynthSound("sparkles");
    } else {
      // Remove points
      modifyStudents((prev) =>
        prev.map((student) => {
          if (student.id !== studentId) return student;
          return {
            ...student,
            activities: student.activities.filter((a) => a.id !== actId)
          };
        })
      );
      setCorrectStudentsMap((prev) => ({
        ...prev,
        [q.id]: prevList.filter((id) => id !== studentId)
      }));
      setQuizSessionPoints((prev) => ({
        ...prev,
        [studentId]: Math.max(0, (prev[studentId] || 0) - activeQuiz.pointsPerCorrect)
      }));
      playSynthSound("splash");
    }
  }

  function handleNextQuestion() {
    if (!activeQuiz) return;
    if (quizQuestionIndex < activeQuiz.questions.length - 1) {
      setQuizQuestionIndex((idx) => idx + 1);
      setQuizState("question");
      playSynthSound("sparkles");
    } else {
      setQuizState("results");
      playSynthSound("success");
    }
  }

  function handleFinishQuiz() {
    setActiveQuiz(null);
    setQuizQuestionIndex(0);
    setQuizState("idle");
    setCorrectStudentsMap({});
    setQuizSessionPoints({});
    setQuizRankSnapshot({});
    setActiveView("quizBuilder");
    playSynthSound("success");
  }

  // ==========================================
  // 11. DATA BACKUP / RESTORE / EXPORT
  // ==========================================

  function downloadBackup() {
    const backupObj = {
      students,
      quizzes,
      theme,
      soundOn
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `faithquest-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerFlash("📥 Backup file downloaded successfully!");
  }

  function handleRestoreUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.students && Array.isArray(parsed.students)) {
          setStudents(parsed.students);
          if (parsed.quizzes) setQuizzes(parsed.quizzes);
          if (parsed.theme) setTheme(parsed.theme);
          if (typeof parsed.soundOn === "boolean") setSoundOn(parsed.soundOn);
          triggerFlash("🎉 Roster & settings restored successfully!");
          playSynthSound("success");
        } else {
          triggerFlash("❌ Invalid backup file format!");
        }
      } catch (err) {
        triggerFlash("❌ Error reading backup file!");
      }
    };
    reader.readAsText(file);
  }

  function handleExportCSV() {
    let csv = "Student Name,Group,Joined Date,Total Points Earned,Available Points,Badge Count,Badges Unlocked\n";
    rankedStudents.forEach((s) => {
      const pts = totalPoints(s);
      const badgesStr = (s.badges || []).map((bid) => {
        return badgeDefinitions.find((b) => b.id === bid)?.name || bid;
      }).join("; ");

      csv += `"${s.name}","${s.group}","${s.joinedAt}",${pts.earned},${pts.available},${(s.badges || []).length},"${badgesStr}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `faithquest-roster-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerFlash("📥 CSV file exported successfully!");
  }

  // ==========================================
  // 12. RENDER SUB-VIEWS
  // ==========================================

  // --- Profile Details Modal (Aquarium & FaithTree) ---
  const activeStudentProfile = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  return (
    <main className="app-shell" style={themeStyles[theme]}>
      {/* Top Settings and Config Bar */}
      <header className="settings-bar">
        <div className="bar-brand">
          <Sparkles size={18} className="brand-logo-sparkle" />
          <span className="brand-title">FaithQuest</span>
          <span className="brand-mode-badge">Teacher Board</span>
        </div>
        <div className="bar-controls">
          <button className="settings-btn" onClick={toggleSound} title="Toggle synthetic sounds">
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundOn ? "Sound On" : "Muted"}</span>
          </button>
          
          <div className="theme-palette">
            <button
              className={`settings-btn palette-btn emerald ${theme === "emerald" ? "active" : ""}`}
              onClick={() => changeTheme("emerald")}
              title="Emerald theme"
            >
              <Palette size={14} />
              <span>Emerald</span>
            </button>
            <button
              className={`settings-btn palette-btn gold ${theme === "gold" ? "active" : ""}`}
              onClick={() => changeTheme("gold")}
              title="Gold theme"
            >
              <Palette size={14} />
              <span>Gold</span>
            </button>
            <button
              className={`settings-btn palette-btn aqua ${theme === "aqua" ? "active" : ""}`}
              onClick={() => changeTheme("aqua")}
              title="Aqua theme"
            >
              <Palette size={14} />
              <span>Aqua</span>
            </button>
          </div>

          <button className="settings-btn backup-restore-btn" onClick={downloadBackup} title="Export backup file">
            <Download size={14} />
            <span>Backup JSON</span>
          </button>
          <button className="settings-btn backup-restore-btn" onClick={() => fileInputRef.current?.click()} title="Import backup file">
            <Upload size={14} />
            <span>Restore JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleRestoreUpload}
          />
        </div>
      </header>

      {/* Global Toast Message Notification */}
      {flashMessage && (
        <div className="global-toast-message">
          <div className="toast-content">
            <Sparkles size={16} className="toast-icon-sparkle" />
            <span>{flashMessage}</span>
          </div>
        </div>
      )}

      {/* Roster Removal Prompt Modal */}
      {pendingDeleteStudentId && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Confirm Student Removal</h3>
            <p>To confirm removing <strong>{deleteConfirmationName}</strong>, type their name exactly:</p>
            <input
              type="text"
              placeholder={`Type "${deleteConfirmationName}" here`}
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              className="confirmation-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setPendingDeleteStudentId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationInput !== deleteConfirmationName}
              >
                Remove Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner Display */}
      <section className="hero-band">
        <div className="hero-content">
          <h1>Classroom Display Board</h1>
          <p>
            Projector view for Sunday School attendance, Faith Points, quizzes, and digital achievements.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-card-widget">
            <Users size={16} />
            <div className="stat-label">Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
          <div className="stat-card-widget">
            <Trophy size={16} />
            <div className="stat-label">Top Points</div>
            <div className="stat-value">{rankedStudents[0] ? totalPoints(rankedStudents[0]).earned : 0}</div>
          </div>
          <div className="stat-card-widget">
            <CalendarDays size={16} />
            <div className="stat-label">Present Today</div>
            <div className="stat-value">{presentTodayCount}</div>
          </div>
        </div>
      </section>

      {/* Sidebar Layout + Main Tabs Navigation */}
      <div className="board-grid-container">
        <aside className="sidebar-navigation">
          <nav className="tab-menu-list">
            <button className={`tab-btn-link ${activeView === "dashboard" ? "active" : ""}`} onClick={() => setActiveView("dashboard")}>
              <HomeIcon size={18} />
              <span>Dashboard</span>
            </button>
            <button className={`tab-btn-link ${activeView === "students" ? "active" : ""}`} onClick={() => setActiveView("students")}>
              <Users size={18} />
              <span>Students</span>
            </button>
            <button className={`tab-btn-link ${activeView === "attendance" ? "active" : ""}`} onClick={() => setActiveView("attendance")}>
              <CheckSquare size={18} />
              <span>Attendance</span>
            </button>
            <button className={`tab-btn-link ${activeView === "livePoints" ? "active" : ""}`} onClick={() => setActiveView("livePoints")}>
              <Zap size={18} />
              <span>Live Points</span>
            </button>
            <button className={`tab-btn-link ${activeView === "quizBuilder" ? "active" : ""}`} onClick={() => setActiveView("quizBuilder")}>
              <ClipboardList size={18} />
              <span>Quiz Builder</span>
            </button>
            <button className={`tab-btn-link ${activeView === "runQuiz" ? "active" : ""}`} onClick={() => setActiveView("runQuiz")}>
              <Target size={18} />
              <span>Run Quiz</span>
              {activeQuiz && <span className="active-dot-live">LIVE</span>}
            </button>
            <button className={`tab-btn-link ${activeView === "leaderboard" ? "active" : ""}`} onClick={() => setActiveView("leaderboard")}>
              <Trophy size={18} />
              <span>Leaderboard</span>
            </button>
            <button className={`tab-btn-link ${activeView === "manage" ? "active" : ""}`} onClick={() => setActiveView("manage")}>
              <Settings size={18} />
              <span>Manage Class</span>
            </button>
          </nav>
        </aside>

        <section className="main-content-display">
          
          {/* ==========================================
              TAB 1: DASHBOARD
             ========================================== */}
          {activeView === "dashboard" && (
            <div className="dashboard-layout-view">
              
              {/* Stats Row Widgets */}
              <div className="stats-row-grid">
                <div className="dashboard-stat-card card-purple">
                  <h3>Total Enrolled</h3>
                  <div className="dash-stat-number">{students.length}</div>
                  <p className="dash-stat-desc">Active student cards</p>
                </div>
                <div className="dashboard-stat-card card-green">
                  <h3>Awarded Today</h3>
                  <div className="dash-stat-number">+{totalPointsAwardedToday}</div>
                  <p className="dash-stat-desc">Faith points today</p>
                </div>
                <div className="dashboard-stat-card card-teal">
                  <h3>Present Today</h3>
                  <div className="dash-stat-number">{presentTodayCount}</div>
                  <p className="dash-stat-desc">Sunday School + Outreach</p>
                </div>
                <div className="dashboard-stat-card card-gold">
                  <h3>Quiz Catalog</h3>
                  <div className="dash-stat-number">{quizzes.length}</div>
                  <p className="dash-stat-desc">Pre-built quiz templates</p>
                </div>
              </div>

              {/* Spotlight + Quick Actions Flex Columns */}
              <div className="dashboard-flex-cols">
                
                {/* Spotlight Card column */}
                <div className="spotlight-column">
                  <div className="dashboard-widget-card spotlight-container">
                    <div className="widget-header">
                      <Trophy size={18} className="icon-gold" />
                      <h2>Top Student Spotlight</h2>
                    </div>
                    {rankedStudents[0] ? (
                      <div className="spotlight-card-content" onClick={() => { setSelectedStudentId(rankedStudents[0].id); setIsProfileModalOpen(true); }}>
                        <div className="spotlight-badge-crown">👑 #1 RANKED</div>
                        <div className="spotlight-avatar">🌟</div>
                        <h3>{rankedStudents[0].name}</h3>
                        <div className="spotlight-group">{rankedStudents[0].group}</div>
                        <div className="spotlight-points">
                          <span>{totalPoints(rankedStudents[0]).earned}</span> Faith Points
                        </div>
                        <div className="spotlight-badges-row">
                          {(rankedStudents[0].badges || []).slice(0, 4).map((bid) => {
                            const bDef = badgeDefinitions.find((b) => b.id === bid);
                            return (
                              <span key={bid} className="mini-badge-bubble" title={bDef?.name}>
                                {bDef?.icon || "🏅"}
                              </span>
                            );
                          })}
                          {(rankedStudents[0].badges || []).length === 0 && <span className="spotlight-no-badges">No badges yet</span>}
                        </div>
                        <p className="spotlight-click-tip">Click card to view aquarium & tree</p>
                      </div>
                    ) : (
                      <p className="muted text-center padding-20">No student enrolled yet.</p>
                    )}
                  </div>

                  {/* Distribution Chart Widget */}
                  <div className="dashboard-widget-card">
                    <div className="widget-header">
                      <Sprout size={18} />
                      <h2>Faith Tree Growth Distribution</h2>
                    </div>
                    <div className="tree-distribution-chart">
                      <div className="distribution-row">
                        <span className="dist-label">Lvl 5 (Wisdom)</span>
                        <div className="dist-bar-outer">
                          <div className="dist-bar-inner lvl-5" style={{ width: `${students.length ? (treeDistribution.level5 / students.length) * 100 : 0}%` }} />
                        </div>
                        <span className="dist-count">{treeDistribution.level5}</span>
                      </div>
                      <div className="distribution-row">
                        <span className="dist-label">Lvl 4 (Strong)</span>
                        <div className="dist-bar-outer">
                          <div className="dist-bar-inner lvl-4" style={{ width: `${students.length ? (treeDistribution.level4 / students.length) * 100 : 0}%` }} />
                        </div>
                        <span className="dist-count">{treeDistribution.level4}</span>
                      </div>
                      <div className="distribution-row">
                        <span className="dist-label">Lvl 3 (Growing)</span>
                        <div className="dist-bar-outer">
                          <div className="dist-bar-inner lvl-3" style={{ width: `${students.length ? (treeDistribution.level3 / students.length) * 100 : 0}%` }} />
                        </div>
                        <span className="dist-count">{treeDistribution.level3}</span>
                      </div>
                      <div className="distribution-row">
                        <span className="dist-label">Lvl 2 (Plant)</span>
                        <div className="dist-bar-outer">
                          <div className="dist-bar-inner lvl-2" style={{ width: `${students.length ? (treeDistribution.level2 / students.length) * 100 : 0}%` }} />
                        </div>
                        <span className="dist-count">{treeDistribution.level2}</span>
                      </div>
                      <div className="distribution-row">
                        <span className="dist-label">Lvl 1 (Seed)</span>
                        <div className="dist-bar-outer">
                          <div className="dist-bar-inner lvl-1" style={{ width: `${students.length ? (treeDistribution.level1 / students.length) * 100 : 0}%` }} />
                        </div>
                        <span className="dist-count">{treeDistribution.level1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions + Alerts Columns */}
                <div className="actions-alerts-column">
                  
                  {/* Quick Actions Panel */}
                  <div className="dashboard-widget-card">
                    <div className="widget-header">
                      <Zap size={18} className="icon-teal" />
                      <h2>Teacher Quick-Tools</h2>
                    </div>
                    <div className="quick-tools-grid">
                      <button className="tool-btn" onClick={() => { setActiveView("attendance"); playSynthSound("sparkles"); }}>
                        <CheckSquare size={20} />
                        <span>✅ Mark Attendance</span>
                      </button>
                      <button className="tool-btn" onClick={() => { setShowQuickAward(true); playSynthSound("sparkles"); }}>
                        <Zap size={20} />
                        <span>⚡ Quick Award Points</span>
                      </button>
                      <button
                        className="tool-btn"
                        disabled={quizzes.length === 0}
                        onClick={() => {
                          if (quizzes.length > 0) {
                            launchQuizSession(quizzes[quizzes.length - 1]);
                          }
                        }}
                      >
                        <Target size={20} />
                        <span>🎯 Launch Last Quiz</span>
                      </button>
                      <button className="tool-btn" onClick={() => { setShowAddStudentModal(true); playSynthSound("sparkles"); }}>
                        <UserPlus size={20} />
                        <span>➕ Add Student Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Class Health Alerts */}
                  <div className="dashboard-widget-card health-alerts-card">
                    <div className="widget-header">
                      <AlertCircle size={18} className="icon-rose" />
                      <h2>Classroom Growth Alerts</h2>
                    </div>
                    <div className="alerts-list">
                      {dashboardAlerts.map((alert, index) => (
                        <div key={index} className="alert-item-row">
                          <span className="alert-bullet">🔸</span>
                          <span className="alert-text">{alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity Log Feed */}
                  <div className="dashboard-widget-card recent-feed-card">
                    <div className="widget-header">
                      <Activity size={18} />
                      <h2>Recent Activities Feed</h2>
                    </div>
                    <div className="recent-feed-list">
                      {recentActivitiesFeed.map((act) => (
                        <div key={act.id} className="feed-item-row">
                          <div className="feed-left">
                            <span className="feed-student">{act.studentName}</span>
                            <span className="feed-label">{act.label}</span>
                            <span className="feed-date">{act.date}</span>
                          </div>
                          <div className="feed-right">
                            <span className={`feed-pts ${act.points >= 15 ? "pts-high" : "pts-normal"}`}>
                              +{act.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                      {recentActivitiesFeed.length === 0 && (
                        <p className="muted padding-15 text-center">No awards given yet today.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Dashboard Modals */}
              {showQuickAward && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header-row">
                      <h2>Quick Award Points</h2>
                      <button className="close-modal-btn" onClick={() => setShowQuickAward(false)}>
                        <X size={20} />
                      </button>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const stId = quickAwardStudentId || (students[0] ? students[0].id : "");
                        if (!stId) return;
                        awardPoints(stId, Number(quickAwardAmount) || 10, quickAwardLabel || "Teacher Award");
                        setShowQuickAward(false);
                        setQuickAwardLabel("");
                      }}
                      className="modal-form"
                    >
                      <div className="form-group-item">
                        <label>Select Student</label>
                        <select
                          value={quickAwardStudentId}
                          onChange={(e) => setQuickAwardStudentId(e.target.value)}
                        >
                          <option value="">-- Choose student --</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({totalPoints(s).earned} pts)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group-item">
                        <label>Award Points</label>
                        <select
                          value={quickAwardAmount}
                          onChange={(e) => setQuickAwardAmount(Number(e.target.value))}
                        >
                          <option value="5">+5 Points</option>
                          <option value="10">+10 Points</option>
                          <option value="15">+15 Points</option>
                          <option value="20">+20 Points</option>
                          <option value="50">+50 Points</option>
                        </select>
                      </div>
                      <div className="form-group-item">
                        <label>Description / Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Recited Memory Verse, Helped classmate"
                          value={quickAwardLabel}
                          onChange={(e) => setQuickAwardLabel(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn-primary form-submit-btn">
                        Award Points Now
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {showAddStudentModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header-row">
                      <h2>Add Student Card</h2>
                      <button className="close-modal-btn" onClick={() => setShowAddStudentModal(false)}>
                        <X size={20} />
                      </button>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddStudent(newStudentName, newStudentGroup);
                        setShowAddStudentModal(false);
                        setNewStudentName("");
                      }}
                      className="modal-form"
                    >
                      <div className="form-group-item">
                        <label>Student Name</label>
                        <input
                          type="text"
                          placeholder="Enter full name"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group-item">
                        <label>Class/Group</label>
                        <select
                          value={newStudentGroup}
                          onChange={(e) => setNewStudentGroup(e.target.value)}
                        >
                          <option value="Sunday School">Sunday School</option>
                          <option value="Outreach Youth">Outreach Youth</option>
                          <option value="Youth Bible Class">Youth Bible Class</option>
                          <option value="Primary Class">Primary Class</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-primary form-submit-btn">
                        Create Card
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==========================================
              TAB 2: STUDENTS GRID & SIDEBAR
             ========================================== */}
          {activeView === "students" && (
            <div className="students-layout-view">
              
              <div className="tab-actions-header">
                <div className="search-filter-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search students by name or class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="students-view-columns">
                
                {/* Students Cards Grid (left column) */}
                <div className="student-grid-col">
                  <div className="student-cards-grid">
                    {rankedStudents
                      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.group.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((s) => {
                        const pts = totalPoints(s);
                        const lvl = treeLevel(pts.earned);
                        return (
                          <div
                            key={s.id}
                            className="student-main-card clickable-card"
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setIsProfileModalOpen(true);
                              playSynthSound("sparkles");
                            }}
                          >
                            <div className="card-top-decorator">
                              <span className={`tree-level-badge level-${lvl.level}`}>
                                Lvl {lvl.level}
                              </span>
                            </div>
                            <div className="card-avatar">⭐</div>
                            <h3>{s.name}</h3>
                            <span className="card-group-tag">{s.group}</span>
                            
                            <div className="card-metrics-row">
                              <div className="metric-box">
                                <span className="metric-val">{pts.earned}</span>
                                <span className="metric-lbl">Earned Pts</span>
                              </div>
                              <div className="metric-box">
                                <span className="metric-val">{(s.badges || []).length}</span>
                                <span className="metric-lbl">Badges</span>
                              </div>
                            </div>

                            <div className="card-badges-preview">
                              {(s.badges || []).slice(0, 3).map((bid) => {
                                const b = badgeDefinitions.find((def) => def.id === bid);
                                return (
                                  <span key={bid} className="preview-badge-emoji" title={b?.name}>
                                    {b?.icon || "🏅"}
                                  </span>
                                );
                              })}
                              {(s.badges || []).length === 0 && <span className="no-badges-label">No badges unlocked</span>}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Badge Info Sidebar (right column) */}
                <aside className="badge-info-sidebar">
                  <div className="sidebar-card">
                    <div className="sidebar-header">
                      <Award size={18} />
                      <h2>How to Earn Badges</h2>
                    </div>
                    <p className="sidebar-intro">
                      Badges are automatically awarded immediately when criteria are achieved.
                    </p>
                    <div className="badges-definitions-list">
                      {badgeDefinitions.map((b) => (
                        <div key={b.id} className="badge-definition-row">
                          <div className="badge-icon-cell">{b.icon}</div>
                          <div className="badge-info-cell">
                            <h4>{b.name}</h4>
                            <p>{b.description}</p>
                            <span className="badge-cat-tag">{b.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

              </div>

            </div>
          )}

          {/* ==========================================
              TAB 3: ATTENDANCE (SPLIT VIEW)
             ========================================== */}
          {activeView === "attendance" && (
            <div className="attendance-layout-view">
              
              {/* Shared Date Selector Top Bar */}
              <div className="shared-date-bar">
                <div className="date-picker-box">
                  <CalendarDays size={20} />
                  <label htmlFor="attendance-date-select">Attendance Date:</label>
                  <input
                    id="attendance-date-select"
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                  />
                </div>
                <div className="date-display-title">
                  {formatCalendarDate(attendanceDate)}
                </div>
              </div>

              {/* Side-by-Side SS and Outreach Columns */}
              <div className="attendance-split-container">
                
                {/* Left panel: Sunday School */}
                <div className="attendance-panel-column ss-panel">
                  <div className="panel-header-row">
                    <div className="panel-title-group">
                      <GraduationCap size={22} className="title-icon" />
                      <h2>Sunday School</h2>
                      <span className="pts-tag">+10 points</span>
                    </div>
                    <button className="btn-secondary btn-mini" onClick={markAllSSPresent}>
                      Mark All Present
                    </button>
                  </div>
                  
                  <div className="panel-summary-label">
                    Present: <strong>{ssPresentList.length}</strong> of {students.length} students
                  </div>

                  <div className="attendance-students-list">
                    {students.map((s) => {
                      const isPresent = ssPresentList.includes(s.id);
                      return (
                        <div key={s.id} className={`attendance-row-item ${isPresent ? "present" : "absent"}`}>
                          <span className="student-name">{s.name}</span>
                          <button
                            className={`toggle-attendance-btn ${isPresent ? "checked" : "unchecked"}`}
                            onClick={() => toggleSundaySchool(s.id, !isPresent)}
                          >
                            {isPresent ? "Present ✓" : "Absent"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right panel: Outreach */}
                <div className="attendance-panel-column outreach-panel">
                  <div className="panel-header-row">
                    <div className="panel-title-group">
                      <Sprout size={22} className="title-icon" />
                      <h2>Outreach Events</h2>
                      <span className="pts-tag">+15 points</span>
                    </div>
                    <button className="btn-secondary btn-mini" onClick={markAllOutreachPresent}>
                      Mark All Present
                    </button>
                  </div>
                  
                  <div className="panel-summary-label">
                    Present: <strong>{outreachPresentList.length}</strong> of {students.length} students
                  </div>

                  <div className="attendance-students-list">
                    {students.map((s) => {
                      const isPresent = outreachPresentList.includes(s.id);
                      return (
                        <div key={s.id} className={`attendance-row-item ${isPresent ? "present" : "absent"}`}>
                          <span className="student-name">{s.name}</span>
                          <button
                            className={`toggle-attendance-btn ${isPresent ? "checked" : "unchecked"}`}
                            onClick={() => toggleOutreach(s.id, !isPresent)}
                          >
                            {isPresent ? "Present ✓" : "Absent"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==========================================
              TAB 4: LIVE POINTS INDIVIDUAL AWARDING
             ========================================== */}
          {activeView === "livePoints" && (
            <div className="live-points-layout-view">
              
              {/* Award Action Header Config */}
              <div className="live-points-config-card">
                <h2>⚡ Live Points Award Board</h2>
                <p>Award points to students on the spot during scripture sessions, questions, or discussions.</p>
                <div className="label-input-group">
                  <label>Award Label / Activity Reason:</label>
                  <input
                    type="text"
                    placeholder="e.g. Brought Bible, Recited Psalm 23, Helped arrange chairs"
                    value={livePointsLabel}
                    onChange={(e) => setLivePointsLabel(e.target.value)}
                    className="full-width-input"
                  />
                </div>
              </div>

              {/* Roster Cards with Direct Preset Actions */}
              <div className="live-students-action-grid">
                {rankedStudents.map((s) => {
                  const pts = totalPoints(s);
                  const sessionGain = sessionGains[s.id] || 0;
                  return (
                    <div key={s.id} className="live-award-card">
                      <div className="live-card-body">
                        <h3>{s.name}</h3>
                        <span className="live-card-group">{s.group}</span>
                        <div className="live-card-current-pts">
                          Current total: <strong>{pts.earned}</strong> pts
                        </div>
                        {sessionGain > 0 && (
                          <div className="live-card-session-gain">
                            Gained this session: <span>+{sessionGain} pts</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="live-card-presets-grid">
                        <button className="preset-btn p-5" onClick={() => awardPoints(s.id, 5, livePointsLabel || "Teacher Award")}>
                          +5
                        </button>
                        <button className="preset-btn p-10" onClick={() => awardPoints(s.id, 10, livePointsLabel || "Teacher Award")}>
                          +10
                        </button>
                        <button className="preset-btn p-15" onClick={() => awardPoints(s.id, 15, livePointsLabel || "Teacher Award")}>
                          +15
                        </button>
                        <button className="preset-btn p-20" onClick={() => awardPoints(s.id, 20, livePointsLabel || "Teacher Award")}>
                          +20
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Running Session Activity log */}
              <div className="session-activity-log-widget">
                <div className="session-log-header">
                  <h2>Session Activities Log</h2>
                  <button
                    className="btn-secondary btn-mini"
                    onClick={() => {
                      setSessionActivityLog([]);
                      setSessionGains({});
                      playSynthSound("splash");
                    }}
                  >
                    Reset Session Log
                  </button>
                </div>
                
                <div className="session-log-table-container">
                  <table className="session-log-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Student</th>
                        <th>Activity Label</th>
                        <th>Points Awarded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionActivityLog.map((log) => (
                        <tr key={log.id}>
                          <td>{log.time}</td>
                          <td><strong>{log.studentName}</strong></td>
                          <td>{log.label}</td>
                          <td><span className="points-added-cell">+{log.points}</span></td>
                        </tr>
                      ))}
                      {sessionActivityLog.length === 0 && (
                        <tr>
                          <td colSpan={4} className="muted text-center py-20">
                            No activities logged in this active screen session.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB 5: QUIZ BUILDER FORM
             ========================================== */}
          {activeView === "quizBuilder" && (
            <div className="quiz-builder-layout-view">
              
              <div className="builder-split-flex">
                
                {/* Builder editor form */}
                <div className="builder-editor-card">
                  <h2>{editingQuizId ? "📝 Edit Saved Quiz" : "📝 Pre-Build New Trivia Quiz"}</h2>
                  <form onSubmit={handleSaveQuiz} className="quiz-editor-form">
                    
                    <div className="builder-form-row">
                      <div className="form-group-item">
                        <label>Quiz Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Fruit of the Spirit Quiz"
                          value={builderTitle}
                          onChange={(e) => setBuilderTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group-item points-per-q">
                        <label>Points Per Question</label>
                        <input
                          type="number"
                          value={builderPoints}
                          onChange={(e) => setBuilderPoints(Math.max(1, Number(e.target.value)))}
                          required
                        />
                      </div>
                    </div>

                    <hr className="builder-hr" />

                    <div className="builder-questions-header">
                      <h3>Questions Setup</h3>
                      <button type="button" className="btn-secondary btn-mini" onClick={handleAddQuestion}>
                        ➕ Add Question
                      </button>
                    </div>

                    <div className="builder-questions-scroller">
                      {builderQuestions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="question-setup-box">
                          <div className="q-header-row">
                            <span className="q-index-tag">Question #{qIdx + 1}</span>
                            <button
                              type="button"
                              className="btn-danger btn-mini"
                              disabled={builderQuestions.length <= 1}
                              onClick={() => handleRemoveQuestion(qIdx)}
                            >
                              Remove Q
                            </button>
                          </div>

                          <div className="form-group-item q-text-input">
                            <label>Question Text:</label>
                            <input
                              type="text"
                              placeholder="e.g. What is the first book of the Bible?"
                              value={q.question}
                              onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                              required
                            />
                          </div>

                          <div className="options-setup-group">
                            <label>Answer Options & Correct Indicator:</label>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="option-row-item">
                                <input
                                  type="radio"
                                  name={`correct-option-${qIdx}`}
                                  checked={q.correctIndex === oIdx}
                                  onChange={() => handleSetCorrectOption(qIdx, oIdx)}
                                  title="Mark as correct answer"
                                />
                                <span className="option-letter">{(oIdx + 10).toString(36).toUpperCase()}.</span>
                                <input
                                  type="text"
                                  placeholder={`Option ${oIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn-remove-opt"
                                  disabled={q.options.length <= 2}
                                  onClick={() => handleRemoveOption(qIdx, oIdx)}
                                  title="Remove option"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                className="btn-add-opt"
                                onClick={() => handleAddOption(qIdx)}
                              >
                                ＋ Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="builder-actions-footer">
                      {editingQuizId && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingQuizId(null);
                            setBuilderTitle("");
                            setBuilderQuestions([{ id: `q-${Date.now()}-0`, question: "", options: ["", ""], correctIndex: 0 }]);
                          }}
                        >
                          Cancel Editing
                        </button>
                      )}
                      <button type="submit" className="btn-primary">
                        {editingQuizId ? "Update Quiz Template" : "Save Quiz to Library"}
                      </button>
                    </div>

                  </form>
                </div>

                {/* Quizzes library list */}
                <div className="quizzes-library-card">
                  <h2>📂 Quiz Template Library</h2>
                  <p>Quizzes stored on this device ready to run live with the class.</p>
                  
                  <div className="saved-quizzes-list-scroller">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="quiz-library-item">
                        <div className="quiz-item-header">
                          <h3>{quiz.title}</h3>
                          <span className="item-meta">
                            {quiz.questions.length} questions • {quiz.pointsPerCorrect} pts/each
                          </span>
                        </div>
                        <div className="quiz-item-actions">
                          <button className="btn-action launch" onClick={() => launchQuizSession(quiz)}>
                            <Play size={14} />
                            <span>Launch Live</span>
                          </button>
                          <button className="btn-action edit" onClick={() => handleEditQuiz(quiz)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDeleteQuiz(quiz.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {quizzes.length === 0 && (
                      <p className="muted py-40 text-center">No quizzes saved in library yet.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==========================================
              TAB 6: LIVE RUN QUIZ
             ========================================== */}
          {activeView === "runQuiz" && (
            <div className="run-quiz-layout-view">
              
              {!activeQuiz ? (
                <div className="run-quiz-idle-card">
                  <Target size={48} className="idle-target-icon" />
                  <h2>No Live Quiz Active</h2>
                  <p>Go to the <strong>Quiz Builder</strong> tab to select and launch a prebuilt quiz template.</p>
                  <button className="btn-primary" onClick={() => setActiveView("quizBuilder")}>
                    Open Quiz Builder
                  </button>
                </div>
              ) : (
                <div className="quiz-active-session-container">
                  
                  {/* Progress Indicator */}
                  <div className="quiz-progress-indicator-bar">
                    <span className="quiz-title-tag">Live Session: {activeQuiz.title}</span>
                    <div className="progress-pills">
                      {activeQuiz.questions.map((_, idx) => (
                        <span
                          key={idx}
                          className={`progress-pill ${idx === quizQuestionIndex ? "active" : ""} ${idx < quizQuestionIndex ? "completed" : ""}`}
                        />
                      ))}
                    </div>
                    <span className="progress-fraction-label">
                      Question {quizQuestionIndex + 1} of {activeQuiz.questions.length}
                    </span>
                  </div>

                  {/* ACTIVE QUESTION SCREEN */}
                  {quizState === "question" && (
                    <div className="quiz-state-panel question-presentation">
                      <div className="question-text-box">
                        <h3>QUESTION #{quizQuestionIndex + 1}</h3>
                        <h1>{activeQuiz.questions[quizQuestionIndex].question}</h1>
                      </div>
                      
                      <div className="options-display-grid">
                        {activeQuiz.questions[quizQuestionIndex].options.map((opt, oIdx) => (
                          <div key={oIdx} className="option-present-card">
                            <span className="opt-letter">{(oIdx + 10).toString(36).toUpperCase()}</span>
                            <span className="opt-text">{opt}</span>
                          </div>
                        ))}
                      </div>

                      <div className="quiz-action-footer-panel">
                        <button className="btn-primary reveal-btn" onClick={() => { setQuizState("reveal"); playSynthSound("success"); }}>
                          Reveal Correct Answer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REVEAL CORRECT ANSWER SCREEN */}
                  {quizState === "reveal" && (
                    <div className="quiz-state-panel reveal-presentation">
                      <div className="question-text-box">
                        <h3>QUESTION #{quizQuestionIndex + 1} REVEALED</h3>
                        <h1>{activeQuiz.questions[quizQuestionIndex].question}</h1>
                      </div>
                      
                      <div className="options-display-grid">
                        {activeQuiz.questions[quizQuestionIndex].options.map((opt, oIdx) => {
                          const isCorrect = oIdx === activeQuiz.questions[quizQuestionIndex].correctIndex;
                          return (
                            <div key={oIdx} className={`option-present-card ${isCorrect ? "correct-highlight-card" : "incorrect-dim-card"}`}>
                              <span className="opt-letter">{(oIdx + 10).toString(36).toUpperCase()}</span>
                              <span className="opt-text">{opt}</span>
                              {isCorrect && <span className="correct-stamp">CORRECT ✓</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Awarding Picker Grid */}
                      <div className="student-quiz-scoring-widget">
                        <h3>Tap students who got this answer correct:</h3>
                        <p className="scoring-subtext">Each tap awards +{activeQuiz.pointsPerCorrect} points to the student card.</p>
                        
                        <div className="scoring-students-picker-grid">
                          {students.map((s) => {
                            const isSelected = (correctStudentsMap[activeQuiz.questions[quizQuestionIndex].id] || []).includes(s.id);
                            return (
                              <button
                                key={s.id}
                                className={`scoring-student-btn-card ${isSelected ? "selected-correct" : ""}`}
                                onClick={() => handleToggleCorrectStudent(s.id)}
                              >
                                <span className="check-indicator-circle">{isSelected ? "✓" : ""}</span>
                                <span className="s-name">{s.name}</span>
                                <span className="s-points-earned">+{quizSessionPoints[s.id] || 0} pts</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="quiz-action-footer-panel">
                        <button className="btn-primary next-q-btn" onClick={handleNextQuestion}>
                          {quizQuestionIndex < activeQuiz.questions.length - 1 ? "Next Question ➜" : "Show Quiz Results ➜"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RESULTS SCREEN */}
                  {quizState === "results" && (
                    <div className="quiz-state-panel results-presentation">
                      <div className="quiz-results-banner">
                        <Trophy size={42} className="banner-trophy-gold" />
                        <h1>Quiz Session Completed!</h1>
                        <p>Here are the rankings for this quiz session.</p>
                      </div>

                      <div className="session-ranking-table-widget">
                        <table className="session-results-table">
                          <thead>
                            <tr>
                              <th>Session Rank</th>
                              <th>Student Name</th>
                              <th>Correct Questions</th>
                              <th>Points Earned</th>
                              <th>Overall Rank Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Sort students by session correct answers */}
                            {[...students]
                              .sort((a, b) => (quizSessionPoints[b.id] || 0) - (quizSessionPoints[a.id] || 0))
                              .map((s, idx) => {
                                const ptsGained = quizSessionPoints[s.id] || 0;
                                const questionsCorrect = ptsGained / activeQuiz.pointsPerCorrect;
                                
                                // Calculate rank change
                                const snapRank = quizRankSnapshot[s.id] || idx + 1;
                                // find current rank in general list
                                const currentRankIdx = rankedStudents.findIndex((student) => student.id === s.id);
                                const currRank = currentRankIdx !== -1 ? currentRankIdx + 1 : idx + 1;
                                const rankDiff = snapRank - currRank; // positive means rank increased (e.g. 5 -> 3)
                                
                                return (
                                  <tr key={s.id} className={idx < 3 ? `podium-row podium-${idx + 1}` : ""}>
                                    <td><strong>#{idx + 1}</strong></td>
                                    <td><strong>{s.name}</strong></td>
                                    <td>{questionsCorrect} / {activeQuiz.questions.length}</td>
                                    <td><span className="pts-badge-green">+{ptsGained} pts</span></td>
                                    <td>
                                      {rankDiff > 0 ? (
                                        <span className="rank-change up">▲ +{rankDiff}</span>
                                      ) : rankDiff < 0 ? (
                                        <span className="rank-change down">▼ {rankDiff}</span>
                                      ) : (
                                        <span className="rank-change same">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>

                      <div className="quiz-action-footer-panel">
                        <button className="btn-primary finish-btn" onClick={handleFinishQuiz}>
                          Finish & Close Session
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ==========================================
              TAB 7: LEADERBOARD RANKINGS
             ========================================== */}
          {activeView === "leaderboard" && (
            <div className="leaderboard-layout-view">
              
              {/* Podium display for top 3 */}
              <div className="podium-display-container">
                
                {/* 2nd Place (Silver) */}
                {rankedStudents[1] && (
                  <div className="podium-pedestal silver-pedestal animate-podium-2">
                    <div className="podium-avatar">🥈</div>
                    <div className="pedestal-body">
                      <h3>{rankedStudents[1].name}</h3>
                      <div className="pedestal-points">{totalPoints(rankedStudents[1]).earned} pts</div>
                      <div className="pedestal-num">2</div>
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold) */}
                {rankedStudents[0] && (
                  <div className="podium-pedestal gold-pedestal animate-podium-1">
                    <div className="podium-avatar">👑 🥇</div>
                    <div className="pedestal-body">
                      <h3>{rankedStudents[0].name}</h3>
                      <div className="pedestal-points">{totalPoints(rankedStudents[0]).earned} pts</div>
                      <div className="pedestal-num">1</div>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {rankedStudents[2] && (
                  <div className="podium-pedestal bronze-pedestal animate-podium-3">
                    <div className="podium-avatar">🥉</div>
                    <div className="pedestal-body">
                      <h3>{rankedStudents[2].name}</h3>
                      <div className="pedestal-points">{totalPoints(rankedStudents[2]).earned} pts</div>
                      <div className="pedestal-num">3</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Complete rankings list table */}
              <div className="rankings-table-card">
                <h2>Roster Standings</h2>
                <div className="table-responsive">
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Class Group</th>
                        <th>Tree Level</th>
                        <th>Unlocked Badges</th>
                        <th>Total Earned Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedStudents.map((s, idx) => {
                        const pts = totalPoints(s);
                        const lvl = treeLevel(pts.earned);
                        return (
                          <tr key={s.id} className={idx < 3 ? "highlight-top-row" : ""}>
                            <td><strong>#{idx + 1}</strong></td>
                            <td>
                              <span className="rankings-s-name">{s.name}</span>
                            </td>
                            <td>{s.group}</td>
                            <td>
                              <span className={`tree-level-tag lvl-${lvl.level}`}>
                                Level {lvl.level}: {lvl.name}
                              </span>
                            </td>
                            <td>
                              <div className="rankings-badges-cell">
                                {(s.badges || []).map((bid) => {
                                  const b = badgeDefinitions.find((def) => def.id === bid);
                                  return (
                                    <span key={bid} className="rankings-badge-emoji" title={b?.name}>
                                      {b?.icon || "🏅"}
                                    </span>
                                  );
                                })}
                                {(s.badges || []).length === 0 && <span className="no-badges-dash">-</span>}
                              </div>
                            </td>
                            <td><strong>{pts.earned} pts</strong></td>
                          </tr>
                        );
                      })}
                      {rankedStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="muted text-center py-40">
                            No students enrolled in class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB 8: MANAGE CLASS
             ========================================== */}
          {activeView === "manage" && (
            <div className="manage-layout-view">
              
              <div className="manage-flex-grid">
                
                {/* Left side: Add student */}
                <div className="manage-card-panel add-student-panel">
                  <h2>➕ Enroll New Student Card</h2>
                  <p>Register a student to the local display board. Card stats are stored locally on this device.</p>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddStudent(newStudentName, newStudentGroup);
                      setNewStudentName("");
                    }}
                    className="manage-form"
                  >
                    <div className="form-group-item">
                      <label>Student Name</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group-item">
                      <label>Class/Group Assignment</label>
                      <select
                        value={newStudentGroup}
                        onChange={(e) => setNewStudentGroup(e.target.value)}
                      >
                        <option value="Sunday School">Sunday School</option>
                        <option value="Outreach Youth">Outreach Youth</option>
                        <option value="Youth Bible Class">Youth Bible Class</option>
                        <option value="Primary Class">Primary Class</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary btn-full-width">
                      Enroll Student Card
                    </button>
                  </form>
                </div>

                {/* Right side: Database / backup operations */}
                <div className="manage-card-panel db-ops-panel">
                  <h2>⚙️ Database & Backup Operations</h2>
                  <p>Export class roster reports, and backup data before transitioning computers or projection devices.</p>
                  
                  <div className="db-action-buttons-group">
                    <button className="manage-db-btn btn-csv" onClick={handleExportCSV}>
                      <Download size={18} />
                      <div>
                        <h3>Export Roster CSV</h3>
                        <p>Download summary table of student grades & points.</p>
                      </div>
                    </button>
                    <button className="manage-db-btn btn-backup" onClick={downloadBackup}>
                      <Download size={18} />
                      <div>
                        <h3>Download Backup JSON</h3>
                        <p>Download backup of students, quizzes, and themes.</p>
                      </div>
                    </button>
                    <button className="manage-db-btn btn-restore" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={18} />
                      <div>
                        <h3>Upload Restore JSON</h3>
                        <p>Upload backup file to restore device roster data.</p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>

              {/* Roster list editor */}
              <div className="manage-roster-list-panel">
                <h2>Roster Directory & Removal Tools</h2>
                <div className="table-responsive">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Joined Date</th>
                        <th>Name</th>
                        <th>Group</th>
                        <th>Total Points</th>
                        <th>Badges</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedStudents.map((s) => {
                        const pts = totalPoints(s);
                        return (
                          <tr key={s.id}>
                            <td>{s.joinedAt}</td>
                            <td><strong>{s.name}</strong></td>
                            <td>{s.group}</td>
                            <td>{pts.earned} pts</td>
                            <td>{(s.badges || []).length} unlocked</td>
                            <td>
                              <button className="btn-danger btn-mini" onClick={() => requestDeleteStudent(s.id)}>
                                Remove Student
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={6} className="muted text-center py-20">
                            No students currently registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </section>
      </div>

      {/* ==========================================
          GLOBAL PROFILE OVERLAY MODAL
         ========================================== */}
      {isProfileModalOpen && activeStudentProfile && (
        <div className="modal-overlay profile-modal-overlay">
          <div className="modal-content profile-modal-content">
            <div className="profile-modal-header">
              <div className="header-info">
                <h1>{activeStudentProfile.name}</h1>
                <span className="profile-group-tag">{activeStudentProfile.group}</span>
              </div>
              <button
                className="close-profile-btn"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setSelectedStudentId(null);
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="profile-modal-grid">
              
              {/* Left Column: Visual display (Aquarium & Faith Tree) */}
              <div className="profile-visuals-col">
                
                {/* Personal Aquarium Section */}
                <section className="profile-widget-box aquarium-box">
                  <div className="widget-header">
                    <Fish size={18} />
                    <h3>Personal Aquarium</h3>
                    <span className="items-count-badge">
                      {activeStudentProfile.rewards.length} items placed
                    </span>
                  </div>
                  
                  {/* Embedded Aquarium Component Container */}
                  <div className="profile-aquarium-visual-container">
                    <Aquarium student={activeStudentProfile} />
                  </div>

                  {/* Virtual Reward Shop redeemable by points */}
                  <div className="virtual-reward-shop-widget">
                    <h4>Unlock virtual rewards for aquarium:</h4>
                    <div className="shop-buttons-grid">
                      {rewardCatalog.map((reward) => {
                        const owned = activeStudentProfile.rewards.includes(reward.id);
                        const points = totalPoints(activeStudentProfile);
                        const canBuy = points.available >= reward.cost && !owned;
                        return (
                          <button
                            key={reward.id}
                            disabled={!canBuy}
                            onClick={() => unlockReward(activeStudentProfile.id, reward.id)}
                            className={`shop-item-btn ${owned ? "owned" : canBuy ? "can-buy" : "locked"}`}
                            title={owned ? "Unlocked" : `Costs ${reward.cost} pts (Available: ${points.available} pts)`}
                          >
                            <span className="shop-icon-type">
                              {reward.type === "fish" ? "🐠" : "🌿"}
                            </span>
                            <span className="shop-name">{reward.name}</span>
                            <span className="shop-cost-label">
                              {owned ? "Unlocked" : `${reward.cost} pts`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Personal Faith Tree Section */}
                <section className="profile-widget-box faith-tree-box">
                  <div className="widget-header">
                    <Sprout size={18} />
                    <h3>Faith Tree</h3>
                    <span className="items-count-badge">
                      Level {treeLevel(totalPoints(activeStudentProfile).earned).level}
                    </span>
                  </div>
                  <div className="profile-tree-visual-container">
                    <FaithTree level={treeLevel(totalPoints(activeStudentProfile).earned)} />
                  </div>
                </section>

              </div>

              {/* Right Column: Textual display (Badges unlocked, Growth activities record) */}
              <div className="profile-records-col">
                
                {/* Badges unlocked showcase */}
                <section className="profile-widget-box badges-unlocked-showcase">
                  <div className="widget-header">
                    <Award size={18} />
                    <h3>Unlocked Badges ({(activeStudentProfile.badges || []).length} / {badgeDefinitions.length})</h3>
                  </div>
                  
                  <div className="modal-badges-gallery">
                    {badgeDefinitions.map((badge) => {
                      const isUnlocked = (activeStudentProfile.badges || []).includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`modal-badge-showcase-card ${isUnlocked ? "unlocked" : "locked"}`}
                        >
                          <div className="badge-showcase-icon">{badge.icon}</div>
                          <div className="badge-showcase-body">
                            <h4>{badge.name}</h4>
                            <p>{badge.description}</p>
                            {!isUnlocked && (
                              <span className="req-tooltip-label">Req: {badge.condition}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Growth Record scrollable activities list */}
                <section className="profile-widget-box activities-growth-record">
                  <div className="widget-header">
                    <Activity size={18} />
                    <h3>Activity Growth Record</h3>
                  </div>
                  <div className="profile-activities-scroller">
                    {[...activeStudentProfile.activities]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((act) => (
                        <div key={act.id} className="profile-activity-item">
                          <div className="act-details">
                            <span className="act-lbl">{act.label}</span>
                            <span className="act-dt">{act.date}</span>
                          </div>
                          <div className="act-pts">+{act.points} pts</div>
                        </div>
                      ))}
                    {activeStudentProfile.activities.length === 0 && (
                      <p className="muted py-20 text-center">No activities recorded yet.</p>
                    )}
                  </div>
                </section>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      <button 
        className="floating-back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Back to Top"
        aria-label="Back to Top"
      >
        <ArrowUp size={20} />
      </button>

    </main>
  );
}

// ==========================================
// 13. INNER COMPONENT INSERTS
// ==========================================

function Aquarium({ student }: { student: Student }) {
  const rewards = student.rewards;
  const fish = rewards.filter((reward) => reward.includes("fish"));
  const hasCastle = rewards.includes("castle");
  const hasCoral = rewards.includes("coral");
  const hasPlant = rewards.includes("water-plant");
  const hasRocks = rewards.includes("rocks");

  const bubbleList = [
    { left: "8%", delay: "0s", drift: "14px", size: 6 },
    { left: "24%", delay: "1.2s", drift: "-18px", size: 9 },
    { left: "40%", delay: "2.8s", drift: "22px", size: 5 },
    { left: "58%", delay: "0.6s", drift: "-14px", size: 7 },
    { left: "74%", delay: "2.0s", drift: "20px", size: 10 },
    { left: "88%", delay: "3.5s", drift: "-10px", size: 6 }
  ];

  return (
    <div className="aquarium-render-box">
      <div className="aquarium-sub-render">
        <div className="water-glow-overlay" />
        
        {/* Render animated bubbles */}
        {bubbleList.map((bubble, i) => (
          <span
            key={`bubble-${i}`}
            className="bubble"
            style={{
              left: bubble.left,
              animationDelay: bubble.delay,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              // @ts-ignore
              "--drift": bubble.drift
            }}
          />
        ))}

        {fish.map((reward, index) => (
          <span
            className={`fish fish-${(index % 4) + 1} ${reward}`}
            key={`${reward}-${index}`}
            style={{ animationDelay: `${index * 0.7}s` }}
          />
        ))}
        
        {hasPlant && <span className="plant plant-left" />}
        {hasPlant && <span className="plant plant-right" />}
        {hasCastle && <span className="castle" />}
        {hasCoral && <span className="coral" />}
        {hasRocks && <span className="rocks" />}
        <span className="sand" />
      </div>
    </div>
  );
}

function FaithTree({ level }: { level: ReturnType<typeof treeLevel> }) {
  return (
    <div className="tree-render-box">
      <div className={`tree-stage level-${level.level}`}>
        <div className="sun" />
        <div className="tree">
          <span className="trunk" />
          <span className="leaf leaf-a" />
          <span className="leaf leaf-b" />
          <span className="leaf leaf-c" />
          <span className="leaf leaf-d" />
        </div>
        <div className="soil" />
      </div>
      <div className="level-meter-wrapper">
        <div className="meter-label-row">
          <span>Level {level.level}: {level.name}</span>
          <span>{level.percent}%</span>
        </div>
        <div className="level-meter-track">
          <span className="level-meter-fill" style={{ width: `${level.percent}%` }} />
        </div>
      </div>
    </div>
  );
}
