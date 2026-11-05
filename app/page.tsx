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
  ArrowUp,
  Monitor,
  Heart,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  Crown
} from "lucide-react";
import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  archivePersistedStudent,
  createPersistedStudent,
  deletePersistedQuiz,
  loadPersistedState,
  recordPersistedActivity,
  redeemPersistedReward,
  savePersistedState,
  subscribeToStateChanges,
  syncPersistedBadges,
  upsertPersistedQuiz,
} from "./lib/persistence";
import { createClient } from "./lib/supabase/client";

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
// 2. STATIC CATALOGS & BADGES
// ==========================================

export const rewardCatalog: Reward[] = [
  { id: "small-fish", name: "Small Guppy", cost: 50, type: "fish" },
  { id: "color-fish", name: "Neon Tetra", cost: 100, type: "fish" },
  { id: "rare-fish", name: "Angelfish", cost: 300, type: "fish" },
  { id: "golden-fish", name: "Golden Koi", cost: 500, type: "fish" },
  { id: "water-plant", name: "Sea Grass", cost: 70, type: "decor" },
  { id: "castle", name: "Treasure Castle", cost: 180, type: "decor" },
  { id: "coral", name: "Rainbow Coral", cost: 140, type: "decor" },
  { id: "rocks", name: "Smooth River Rocks", cost: 60, type: "decor" }
];

export const activityOptions: Record<ActivityKind, { label: string; points: number }> = {
  attendance: { label: "Sunday School Attendance", points: 10 },
  outreach: { label: "Outreach Attendance", points: 15 },
  verse: { label: "Bible Verse Memorized", points: 20 },
  quiz: { label: "Quiz Question Correct", points: 15 },
  discussion: { label: "Discussion Participation", points: 5 },
  bible: { label: "Brought Bible to Class", points: 2 },
  event: { label: "Church Event Joined", points: 20 },
  helping: { label: "Helped a Classmate", points: 10 },
  custom: { label: "Custom Teacher Award", points: 5 }
};

export const badgeDefinitions: Badge[] = [
  // Attendance Badges
  {
    id: "first-steps",
    name: "First Steps",
    icon: "👣",
    description: "Attend 1 session",
    condition: "Attend 1 session",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" || a.kind === "outreach").length >= 1
  },
  {
    id: "faithful-beginner",
    name: "Faithful Beginner",
    icon: "🌱",
    description: "Attend 5 sessions",
    condition: "Attend 5 sessions",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" || a.kind === "outreach").length >= 5
  },
  {
    id: "dedicated-learner",
    name: "Dedicated Learner",
    icon: "📖",
    description: "Attend 10 sessions",
    condition: "Attend 10 sessions",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" || a.kind === "outreach").length >= 10
  },
  {
    id: "consistent-member",
    name: "Consistent Member",
    icon: "⚓",
    description: "Attend 20 sessions",
    condition: "Attend 20 sessions",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" || a.kind === "outreach").length >= 20
  },
  {
    id: "always-present",
    name: "Always Present",
    icon: "☀️",
    description: "Attend 50 sessions",
    condition: "Attend 50 sessions",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" || a.kind === "outreach").length >= 50
  },
  {
    id: "sunday-champion",
    name: "Sunday Champion",
    icon: "⛪",
    description: "Attend 10 Sunday School sessions",
    condition: "Attend 10 Sunday School sessions",
    category: "attendance",
    check: (s) => s.activities.filter((a) => a.kind === "attendance" && a.label.includes("Sunday School")).length >= 10
  },

  // Outreach Badges
  {
    id: "first-mission",
    name: "First Mission",
    icon: "🌱",
    description: "Attend 1 Outreach",
    condition: "Attend 1 Outreach",
    category: "outreach",
    check: (s) => s.activities.filter((a) => a.kind === "outreach").length >= 1
  },
  {
    id: "outreach-faithful",
    name: "Outreach Faithful",
    icon: "🌿",
    description: "Attend 3 Outreach events",
    condition: "Attend 3 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter((a) => a.kind === "outreach").length >= 3
  },
  {
    id: "outreach-hero",
    name: "Outreach Hero",
    icon: "🌍",
    description: "Attend 5 Outreach events",
    condition: "Attend 5 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter((a) => a.kind === "outreach").length >= 5
  },
  {
    id: "mission-dedicated",
    name: "Mission Dedicated",
    icon: "✝️",
    description: "Attend 10 Outreach events",
    condition: "Attend 10 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter((a) => a.kind === "outreach").length >= 10
  },
  {
    id: "outreach-champion",
    name: "Outreach Champion",
    icon: "🏅",
    description: "Attend 20 Outreach events",
    condition: "Attend 20 Outreach events",
    category: "outreach",
    check: (s) => s.activities.filter((a) => a.kind === "outreach").length >= 20
  },

  // Scripture Badges
  {
    id: "verse-explorer",
    name: "Verse Explorer",
    icon: "🔍",
    description: "Memorize 1 Bible verse",
    condition: "Memorize 1 Bible verse",
    category: "scripture",
    check: (s) => s.activities.filter((a) => a.kind === "verse").length >= 1
  },
  {
    id: "scripture-learner",
    name: "Scripture Learner",
    icon: "🧠",
    description: "Memorize 5 verses",
    condition: "Memorize 5 verses",
    category: "scripture",
    check: (s) => s.activities.filter((a) => a.kind === "verse").length >= 5
  },
  {
    id: "word-keeper",
    name: "Word Keeper",
    icon: "📥",
    description: "Memorize 10 verses",
    condition: "Memorize 10 verses",
    category: "scripture",
    check: (s) => s.activities.filter((a) => a.kind === "verse").length >= 10
  },
  {
    id: "scripture-master",
    name: "Scripture Master",
    icon: "🎓",
    description: "Memorize 20 verses",
    condition: "Memorize 20 verses",
    category: "scripture",
    check: (s) => s.activities.filter((a) => a.kind === "verse").length >= 20
  },
  {
    id: "living-word",
    name: "Living Word",
    icon: "🔥",
    description: "Memorize 50 verses",
    condition: "Memorize 50 verses",
    category: "scripture",
    check: (s) => s.activities.filter((a) => a.kind === "verse").length >= 50
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
    check: (s) => s.activities.filter((a) => a.kind === "quiz").length >= 1
  },
  {
    id: "bible-scholar",
    name: "Bible Scholar",
    icon: "📜",
    description: "Answer 10 quizzes correctly",
    condition: "Answer 10 quizzes correctly",
    category: "quiz",
    check: (s) => s.activities.filter((a) => a.kind === "quiz").length >= 10
  },
  {
    id: "trivia-master",
    name: "Trivia Master",
    icon: "👑",
    description: "Answer 25 quizzes correctly",
    condition: "Answer 25 quizzes correctly",
    category: "quiz",
    check: (s) => s.activities.filter((a) => a.kind === "quiz").length >= 25
  },

  // Character Badges
  {
    id: "kind-heart",
    name: "Kind Heart",
    icon: "❤️",
    description: "Help a classmate 1 time",
    condition: "Help a classmate 1 time",
    category: "character",
    check: (s) => s.activities.filter((a) => a.kind === "helping").length >= 1
  },
  {
    id: "servant-leader",
    name: "Servant Leader",
    icon: "🤝",
    description: "Help a classmate 5 times",
    condition: "Help a classmate 5 times",
    category: "character",
    check: (s) => s.activities.filter((a) => a.kind === "helping").length >= 5
  },
  {
    id: "community-pillar",
    name: "Community Pillar",
    icon: "🏛️",
    description: "Help a classmate 10 times",
    condition: "Help a classmate 10 times",
    category: "character",
    check: (s) => s.activities.filter((a) => a.kind === "helping").length >= 10
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
    badges: ["first-steps", "faith-starter", "verse-explorer", "quiz-taker", "kind-heart"]
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
      { id: "init-bible-m", date: "2026-07-19", kind: "bible", label: "Brought Bible to Class", points: 2 }
    ],
    badges: ["first-steps", "faith-starter", "verse-explorer"]
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
    badges: ["first-steps", "kind-heart"]
  }
];

const starterQuizzes: SavedQuiz[] = [
  {
    id: "quiz-bible-basics",
    title: "Bible Basics Explorer",
    pointsPerCorrect: 15,
    createdAt: "2026-07-12T12:00:00Z",
    questions: [
      { id: "q1", question: "How many books are in the Holy Bible?", options: ["46", "66", "72", "39"], correctIndex: 1 },
      { id: "q2", question: "What is the first book of the Bible?", options: ["Exodus", "Genesis", "Matthew", "John"], correctIndex: 1 },
      { id: "q3", question: "In what town was Jesus born?", options: ["Nazareth", "Jerusalem", "Bethlehem", "Rome"], correctIndex: 2 }
    ]
  },
  {
    id: "quiz-ot-heroes",
    title: "Heroes of the Old Testament",
    pointsPerCorrect: 15,
    createdAt: "2026-07-12T12:05:00Z",
    questions: [
      { id: "q4", question: "Who built the Ark according to God's instructions?", options: ["Moses", "Noah", "Abraham", "David"], correctIndex: 1 },
      { id: "q5", question: "Who was swallowed by a great fish when running from God?", options: ["Jonah", "Daniel", "Paul", "Peter"], correctIndex: 0 },
      { id: "q6", question: "What giant did young David defeat with a sling and stone?", options: ["Goliath", "Og", "Saul", "Samson"], correctIndex: 0 }
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
  try {
    const value = new Date(`${dateString}T00:00:00`);
    return value.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

export function totalPoints(student: Student) {
  const earned = (student.activities || []).reduce((sum, activity) => sum + (activity.points || 0), 0);
  const spent = (student.rewards || []).reduce((sum, rewardId) => {
    const reward = rewardCatalog.find((item) => item.id === rewardId);
    return sum + (reward?.cost ?? 0);
  }, 0);

  return { earned, spent, available: Math.max(earned - spent, 0) };
}

export function treeLevel(points: number) {
  if (points >= 650) {
    return { level: 5, name: "Tree of Wisdom", stage: "Mighty Oak", percent: 100, nextAt: 650, icon: "🌳" };
  }
  if (points >= 400) {
    const progress = points - 400;
    return { level: 4, name: "Blossom Tree", stage: "Fruitful Branch", percent: Math.min(100, Math.round((progress / 250) * 100)), nextAt: 650, icon: "🌲" };
  }
  if (points >= 220) {
    const progress = points - 220;
    return { level: 3, name: "Growing Tree", stage: "Young Tree", percent: Math.min(100, Math.round((progress / 180) * 100)), nextAt: 400, icon: "🌿" };
  }
  if (points >= 80) {
    const progress = points - 80;
    return { level: 2, name: "Sapling", stage: "Green Sprout", percent: Math.min(100, Math.round((progress / 140) * 100)), nextAt: 220, icon: "🌱" };
  }
  return { level: 1, name: "Seed", stage: "Planted Seed", percent: Math.min(100, Math.round((points / 80) * 100)), nextAt: 80, icon: "🌰" };
}

export function checkAndAwardBadges(
  student: Student,
  onAward?: (badgeName: string) => void
): Student {
  const currentBadges = new Set(student.badges || []);
  let newlyAwarded = false;

  badgeDefinitions.forEach((b) => {
    if (!currentBadges.has(b.id) && b.check(student)) {
      currentBadges.add(b.id);
      newlyAwarded = true;
      if (onAward) {
        onAward(b.name);
      }
    }
  });

  if (newlyAwarded) {
    return { ...student, badges: Array.from(currentBadges) };
  }
  return student;
}

// ==========================================
// 4. MAIN FAITHQUEST APPLICATION COMPONENT
// ==========================================

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function routeUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      router.replace(profile?.role === "admin" ? "/admin" : "/dashboard");
    }

    routeUser();
  }, [router, supabase]);

  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <h1>FaithQuest</h1>
      <p>Loading...</p>
    </div>
  );
}

export function ClassroomPage({ classId }: { classId?: string } = {}) {
  // --- Persistent States ---
  const [students, setStudents] = useState<Student[]>(starterStudents);
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>(starterQuizzes);
  const [theme, setTheme] = useState<"emerald" | "gold" | "aqua">("emerald");
  const [soundOn, setSoundOn] = useState(true);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [syncRetry, setSyncRetry] = useState(0);

  // --- UI Navigation / View States ---
  const [activeView, setActiveView] = useState<
    "dashboard" | "students" | "attendance" | "livePoints" | "quizBuilder" | "runQuiz" | "leaderboard" | "manage"
  >("dashboard");

  // --- Filters, Search, Modals ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [studentSortBy, setStudentSortBy] = useState<"points" | "name" | "badges">("points");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"aquarium" | "tree" | "badges" | "history">("aquarium");
  const [flashMessage, setFlashMessage] = useState<{ title: string; desc?: string } | null>(null);

  // --- Projector & Time Mode ---
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // --- Modals / Popups ---
  const [showQuickAttendance, setShowQuickAttendance] = useState(false);
  const [showQuickAward, setShowQuickAward] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [pendingDeleteStudentId, setPendingDeleteStudentId] = useState<string | null>(null);

  // --- Quick Award States ---
  const [quickAwardStudentId, setQuickAwardStudentId] = useState("");
  const [quickAwardAmount, setQuickAwardAmount] = useState(10);
  const [quickAwardLabel, setQuickAwardLabel] = useState("Quick Teacher Award");

  // --- Live Points Session States ---
  const [selectedPointStudents, setSelectedPointStudents] = useState<string[]>([]);
  const [customPointAmount, setCustomPointAmount] = useState(5);
  const [customPointReason, setCustomPointReason] = useState("Good Behavior / Helping");
  const [liveSessionLog, setLiveSessionLog] = useState<
    Array<{ id: string; time: string; studentName: string; label: string; points: number }>
  >([]);

  // --- Attendance States ---
  const [attendanceSessionType, setAttendanceSessionType] = useState<"sundaySchool" | "outreach">("sundaySchool");
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [presentStudentIds, setPresentStudentIds] = useState<Set<string>>(new Set());

  // --- Quiz Builder States ---
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderPoints, setBuilderPoints] = useState(15);
  const [builderQuestions, setBuilderQuestions] = useState<QuizQuestion[]>([
    { id: `q-${Date.now()}-0`, question: "", options: ["", "", "", ""], correctIndex: 0 }
  ]);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // --- Run Quiz Projector States ---
  const [activeQuiz, setActiveQuiz] = useState<SavedQuiz | null>(null);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizStage, setQuizStage] = useState<"question" | "options" | "reveal" | "award">("question");
  const [quizAwardedStudents, setQuizAwardedStudents] = useState<Set<string>>(new Set());

  // --- New Student Form State ---
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("Sunday School");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedStateRef = useRef<string>("");

  // ==========================================
  // 5. CLOCK, KEYBOARD ACCESSIBILITY & PERSISTENCE
  // ==========================================

  // Global Escape key modal dismisser
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileModalOpen(false);
        setShowQuickAttendance(false);
        setShowQuickAward(false);
        setShowAddStudentModal(false);
        setPendingDeleteStudentId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Projector live clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
          " • " +
          now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Hydration from Supabase / localStorage
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const persisted = await loadPersistedState(classId);
      if (cancelled) return;

      if (!persisted) {
        const initialStudents = classId ? [] : starterStudents;
        const initialQuizzes = classId ? [] : starterQuizzes;
        setStudents(initialStudents);
        setQuizzes(initialQuizzes);
        setTheme("emerald");
        setSoundOn(true);
        lastSavedStateRef.current = JSON.stringify({
          students: initialStudents,
          quizzes: initialQuizzes,
          theme: "emerald",
          sound: true
        });
        return;
      }

      const loadedStudents = Array.isArray(persisted.students)
        ? (persisted.students as Student[])
        : starterStudents;
      const loadedQuizzes = Array.isArray(persisted.quizzes)
        ? (persisted.quizzes as SavedQuiz[])
        : starterQuizzes;

      const migrated = loadedStudents.map((student) => checkAndAwardBadges(student));

      const stateToPersist = {
        students: migrated,
        quizzes: loadedQuizzes,
        theme: persisted.theme,
        sound: persisted.sound
      };

      setStudents(migrated);
      setTheme(persisted.theme);
      setSoundOn(persisted.sound);
      setQuizzes(loadedQuizzes);
      lastSavedStateRef.current = JSON.stringify(stateToPersist);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  // Sync state changes from Supabase
  useEffect(() => {
    const unsubscribe = subscribeToStateChanges((newState) => {
      const serialized = JSON.stringify(newState);
      if (serialized === lastSavedStateRef.current) return;

      lastSavedStateRef.current = serialized;

      setStudents((curr) => {
        const nextStr = JSON.stringify(newState.students);
        if (JSON.stringify(curr) !== nextStr) {
          return (newState.students as Student[]).map((s) => checkAndAwardBadges(s));
        }
        return curr;
      });

      setQuizzes((curr) => {
        if (JSON.stringify(curr) !== JSON.stringify(newState.quizzes)) {
          return newState.quizzes as SavedQuiz[];
        }
        return curr;
      });

      setTheme((curr) => (curr !== newState.theme ? newState.theme : curr));
      setSoundOn((curr) => (curr !== newState.sound ? newState.sound : curr));
    }, classId);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [classId]);

  // Save whenever state changes
  useEffect(() => {
    if (!lastSavedStateRef.current) return;
    const stateToSave = {
      students,
      quizzes,
      theme,
      sound: soundOn
    };
    const serialized = JSON.stringify(stateToSave);
    if (serialized === lastSavedStateRef.current) return;
    lastSavedStateRef.current = serialized;
    setSyncState("saving");
    setSyncError("");
    const timer = window.setTimeout(() => {
      void savePersistedState(stateToSave, classId)
        .then(() => setSyncState("saved"))
        .catch((error: unknown) => {
          setSyncState("error");
          setSyncError(error instanceof Error ? error.message : "Unable to save classroom changes");
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [students, quizzes, theme, soundOn, classId, syncRetry]);

  // Apply theme to body dataset
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ==========================================
  // 6. SYNTHETIC AUDIO & TOAST ALERTS
  // ==========================================

  function playSynthSound(type: "sparkles" | "success" | "splash" | "fanfare" | "pop") {
    if (typeof window === "undefined" || !soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "sparkles") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.06, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.25);
        });
      } else if (type === "success" || type === "fanfare") {
        [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.08, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.35);
        });
      } else if (type === "splash") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "pop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn("AudioContext playback unavailable", e);
    }
  }

  function triggerToast(title: string, desc?: string) {
    setFlashMessage({ title, desc });
    setTimeout(() => {
      setFlashMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  }

  // Award Points Helper
  const awardPointsToStudent = (
    studentId: string,
    points: number,
    label: string,
    kind: ActivityKind = "custom"
  ) => {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    const activityDate = today();
    if ((kind === "attendance" || kind === "outreach")
      && student.activities.some((activity) => activity.kind === kind && activity.date === activityDate)) {
      triggerToast("Already recorded", `${student.name} already has ${label} for today.`);
      return;
    }

    const newAct: Activity = {
      id: crypto.randomUUID(),
      date: activityDate,
      kind,
      label,
      points
    };
    const updatedStudent = checkAndAwardBadges({
      ...student,
      activities: [newAct, ...(student.activities || [])]
    }, (bName) => {
      triggerToast(`🎉 Badge Unlocked!`, `${student.name} earned "${bName}"!`);
    });
    setStudents((prev) => prev.map((item) => item.id === studentId ? updatedStudent : item));

    void recordPersistedActivity(studentId, newAct)
      .then(() => syncPersistedBadges(studentId, updatedStudent.badges || []))
      .catch((error: unknown) => {
        setSyncState("error");
        setSyncError(error instanceof Error ? error.message : "Unable to save activity");
      });

    // Record in live session log
    setLiveSessionLog((prev) => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        studentName: student.name,
        label,
        points
      },
      ...prev
    ]);

    playSynthSound(points >= 20 ? "fanfare" : "sparkles");
    triggerToast(`+${points} Points!`, `${student.name} received points for: ${label}`);
  };

  // Bulk Award Points Helper
  const awardPointsToMultiple = (
    studentIds: string[],
    points: number,
    label: string,
    kind: ActivityKind = "custom"
  ) => {
    if (studentIds.length === 0) return;
    const dateStr = today();

    const updates = new Map<string, { student: Student; activity: Activity }>();
    for (const student of students) {
      if (!studentIds.includes(student.id)) continue;
      if ((kind === "attendance" || kind === "outreach")
        && student.activities.some((activity) => activity.kind === kind && activity.date === dateStr)) {
        continue;
      }
        const newAct: Activity = {
          id: crypto.randomUUID(),
          date: dateStr,
          kind,
          label,
          points
        };
        const updated = checkAndAwardBadges({
          ...student,
          activities: [newAct, ...(student.activities || [])]
        }, (bName) => {
          triggerToast(`🎉 Badge Unlocked!`, `${student.name} unlocked "${bName}"!`);
        });
        updates.set(student.id, { student: updated, activity: newAct });
    }

    if (updates.size === 0) {
      triggerToast("Already recorded", "The selected attendance entries already exist for today.");
      return;
    }

    setStudents((prev) => prev.map((student) => updates.get(student.id)?.student || student));
    void Promise.all(Array.from(updates.entries()).map(async ([studentId, update]) => {
      await recordPersistedActivity(studentId, update.activity);
      await syncPersistedBadges(studentId, update.student.badges || []);
    })).catch((error: unknown) => {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "Unable to save activities");
    });

    Array.from(updates.keys()).forEach((id) => {
      const s = students.find((x) => x.id === id);
      if (s) {
        setLiveSessionLog((prev) => [
          {
            id: `log-${Date.now()}-${id}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            studentName: s.name,
            label,
            points
          },
          ...prev
        ]);
      }
    });

    playSynthSound("fanfare");
    triggerToast(`⚡ Points Awarded!`, `+${points} points given to ${updates.size} students.`);
  };

  // ==========================================
  // 7. COMPUTED STATS & DATA
  // ==========================================

  const groupsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.group || "Sunday School"));
    return ["All", ...Array.from(set)];
  }, [students]);

  const rankedStudents = useMemo(() => {
    return [...students].sort((a, b) => totalPoints(b).earned - totalPoints(a).earned);
  }, [students]);

  const topStudent = rankedStudents[0] || null;

  const totalPointsAwardedAll = useMemo(() => {
    return students.reduce((sum, s) => sum + totalPoints(s).earned, 0);
  }, [students]);

  const presentTodayCount = useMemo(() => {
    const todayStr = today();
    return students.filter((s) =>
      s.activities?.some((a) => a.date === todayStr && (a.kind === "attendance" || a.kind === "outreach"))
    ).length;
  }, [students]);

  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === "All" || s.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });

    if (studentSortBy === "points") {
      list = list.sort((a, b) => totalPoints(b).earned - totalPoints(a).earned);
    } else if (studentSortBy === "name") {
      list = list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (studentSortBy === "badges") {
      list = list.sort((a, b) => (b.badges?.length || 0) - (a.badges?.length || 0));
    }

    return list;
  }, [students, searchQuery, selectedGroup, studentSortBy]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Recent 15 Activity Events
  const recentActivities = useMemo(() => {
    const all: Array<{ studentName: string; studentId: string; activity: Activity }> = [];
    students.forEach((s) => {
      (s.activities || []).forEach((act) => {
        all.push({ studentName: s.name, studentId: s.id, activity: act });
      });
    });
    return all.sort((a, b) => b.activity.date.localeCompare(a.activity.date)).slice(0, 15);
  }, [students]);

  // Tree Level Distribution
  const treeDistribution = useMemo(() => {
    const counts = { Seed: 0, Sapling: 0, "Growing Tree": 0, "Blossom Tree": 0, "Tree of Wisdom": 0 };
    students.forEach((s) => {
      const lvl = treeLevel(totalPoints(s).earned);
      if (lvl.level === 1) counts.Seed++;
      else if (lvl.level === 2) counts.Sapling++;
      else if (lvl.level === 3) counts["Growing Tree"]++;
      else if (lvl.level === 4) counts["Blossom Tree"]++;
      else if (lvl.level === 5) counts["Tree of Wisdom"]++;
    });
    return counts;
  }, [students]);

  // ==========================================
  // 8. ACTIONS & HANDLERS
  // ==========================================

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newStudentName.trim(),
      group: newStudentGroup,
      joinedAt: today(),
      activities: [],
      rewards: [],
      badges: []
    };
    if (classId) {
      try {
        await createPersistedStudent(classId, newStudent);
      } catch (error) {
        setSyncState("error");
        setSyncError(error instanceof Error ? error.message : "Unable to add student");
        return;
      }
    }
    setStudents((prev) => [newStudent, ...prev]);
    setNewStudentName("");
    setShowAddStudentModal(false);
    playSynthSound("success");
    triggerToast("Student Enrolled", `${newStudent.name} joined ${newStudent.group}!`);
  };

  const handleDeleteStudent = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    try {
      await archivePersistedStudent(studentId);
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "Unable to archive student");
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setPendingDeleteStudentId(null);
    if (selectedStudentId === studentId) {
      setIsProfileModalOpen(false);
      setSelectedStudentId(null);
    }
    playSynthSound("pop");
    triggerToast("Student Removed", `${student.name} was removed from the roster.`);
  };

  const handleDeleteQuiz = async (quiz: SavedQuiz) => {
    try {
      await deletePersistedQuiz(quiz.id);
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "Unable to delete quiz");
      return;
    }
    setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id));
    triggerToast("Quiz Deleted", `Removed "${quiz.title}"`);
  };

  const handleRedeemReward = async (student: Student, reward: Reward) => {
    if (student.rewards.includes(reward.id)) {
      triggerToast("Already collected", `${student.name} already owns ${reward.name}.`);
      return;
    }
    if (totalPoints(student).available < reward.cost) {
      triggerToast("Not enough points", `${student.name} needs ${reward.cost} points for ${reward.name}.`);
      return;
    }

    try {
      await redeemPersistedReward(student.id, reward.id);
    } catch (error) {
      setSyncState("error");
      setSyncError(error instanceof Error ? error.message : "Unable to redeem reward");
      return;
    }

    setStudents((prev) => prev.map((item) => item.id === student.id
      ? { ...item, rewards: [...item.rewards, reward.id] }
      : item));
    playSynthSound("splash");
    triggerToast("Reward redeemed", `${student.name} collected ${reward.name}!`);
  };

  const handleSaveQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!builderTitle.trim()) return;

    let savedQuiz: SavedQuiz;
    if (editingQuizId) {
      const existingQuiz = quizzes.find((quiz) => quiz.id === editingQuizId);
      if (!existingQuiz) return;
      savedQuiz = {
        ...existingQuiz,
        title: builderTitle.trim(),
        pointsPerCorrect: builderPoints,
        questions: builderQuestions,
      };
    } else {
      savedQuiz = {
        id: crypto.randomUUID(),
        title: builderTitle.trim(),
        pointsPerCorrect: builderPoints,
        questions: builderQuestions,
        createdAt: new Date().toISOString()
      };
    }

    if (classId) {
      try {
        await upsertPersistedQuiz(classId, savedQuiz);
      } catch (error) {
        setSyncState("error");
        setSyncError(error instanceof Error ? error.message : "Unable to save quiz");
        return;
      }
    }

    if (editingQuizId) {
      setQuizzes((prev) => prev.map((quiz) => quiz.id === savedQuiz.id ? savedQuiz : quiz));
      setEditingQuizId(null);
      triggerToast("Quiz Updated", `Saved changes to "${savedQuiz.title}"`);
    } else {
      setQuizzes((prev) => [savedQuiz, ...prev]);
      triggerToast("Quiz Created", `Added "${savedQuiz.title}" with ${savedQuiz.questions.length} questions!`);
    }

    setBuilderTitle("");
    setBuilderQuestions([{ id: `q-${Date.now()}-0`, question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    playSynthSound("success");
  };

  const handleExportCSV = () => {
    const headers = "Student ID,Name,Group,Total Points,Badges Count,Joined Date\n";
    const rows = students
      .map((s) => `"${s.id}","${s.name}","${s.group}",${totalPoints(s).earned},${s.badges?.length || 0},"${s.joinedAt}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FaithQuest-Roster-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    playSynthSound("sparkles");
    triggerToast("Export Complete", "CSV roster downloaded successfully.");
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ students, quizzes, theme, sound: soundOn }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FaithQuest-Backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    playSynthSound("sparkles");
    triggerToast("Backup Downloaded", "Full state saved to JSON file.");
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    if (classId) {
      e.target.value = "";
      triggerToast("Import disabled", "Shared classrooms require a reviewed server-side import.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.students)) {
          setStudents(parsed.students.map((s: Student) => checkAndAwardBadges({
            ...s,
            id: crypto.randomUUID(),
            activities: (s.activities || []).map((activity) => ({
              ...activity,
              id: crypto.randomUUID(),
            })),
          })));
        }
        if (Array.isArray(parsed.quizzes)) {
          setQuizzes(parsed.quizzes.map((quiz: SavedQuiz) => ({
            ...quiz,
            id: crypto.randomUUID(),
          })));
        }
        if (parsed.theme) setTheme(parsed.theme);
        playSynthSound("success");
        triggerToast("Restore Successful", "Student records and quizzes loaded.");
      } catch (err) {
        console.error("JSON restore parse error", err);
        triggerToast("Import Failed", "Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`app-container ${isProjectorMode ? "projector-mode" : ""}`}>
      {syncState === "error" && (
        <div role="alert" style={{
          position: "sticky", top: 0, zIndex: 1000, padding: "10px 16px",
          background: "#b91c1c", color: "white", textAlign: "center", fontWeight: 700
        }}>
          Changes are not saved to Supabase: {syncError}{" "}
          <button
            type="button"
            onClick={() => {
              lastSavedStateRef.current = "__retry__";
              setSyncRetry((value) => value + 1);
            }}
            style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: 0, fontWeight: 800 }}
          >
            Retry
          </button>
        </div>
      )}
      {syncState === "saving" && (
        <div aria-live="polite" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1000,
          padding: "8px 12px", borderRadius: 10, background: "#0f172a", color: "white", fontSize: 13 }}>
          Saving…
        </div>
      )}
      {/* ==========================================
          HEADER HERO BANNER
          ========================================== */}
      <header className="hero-banner">
        <div className="hero-top-row">
          <div className="brand-badge">
            <Sparkles size={20} color="var(--accent-light)" />
            <span>FAITHQUEST</span>
            <span style={{ opacity: 0.7, fontSize: "0.85rem", fontWeight: 600 }}>• Classroom Command</span>
          </div>

          <div className="hero-controls">
            {/* Live Clock */}
            <div className="control-btn" style={{ cursor: "default" }}>
              <Clock size={16} />
              <span>{currentDateTime || "Live Session"}</span>
            </div>

            {/* Theme Switcher */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className={`control-btn ${theme === "emerald" ? "active" : ""}`}
                onClick={() => {
                  setTheme("emerald");
                  playSynthSound("sparkles");
                }}
                title="Emerald Theme"
              >
                🌿 Emerald
              </button>
              <button
                className={`control-btn ${theme === "gold" ? "active" : ""}`}
                onClick={() => {
                  setTheme("gold");
                  playSynthSound("sparkles");
                }}
                title="Royal Gold Theme"
              >
                👑 Gold
              </button>
              <button
                className={`control-btn ${theme === "aqua" ? "active" : ""}`}
                onClick={() => {
                  setTheme("aqua");
                  playSynthSound("sparkles");
                }}
                title="Ocean Aqua Theme"
              >
                🌊 Aqua
              </button>
            </div>

            {/* Sound Synthesizer Toggle */}
            <button
              className={`control-btn ${soundOn ? "active" : ""}`}
              onClick={() => {
                setSoundOn(!soundOn);
                if (!soundOn) playSynthSound("sparkles");
              }}
              title={soundOn ? "Sound Effects ON" : "Sound Effects OFF"}
            >
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundOn ? "Audio ON" : "Muted"}</span>
            </button>

            {/* Projector Mode Toggle */}
            <button
              className={`control-btn ${isProjectorMode ? "active" : ""}`}
              onClick={() => {
                setIsProjectorMode(!isProjectorMode);
                playSynthSound("pop");
              }}
              title="Toggle Large Screen Projector Mode"
            >
              <Monitor size={16} />
              <span>Projector</span>
            </button>
          </div>
        </div>

        <div className="hero-main-content">
          <div className="hero-title-group">
            <h1>Sunday School & Outreach Dashboard</h1>
            <p>
              Gamified live reward board for interactive church learning, attendance tracking, live quizzes, and spiritual growth.
            </p>
          </div>

          <div className="hero-stats-deck">
            <div className="stat-pill">
              <div className="stat-pill-icon">
                <Users size={22} />
              </div>
              <div className="stat-pill-info">
                <span>Enrolled</span>
                <strong>{students.length}</strong>
              </div>
            </div>

            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: "var(--accent-glow)" }}>
                <Trophy size={22} color="var(--accent-light)" />
              </div>
              <div className="stat-pill-info">
                <span>Total Points</span>
                <strong>{totalPointsAwardedAll}</strong>
              </div>
            </div>

            <div className="stat-pill">
              <div className="stat-pill-icon" style={{ background: "rgba(16, 185, 129, 0.3)" }}>
                <CheckSquare size={22} color="var(--success)" />
              </div>
              <div className="stat-pill-info">
                <span>Present Today</span>
                <strong>{presentTodayCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          TAB NAVIGATION (8 TACTILE BUTTONS)
          ========================================== */}
      <nav className="nav-tabs-container">
        <button
          className={`nav-tab-btn ${activeView === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setActiveView("dashboard");
            playSynthSound("pop");
          }}
        >
          <HomeIcon size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "students" ? "active" : ""}`}
          onClick={() => {
            setActiveView("students");
            playSynthSound("pop");
          }}
        >
          <Users size={18} />
          <span>Students ({students.length})</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "attendance" ? "active" : ""}`}
          onClick={() => {
            setActiveView("attendance");
            playSynthSound("pop");
          }}
        >
          <CheckSquare size={18} />
          <span>Attendance</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "livePoints" ? "active" : ""}`}
          onClick={() => {
            setActiveView("livePoints");
            playSynthSound("pop");
          }}
        >
          <Zap size={18} />
          <span>Live Points</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "quizBuilder" ? "active" : ""}`}
          onClick={() => {
            setActiveView("quizBuilder");
            playSynthSound("pop");
          }}
        >
          <BookOpen size={18} />
          <span>Quiz Builder ({quizzes.length})</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "runQuiz" ? "active" : ""}`}
          onClick={() => {
            setActiveView("runQuiz");
            playSynthSound("pop");
          }}
        >
          <Target size={18} />
          <span>Run Quiz</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "leaderboard" ? "active" : ""}`}
          onClick={() => {
            setActiveView("leaderboard");
            playSynthSound("pop");
          }}
        >
          <Trophy size={18} />
          <span>Leaderboard</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === "manage" ? "active" : ""}`}
          onClick={() => {
            setActiveView("manage");
            playSynthSound("pop");
          }}
        >
          <Settings size={18} />
          <span>Manage</span>
        </button>
      </nav>

      {/* ==========================================
          VIEW 1: DASHBOARD TAB
          ========================================== */}
      {activeView === "dashboard" && (
        <div className="dashboard-grid">
          {/* Left Column: Spotlight & Quick Actions & Alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top Student Spotlight Card */}
            {topStudent ? (
              <div className="spotlight-card">
                <div className="spotlight-header">
                  <div className="spotlight-badge">
                    <Crown size={16} />
                    <span>#1 CLASS LEADER</span>
                  </div>
                  <span style={{ fontSize: "0.88rem", opacity: 0.85 }}>
                    {treeLevel(totalPoints(topStudent).earned).name}
                  </span>
                </div>

                <div className="spotlight-body">
                  <div className="spotlight-avatar">
                    <span className="spotlight-crown">👑</span>
                    {topStudent.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "1.8rem", margin: "0 0 4px", color: "var(--text-inverse)" }}>
                      {topStudent.name}
                    </h2>
                    <p style={{ margin: "0 0 10px", opacity: 0.85, fontSize: "0.95rem" }}>
                      {topStudent.group} • {topStudent.badges?.length || 0} Badges Earned
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          padding: "6px 14px",
                          borderRadius: "var(--radius-md)",
                          fontWeight: 800,
                          fontSize: "1.2rem",
                          fontFamily: "Baloo 2"
                        }}
                      >
                        {totalPoints(topStudent).earned} Faith Points
                      </div>

                      <button
                        className="clay-btn clay-btn-accent clay-btn-sm"
                        onClick={() => {
                          setSelectedStudentId(topStudent.id);
                          setIsProfileModalOpen(true);
                          playSynthSound("pop");
                        }}
                      >
                        View Profile & Aquarium
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Quick Tools Panel */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.3rem", marginBottom: "4px" }}>⚡ Teacher Quick Actions</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Execute the most frequent classroom tasks without switching tabs.
              </p>

              <div className="quick-tools-grid">
                <button
                  className="quick-tool-btn"
                  onClick={() => setShowQuickAttendance(true)}
                >
                  <CheckSquare size={24} color="var(--primary)" />
                  <span>Mark Attendance</span>
                </button>

                <button
                  className="quick-tool-btn"
                  onClick={() => setShowQuickAward(true)}
                >
                  <Zap size={24} color="var(--accent)" />
                  <span>Quick Award</span>
                </button>

                <button
                  className="quick-tool-btn"
                  onClick={() => {
                    if (quizzes.length > 0) {
                      setActiveQuiz(quizzes[0]);
                      setQuizQuestionIndex(0);
                      setQuizStage("question");
                      setActiveView("runQuiz");
                    } else {
                      setActiveView("quizBuilder");
                    }
                    playSynthSound("pop");
                  }}
                >
                  <Play size={24} color="var(--purple)" />
                  <span>Launch Quiz</span>
                </button>

                <button
                  className="quick-tool-btn"
                  onClick={() => setShowAddStudentModal(true)}
                >
                  <UserPlus size={24} color="var(--success)" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {/* Class Health Alerts */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>🔔 Class Insights & Highlights</h3>

              <div className="alert-item alert-item-success">
                <Sparkles size={20} color="var(--success)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Great Engagement!</strong> {presentTodayCount} of {students.length} students have participated in today's activities.
                </div>
              </div>

              {topStudent && (
                <div className="alert-item">
                  <Trophy size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Milestone Alert:</strong> {topStudent.name} is leading with {totalPoints(topStudent).earned} Faith Points!
                  </div>
                </div>
              )}

              <div className="alert-item alert-item-warning">
                <Flame size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Scripture Challenge:</strong> Memorize weekly Bible verses to unlock the exclusive "Scripture Master" badge.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Activity Feed & Tree Distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Live Activity Stream */}
            <div className="clay-card" style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "1.3rem" }}>📜 Recent Points Activity</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Last 15 events</span>
              </div>

              {recentActivities.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
                  No point awards recorded yet. Tap "Quick Award" or "Live Points" to get started!
                </p>
              ) : (
                <div className="activity-feed-list">
                  {recentActivities.map(({ studentName, activity }) => (
                    <div key={activity.id} className="activity-feed-item">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-md)",
                            background: "var(--primary-surface)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Baloo 2",
                            fontWeight: 800
                          }}
                        >
                          {studentName.slice(0, 1)}
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: "0.98rem" }}>{studentName}</strong>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{activity.label}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "Baloo 2",
                            fontWeight: 800,
                            color: "var(--primary)",
                            fontSize: "1.1rem"
                          }}
                        >
                          +{activity.points}
                        </span>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {formatCalendarDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tree Level Distribution Chart */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>🌳 Faith Tree Class Levels</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(treeDistribution).map(([stageName, count]) => {
                  const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                  return (
                    <div key={stageName} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem" }}>
                        <strong>{stageName}</strong>
                        <span>
                          {count} student{count === 1 ? "" : "s"} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: "10px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--card-surface-alt)",
                          overflow: "hidden",
                          border: "1px solid var(--card-border)"
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, var(--primary-light), var(--primary))",
                            borderRadius: "var(--radius-full)",
                            transition: "width 0.4s ease"
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 2: STUDENTS ROSTER & PROFILES
          ========================================== */}
      {activeView === "students" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Controls Bar */}
          <div className="clay-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1, minWidth: "280px" }}>
              {/* Search Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--card-surface-alt)",
                  border: "2px solid var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 14px",
                  flex: "1 0 200px"
                }}
              >
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: "none", background: "none", width: "100%", outline: "none" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Group Chips */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {groupsList.map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className="clay-btn clay-btn-sm"
                    style={{
                      background: selectedGroup === grp ? "var(--primary)" : "var(--card-surface-alt)",
                      color: selectedGroup === grp ? "var(--text-inverse)" : "var(--text-main)",
                      border: "1px solid var(--card-border)"
                    }}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort & Action */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                value={studentSortBy}
                onChange={(e) => setStudentSortBy(e.target.value as "points" | "name" | "badges")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid var(--card-border)",
                  background: "var(--card-surface-alt)",
                  fontWeight: 600
                }}
              >
                <option value="points">Sort by Points</option>
                <option value="name">Sort by Name</option>
                <option value="badges">Sort by Badges</option>
              </select>

              <button
                className="clay-btn clay-btn-primary clay-btn-sm"
                onClick={() => setShowAddStudentModal(true)}
              >
                <UserPlus size={16} />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Grid */}
          {filteredStudents.length === 0 ? (
            <div className="clay-card" style={{ textAlign: "center", padding: "50px 20px" }}>
              <HelpCircle size={48} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3>No students found</h3>
              <p style={{ color: "var(--text-muted)" }}>Try clearing search filters or add a new student.</p>
            </div>
          ) : (
            <div className="students-grid">
              {filteredStudents.map((s) => {
                const pts = totalPoints(s);
                const tree = treeLevel(pts.earned);
                return (
                  <div
                    key={s.id}
                    className="student-card clay-card-interactive"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setIsProfileModalOpen(true);
                      playSynthSound("pop");
                    }}
                  >
                    <div className="student-card-header">
                      <div className="student-avatar-box">
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="student-card-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.name}
                        </div>
                        <div className="student-card-group">{s.group}</div>
                      </div>
                      <div style={{ fontSize: "1.4rem" }} title={tree.name}>
                        {tree.icon}
                      </div>
                    </div>

                    <div className="student-card-points">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                          Faith Points
                        </div>
                        <div className="student-points-number">{pts.earned}</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.74rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                          Badges
                        </div>
                        <strong style={{ fontFamily: "Baloo 2", fontSize: "1.3rem", color: "var(--accent)" }}>
                          {s.badges?.length || 0}
                        </strong>
                      </div>
                    </div>

                    {/* Badge Chips Preview */}
                    <div style={{ display: "flex", gap: "6px", overflow: "hidden", height: "30px", alignItems: "center" }}>
                      {(s.badges || []).slice(0, 4).map((bId) => {
                        const bDef = badgeDefinitions.find((b) => b.id === bId);
                        return (
                          <span
                            key={bId}
                            title={bDef?.name || bId}
                            style={{
                              fontSize: "1.1rem",
                              background: "var(--card-surface-alt)",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--card-border)"
                            }}
                          >
                            {bDef?.icon || "🏅"}
                          </span>
                        );
                      })}
                      {(s.badges?.length || 0) > 4 && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
                          +{s.badges!.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Quick Button inside card */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                      <button
                        className="clay-btn clay-btn-primary clay-btn-sm"
                        style={{ flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickAwardStudentId(s.id);
                          setShowQuickAward(true);
                          playSynthSound("pop");
                        }}
                      >
                        <Zap size={14} />
                        <span>Award Points</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          VIEW 3: ATTENDANCE TAB
          ========================================== */}
      {activeView === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="clay-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            {/* Session Type & Date */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className={`clay-btn clay-btn-sm ${attendanceSessionType === "sundaySchool" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                  onClick={() => setAttendanceSessionType("sundaySchool")}
                >
                  ⛪ Sunday School (+10 pts)
                </button>
                <button
                  className={`clay-btn clay-btn-sm ${attendanceSessionType === "outreach" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                  onClick={() => setAttendanceSessionType("outreach")}
                >
                  🌍 Outreach Event (+15 pts)
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={18} color="var(--primary)" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    background: "var(--card-surface-alt)",
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            {/* Bulk Select / Submit */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="clay-btn clay-btn-secondary clay-btn-sm"
                onClick={() => {
                  setPresentStudentIds(new Set(students.map((s) => s.id)));
                  playSynthSound("pop");
                }}
              >
                Select All
              </button>
              <button
                className="clay-btn clay-btn-secondary clay-btn-sm"
                onClick={() => {
                  setPresentStudentIds(new Set());
                  playSynthSound("pop");
                }}
              >
                Clear
              </button>
              <button
                className="clay-btn clay-btn-accent clay-btn-sm"
                onClick={() => {
                  const ids = Array.from(presentStudentIds);
                  if (ids.length === 0) {
                    triggerToast("No Selection", "Please check at least one student.");
                    return;
                  }
                  const pts = attendanceSessionType === "sundaySchool" ? 10 : 15;
                  const label = attendanceSessionType === "sundaySchool" ? "Sunday School Attendance" : "Outreach Attendance";
                  const kind = attendanceSessionType === "sundaySchool" ? "attendance" : "outreach";
                  awardPointsToMultiple(ids, pts, label, kind);
                  setPresentStudentIds(new Set());
                }}
              >
                <CheckCircle2 size={16} />
                <span>Save Attendance ({presentStudentIds.size})</span>
              </button>
            </div>
          </div>

          {/* Student Checkbox Cards */}
          <div className="students-grid">
            {students.map((s) => {
              const isPresent = presentStudentIds.has(s.id);
              return (
                <div
                  key={s.id}
                  className="student-card clay-card-interactive"
                  style={{
                    borderColor: isPresent ? "var(--primary)" : "var(--card-border)",
                    background: isPresent ? "var(--primary-surface)" : "var(--card-bg)"
                  }}
                  onClick={() => {
                    const next = new Set(presentStudentIds);
                    if (next.has(s.id)) next.delete(s.id);
                    else next.add(s.id);
                    setPresentStudentIds(next);
                    playSynthSound("pop");
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-sm)",
                        border: "2px solid var(--primary)",
                        background: isPresent ? "var(--primary)" : "var(--card-bg)",
                        color: "var(--text-inverse)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {isPresent && <Check size={20} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "1.15rem", display: "block", fontFamily: "Baloo 2" }}>
                        {s.name}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.group}</span>
                    </div>

                    <span style={{ fontFamily: "Baloo 2", fontWeight: 800, color: "var(--primary)" }}>
                      {totalPoints(s).earned} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 4: LIVE POINTS TAB
          ========================================== */}
      {activeView === "livePoints" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
          {/* Left Column: Student Select & Point Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Step 1: Select Student(s) */}
            <div className="clay-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1.3rem" }}>1. Select Student(s)</h3>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="clay-btn clay-btn-secondary clay-btn-sm"
                    onClick={() => setSelectedPointStudents(students.map((s) => s.id))}
                  >
                    Select All
                  </button>
                  <button
                    className="clay-btn clay-btn-secondary clay-btn-sm"
                    onClick={() => setSelectedPointStudents([])}
                  >
                    Deselect
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", maxHeight: "240px", overflowY: "auto", padding: "4px" }}>
                {students.map((s) => {
                  const isSel = selectedPointStudents.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (isSel) {
                          setSelectedPointStudents((prev) => prev.filter((id) => id !== s.id));
                        } else {
                          setSelectedPointStudents((prev) => [...prev, s.id]);
                        }
                        playSynthSound("pop");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${isSel ? "var(--primary)" : "var(--card-border)"}`,
                        background: isSel ? "var(--primary-surface)" : "var(--card-surface-alt)",
                        color: isSel ? "var(--primary-dark)" : "var(--text-main)",
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: "Baloo 2",
                        fontSize: "1rem"
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Point Presets */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>2. Choose Point Preset</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "10px" }}>
                {Object.entries(activityOptions).map(([key, opt]) => (
                  <button
                    key={key}
                    className="clay-btn clay-btn-secondary"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      gap: "4px"
                    }}
                    onClick={() => {
                      if (selectedPointStudents.length === 0) {
                        triggerToast("Select a Student", "Please tap one or more students above.");
                        return;
                      }
                      awardPointsToMultiple(selectedPointStudents, opt.points, opt.label, key as ActivityKind);
                    }}
                  >
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>
                      +{opt.points} pts
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "left" }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Custom Amount Form */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>3. Or Custom Points</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="number"
                  value={customPointAmount}
                  onChange={(e) => setCustomPointAmount(Number(e.target.value))}
                  style={{
                    width: "90px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontFamily: "Baloo 2",
                    fontSize: "1.2rem",
                    fontWeight: 800
                  }}
                />
                <input
                  type="text"
                  placeholder="Reason (e.g. Excellent memory work, volunteered)"
                  value={customPointReason}
                  onChange={(e) => setCustomPointReason(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 600
                  }}
                />
                <button
                  className="clay-btn clay-btn-accent"
                  onClick={() => {
                    if (selectedPointStudents.length === 0) {
                      triggerToast("Select a Student", "Please select at least one student.");
                      return;
                    }
                    awardPointsToMultiple(selectedPointStudents, customPointAmount, customPointReason || "Custom Award", "custom");
                  }}
                >
                  <Zap size={18} />
                  <span>Award Custom</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Session Feed */}
          <div className="clay-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "4px" }}>⚡ Live Session Activity</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "12px" }}>
              Points awarded during this active classroom session.
            </p>

            {liveSessionLog.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 10px", margin: "auto" }}>
                <Zap size={36} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
                <p>No live points awarded in this session yet.</p>
              </div>
            ) : (
              <div className="activity-feed-list" style={{ flex: 1, maxHeight: "560px" }}>
                {liveSessionLog.map((log) => (
                  <div key={log.id} className="activity-feed-item">
                    <div>
                      <strong style={{ display: "block", fontSize: "1rem" }}>{log.studentName}</strong>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{log.label}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: "Baloo 2", fontWeight: 800, color: "var(--primary)", fontSize: "1.15rem" }}>
                        +{log.points}
                      </span>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 5: QUIZ BUILDER TAB
          ========================================== */}
      {activeView === "quizBuilder" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px" }}>
          {/* Create / Edit Quiz Form */}
          <div className="clay-card">
            <h3 style={{ fontSize: "1.4rem", marginBottom: "14px" }}>
              {editingQuizId ? "✏️ Edit Quiz" : "📝 Create New Multiple-Choice Quiz"}
            </h3>

            <form onSubmit={handleSaveQuiz} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Quiz Title</label>
                <input
                  type="text"
                  placeholder="e.g. Parables of Jesus, The Ten Commandments"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Points per Correct Answer</label>
                <input
                  type="number"
                  value={builderPoints}
                  onChange={(e) => setBuilderPoints(Number(e.target.value))}
                  style={{
                    width: "120px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Questions Builder */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontWeight: 700 }}>Questions ({builderQuestions.length})</label>
                  <button
                    type="button"
                    className="clay-btn clay-btn-secondary clay-btn-sm"
                    onClick={() => {
                      setBuilderQuestions((prev) => [
                        ...prev,
                        { id: `q-${Date.now()}-${prev.length}`, question: "", options: ["", "", "", ""], correctIndex: 0 }
                      ]);
                      playSynthSound("pop");
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Question</span>
                  </button>
                </div>

                {builderQuestions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    style={{
                      background: "var(--card-surface-alt)",
                      border: "2px solid var(--card-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontFamily: "Baloo 2", fontSize: "1.1rem" }}>Question #{qIndex + 1}</strong>
                      {builderQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBuilderQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                          style={{ color: "var(--danger)" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question text..."
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBuilderQuestions((prev) =>
                          prev.map((item, i) => (i === qIndex ? { ...item, question: val } : item))
                        );
                      }}
                      required
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--card-border)",
                        fontWeight: 600
                      }}
                    />

                    {/* Options A, B, C, D */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {["A", "B", "C", "D"].map((letter, optIndex) => (
                        <div
                          key={letter}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: q.correctIndex === optIndex ? "var(--primary-surface)" : "var(--card-bg)",
                            padding: "6px 10px",
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${q.correctIndex === optIndex ? "var(--primary)" : "var(--card-border)"}`
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctIndex === optIndex}
                            onChange={() => {
                              setBuilderQuestions((prev) =>
                                prev.map((item, i) => (i === qIndex ? { ...item, correctIndex: optIndex } : item))
                              );
                            }}
                          />
                          <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{letter}:</span>
                          <input
                            type="text"
                            placeholder={`Option ${letter}`}
                            value={q.options[optIndex] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBuilderQuestions((prev) =>
                                prev.map((item, i) => {
                                  if (i !== qIndex) return item;
                                  const opts = [...item.options];
                                  opts[optIndex] = val;
                                  return { ...item, options: opts };
                                })
                              );
                            }}
                            required
                            style={{
                              border: "none",
                              background: "none",
                              width: "100%",
                              outline: "none",
                              fontSize: "0.9rem"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="clay-btn clay-btn-primary" style={{ flex: 1 }}>
                  <Check size={18} />
                  <span>{editingQuizId ? "Save Changes" : "Save Quiz to Library"}</span>
                </button>
                {editingQuizId && (
                  <button
                    type="button"
                    className="clay-btn clay-btn-secondary"
                    onClick={() => {
                      setEditingQuizId(null);
                      setBuilderTitle("");
                      setBuilderQuestions([{ id: `q-${Date.now()}-0`, question: "", options: ["", "", "", ""], correctIndex: 0 }]);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Saved Quizzes Library */}
          <div className="clay-card">
            <h3 style={{ fontSize: "1.4rem", marginBottom: "14px" }}>📚 Quiz Library ({quizzes.length})</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    background: "var(--card-surface-alt)",
                    border: "2px solid var(--card-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontFamily: "Baloo 2", fontSize: "1.2rem", display: "block" }}>
                        {quiz.title}
                      </strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {quiz.questions.length} questions • {quiz.pointsPerCorrect} pts each
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="clay-btn clay-btn-secondary clay-btn-sm"
                        onClick={() => {
                          setEditingQuizId(quiz.id);
                          setBuilderTitle(quiz.title);
                          setBuilderPoints(quiz.pointsPerCorrect);
                          setBuilderQuestions(quiz.questions);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="clay-btn clay-btn-danger clay-btn-sm"
                        onClick={() => void handleDeleteQuiz(quiz)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    className="clay-btn clay-btn-accent clay-btn-sm"
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setQuizQuestionIndex(0);
                      setQuizStage("question");
                      setQuizAwardedStudents(new Set());
                      setActiveView("runQuiz");
                      playSynthSound("fanfare");
                    }}
                  >
                    <Play size={16} />
                    <span>Launch in Run Quiz Mode</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 6: RUN QUIZ (PROJECTOR MODE)
          ========================================== */}
      {activeView === "runQuiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!activeQuiz ? (
            <div className="clay-card" style={{ textAlign: "center", padding: "40px" }}>
              <BookOpen size={48} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
              <h2>Select a Quiz to Launch</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "18px" }}>
                Choose any pre-built quiz from the library to run live on the classroom projector.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {quizzes.map((q) => (
                  <button
                    key={q.id}
                    className="clay-btn clay-btn-primary"
                    onClick={() => {
                      setActiveQuiz(q);
                      setQuizQuestionIndex(0);
                      setQuizStage("question");
                      setQuizAwardedStudents(new Set());
                      playSynthSound("fanfare");
                    }}
                  >
                    <Play size={16} />
                    <span>{q.title} ({q.questions.length}Q)</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="projector-quiz-stage">
              {/* Top Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.9rem", color: "var(--accent-light)", fontWeight: 700, textTransform: "uppercase" }}>
                    {activeQuiz.title}
                  </span>
                  <h3 style={{ margin: 0, color: "var(--text-inverse)" }}>
                    Question {quizQuestionIndex + 1} of {activeQuiz.questions.length}
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="control-btn"
                    onClick={() => setActiveQuiz(null)}
                  >
                    Change Quiz
                  </button>
                </div>
              </div>

              {/* Current Question */}
              {activeQuiz.questions[quizQuestionIndex] && (
                <>
                  <div className="projector-question-card">
                    <h2>{activeQuiz.questions[quizQuestionIndex].question}</h2>
                  </div>

                  {/* Options Grid */}
                  <div className="projector-options-grid">
                    {activeQuiz.questions[quizQuestionIndex].options.map((opt, idx) => {
                      const isCorrect = idx === activeQuiz.questions[quizQuestionIndex].correctIndex;
                      const showAnswer = quizStage === "reveal" || quizStage === "award";
                      const letter = ["A", "B", "C", "D"][idx] || String(idx + 1);

                      return (
                        <div
                          key={idx}
                          className={`projector-option-card ${showAnswer && isCorrect ? "projector-option-correct" : ""}`}
                        >
                          <div className="projector-option-letter">{letter}</div>
                          <span>{opt}</span>
                          {showAnswer && isCorrect && (
                            <CheckCircle2 size={28} color="var(--success)" style={{ marginLeft: "auto" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage Action Controls */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginTop: "10px", flexWrap: "wrap" }}>
                    {quizStage === "question" && (
                      <button
                        className="clay-btn clay-btn-accent clay-btn-lg"
                        onClick={() => {
                          setQuizStage("options");
                          playSynthSound("pop");
                        }}
                      >
                        Show Options (A, B, C, D)
                      </button>
                    )}

                    {quizStage === "options" && (
                      <button
                        className="clay-btn clay-btn-primary clay-btn-lg"
                        onClick={() => {
                          setQuizStage("reveal");
                          playSynthSound("success");
                        }}
                      >
                        🎉 Reveal Correct Answer
                      </button>
                    )}

                    {quizStage === "reveal" && (
                      <button
                        className="clay-btn clay-btn-accent clay-btn-lg"
                        onClick={() => {
                          setQuizStage("award");
                          playSynthSound("pop");
                        }}
                      >
                        ⚡ Tap Who Answered Correctly
                      </button>
                    )}
                  </div>

                  {/* Award Points Selector */}
                  {quizStage === "award" && (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "var(--radius-lg)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}
                    >
                      <strong style={{ fontSize: "1.15rem", color: "var(--text-inverse)", textAlign: "center" }}>
                        Tap students who got it right to award +{activeQuiz.pointsPerCorrect} points:
                      </strong>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                        {students.map((s) => {
                          const isAwarded = quizAwardedStudents.has(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                const next = new Set(quizAwardedStudents);
                                if (next.has(s.id)) {
                                  next.delete(s.id);
                                } else {
                                  next.add(s.id);
                                  awardPointsToStudent(
                                    s.id,
                                    activeQuiz.pointsPerCorrect,
                                    `Quiz Correct: "${activeQuiz.questions[quizQuestionIndex].question}"`,
                                    "quiz"
                                  );
                                }
                                setQuizAwardedStudents(next);
                              }}
                              style={{
                                padding: "10px",
                                borderRadius: "var(--radius-md)",
                                background: isAwarded ? "var(--success)" : "rgba(255, 255, 255, 0.18)",
                                color: "var(--text-inverse)",
                                border: `2px solid ${isAwarded ? "var(--secondary-light)" : "rgba(255, 255, 255, 0.3)"}`,
                                fontWeight: 800,
                                fontFamily: "Baloo 2",
                                fontSize: "1.05rem"
                              }}
                            >
                              {s.name} {isAwarded ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next / Finish Navigation */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                        <button
                          className="clay-btn clay-btn-secondary"
                          onClick={() => {
                            if (quizQuestionIndex > 0) {
                              setQuizQuestionIndex(quizQuestionIndex - 1);
                              setQuizStage("question");
                              setQuizAwardedStudents(new Set());
                            }
                          }}
                          disabled={quizQuestionIndex === 0}
                        >
                          Previous Question
                        </button>

                        {quizQuestionIndex < activeQuiz.questions.length - 1 ? (
                          <button
                            className="clay-btn clay-btn-primary clay-btn-lg"
                            onClick={() => {
                              setQuizQuestionIndex(quizQuestionIndex + 1);
                              setQuizStage("question");
                              setQuizAwardedStudents(new Set());
                              playSynthSound("sparkles");
                            }}
                          >
                            Next Question →
                          </button>
                        ) : (
                          <button
                            className="clay-btn clay-btn-accent clay-btn-lg"
                            onClick={() => {
                              playSynthSound("fanfare");
                              triggerToast("Quiz Completed!", `Great job everyone on ${activeQuiz.title}!`);
                              setActiveView("leaderboard");
                            }}
                          >
                            Finish Quiz & View Leaderboard 🏆
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          VIEW 7: LEADERBOARD TAB
          ========================================== */}
      {activeView === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top 3 Podium */}
          {rankedStudents.length >= 3 && (
            <div className="clay-card" style={{ background: "linear-gradient(180deg, var(--card-bg) 0%, var(--card-surface-alt) 100%)" }}>
              <h3 style={{ textAlign: "center", fontSize: "1.4rem", marginBottom: "4px" }}>
                🏆 Top Faith Champions
              </h3>

              <div className="podium-container">
                {/* 2nd Place */}
                <div className="podium-step">
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "1.8rem" }}>🥈</div>
                    <strong style={{ fontFamily: "Baloo 2", fontSize: "1.2rem", display: "block" }}>
                      {rankedStudents[1].name}
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {totalPoints(rankedStudents[1]).earned} pts
                    </span>
                  </div>
                  <div className="podium-pillar podium-2">#2</div>
                </div>

                {/* 1st Place */}
                <div className="podium-step">
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "2.4rem", animation: "float 2s infinite ease-in-out" }}>👑</div>
                    <strong style={{ fontFamily: "Baloo 2", fontSize: "1.4rem", color: "var(--accent-dark)", display: "block" }}>
                      {rankedStudents[0].name}
                    </strong>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>
                      {totalPoints(rankedStudents[0]).earned} pts
                    </span>
                  </div>
                  <div className="podium-pillar podium-1">#1</div>
                </div>

                {/* 3rd Place */}
                <div className="podium-step">
                  <div style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "1.8rem" }}>🥉</div>
                    <strong style={{ fontFamily: "Baloo 2", fontSize: "1.2rem", display: "block" }}>
                      {rankedStudents[2].name}
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {totalPoints(rankedStudents[2]).earned} pts
                    </span>
                  </div>
                  <div className="podium-pillar podium-3">#3</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="clay-card">
            <h3 style={{ fontSize: "1.3rem", marginBottom: "14px" }}>📋 Complete Class Standings</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rankedStudents.map((s, rankIndex) => {
                const pts = totalPoints(s);
                const tree = treeLevel(pts.earned);
                return (
                  <div
                    key={s.id}
                    className="activity-feed-item clay-card-interactive"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setIsProfileModalOpen(true);
                      playSynthSound("pop");
                    }}
                    style={{
                      padding: "14px 18px",
                      borderLeft: `5px solid ${
                        rankIndex === 0
                          ? "var(--accent)"
                          : rankIndex === 1
                          ? "#94a3b8"
                          : rankIndex === 2
                          ? "var(--accent-dark)"
                          : "var(--card-border)"
                      }`
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "36px",
                          fontFamily: "Baloo 2",
                          fontSize: "1.3rem",
                          fontWeight: 800,
                          textAlign: "center",
                          color: rankIndex < 3 ? "var(--primary)" : "var(--text-muted)"
                        }}
                      >
                        #{rankIndex + 1}
                      </div>

                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--primary-surface)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "Baloo 2",
                          fontSize: "1.3rem",
                          fontWeight: 800
                        }}
                      >
                        {s.name.slice(0, 1)}
                      </div>

                      <div>
                        <strong style={{ fontFamily: "Baloo 2", fontSize: "1.2rem", display: "block" }}>
                          {s.name}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {s.group} • {tree.name} ({tree.icon})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "Baloo 2", fontWeight: 800, fontSize: "1.4rem", color: "var(--primary)" }}>
                          {pts.earned}
                        </span>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {s.badges?.length || 0} badges
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 8: MANAGE TAB
          ========================================== */}
      {activeView === "manage" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "20px" }}>
          {/* Left: Student Management */}
          <div className="clay-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.3rem" }}>👥 Student Roster Management</h3>
              <button
                className="clay-btn clay-btn-primary clay-btn-sm"
                onClick={() => setShowAddStudentModal(true)}
              >
                <UserPlus size={16} />
                <span>Add Student</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto" }}>
              {students.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--card-surface-alt)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--card-border)"
                  }}
                >
                  <div>
                    <strong style={{ fontFamily: "Baloo 2", fontSize: "1.1rem", display: "block" }}>{s.name}</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {s.group} • {totalPoints(s).earned} pts
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="clay-btn clay-btn-secondary clay-btn-sm"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setIsProfileModalOpen(true);
                        playSynthSound("pop");
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="clay-btn clay-btn-danger clay-btn-sm"
                      onClick={() => {
                        setPendingDeleteStudentId(s.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Data Export / Backup & Synth Tester */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Backup & CSV Export */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>💾 Data Backup & Reports</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "14px" }}>
                Keep your classroom points, student badges, and quizzes safe.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button className="clay-btn clay-btn-primary" onClick={handleExportCSV}>
                  <Download size={16} />
                  <span>Export Student Roster (CSV)</span>
                </button>

                <button className="clay-btn clay-btn-secondary" onClick={handleExportJSON}>
                  <Download size={16} />
                  <span>Download Full JSON Backup</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJSON}
                  accept=".json"
                  style={{ display: "none" }}
                />

                <button
                  className="clay-btn clay-btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>Restore from JSON Backup</span>
                </button>

                <button
                  className="clay-btn clay-btn-danger clay-btn-sm"
                  style={{ marginTop: "10px" }}
                  onClick={() => {
                    if (classId) {
                      triggerToast("Demo reset disabled", "Shared classrooms cannot be replaced with demo data.");
                      return;
                    }
                    if (window.confirm("Reset dataset back to starter demo students and quizzes?")) {
                      setStudents(starterStudents);
                      setQuizzes(starterQuizzes);
                      playSynthSound("splash");
                      triggerToast("Dataset Reset", "Restored starter demo students & quizzes.");
                    }
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Reset to Starter Demo Data</span>
                </button>
              </div>
            </div>

            {/* Audio Synthesis Test Pad */}
            <div className="clay-card">
              <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>🎵 Audio Synthesizer Test</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button className="clay-btn clay-btn-secondary clay-btn-sm" onClick={() => playSynthSound("sparkles")}>
                  ✨ Sparkles
                </button>
                <button className="clay-btn clay-btn-secondary clay-btn-sm" onClick={() => playSynthSound("fanfare")}>
                  🎺 Victory Fanfare
                </button>
                <button className="clay-btn clay-btn-secondary clay-btn-sm" onClick={() => playSynthSound("splash")}>
                  💧 Water Splash
                </button>
                <button className="clay-btn clay-btn-secondary clay-btn-sm" onClick={() => playSynthSound("pop")}>
                  🫧 Bubble Pop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1: STUDENT FULL PROFILE & AQUARIUM
          ========================================== */}
      {isProfileModalOpen && selectedStudent && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-profile-title"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-large"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div className="student-avatar-box">
                  {selectedStudent.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 id="student-profile-title" style={{ margin: 0 }}>
                    {selectedStudent.name}
                  </h2>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {selectedStudent.group} • Joined {formatCalendarDate(selectedStudent.joinedAt)}
                  </span>
                </div>
              </div>

              <button className="modal-close-btn" aria-label="Close modal" onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--card-border)", paddingBottom: "8px", marginBottom: "18px" }}>
              <button
                className={`clay-btn clay-btn-sm ${activeProfileTab === "aquarium" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => {
                  setActiveProfileTab("aquarium");
                  playSynthSound("splash");
                }}
              >
                <Fish size={16} />
                <span>Aquarium</span>
              </button>

              <button
                className={`clay-btn clay-btn-sm ${activeProfileTab === "tree" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => {
                  setActiveProfileTab("tree");
                  playSynthSound("sparkles");
                }}
              >
                <Sprout size={16} />
                <span>Faith Tree</span>
              </button>

              <button
                className={`clay-btn clay-btn-sm ${activeProfileTab === "badges" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => {
                  setActiveProfileTab("badges");
                  playSynthSound("pop");
                }}
              >
                <Award size={16} />
                <span>Badges ({selectedStudent.badges?.length || 0})</span>
              </button>

              <button
                className={`clay-btn clay-btn-sm ${activeProfileTab === "history" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => {
                  setActiveProfileTab("history");
                  playSynthSound("pop");
                }}
              >
                <Activity size={16} />
                <span>Activity Log</span>
              </button>
            </div>

            {/* TAB CONTENT: AQUARIUM */}
            {activeProfileTab === "aquarium" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="aquarium-viewport">
                  {/* Floating Bubbles */}
                  <div className="floating-bubble" style={{ left: "20%", animationDelay: "0s" }} />
                  <div className="floating-bubble" style={{ left: "55%", animationDelay: "1.5s" }} />
                  <div className="floating-bubble" style={{ left: "80%", animationDelay: "2.8s" }} />

                  {/* Swimming Fish items based on student rewards */}
                  {(selectedStudent.rewards || ["small-fish"]).map((rId, i) => {
                    const rDef = rewardCatalog.find((x) => x.id === rId);
                    if (rDef?.type === "fish") {
                      return (
                        <div
                          key={rId + i}
                          className="swimming-fish"
                          style={{
                            top: `${30 + (i * 45) % 150}px`,
                            left: `${15 + (i * 30) % 70}%`,
                            animationDuration: `${5 + (i % 3) * 2}s`
                          }}
                        >
                          <span style={{ fontSize: "2rem" }}>
                            {rId === "golden-fish" ? "🐠" : rId === "rare-fish" ? "🐡" : "🐟"}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* Aquarium Sand & Decor */}
                  <div className="aquarium-sand">
                    <div style={{ display: "flex", justifyContent: "space-around", padding: "4px 20px" }}>
                      {(selectedStudent.rewards || []).map((rId, i) => {
                        const rDef = rewardCatalog.find((x) => x.id === rId);
                        if (rDef?.type === "decor") {
                          return (
                            <span key={rId + i} style={{ fontSize: "1.6rem" }}>
                              {rId === "castle" ? "🏰" : rId === "coral" ? "🪸" : rId === "water-plant" ? "🌿" : "🪨"}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-surface-alt)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    Collected Aquarium Items: {selectedStudent.rewards?.length || 0}
                  </span>
                  <strong style={{ fontFamily: "Baloo 2", color: "var(--primary)" }}>
                    {totalPoints(selectedStudent).available} pts available to spend
                  </strong>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 10px" }}>Aquarium Reward Shop</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
                    {rewardCatalog.map((reward) => {
                      const owned = selectedStudent.rewards.includes(reward.id);
                      const affordable = totalPoints(selectedStudent).available >= reward.cost;
                      return (
                        <button
                          key={reward.id}
                          type="button"
                          className="clay-btn clay-btn-secondary clay-btn-sm"
                          disabled={owned || !affordable}
                          onClick={() => void handleRedeemReward(selectedStudent, reward)}
                          style={{ justifyContent: "space-between", opacity: owned || !affordable ? 0.55 : 1 }}
                        >
                          <span>{reward.name}</span>
                          <strong>{owned ? "Owned" : `${reward.cost} pts`}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAITH TREE */}
            {activeProfileTab === "tree" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {(() => {
                  const pts = totalPoints(selectedStudent).earned;
                  const tree = treeLevel(pts);
                  return (
                    <div className="tree-visualizer">
                      <div style={{ fontSize: "5rem", marginBottom: "8px" }}>{tree.icon}</div>
                      <h3 style={{ fontSize: "1.8rem", color: "var(--primary-dark)", margin: "0 0 4px" }}>
                        {tree.name} (Level {tree.level})
                      </h3>
                      <p style={{ color: "var(--text-muted)", margin: "0 0 16px", fontWeight: 600 }}>
                        Current Stage: {tree.stage}
                      </p>

                      <div style={{ width: "100%", maxWidth: "420px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "4px" }}>
                          <strong>Growth Progress</strong>
                          <span>{pts} / {tree.nextAt} Faith Points</span>
                        </div>
                        <div
                          style={{
                            height: "14px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(16, 185, 129, 0.2)",
                            overflow: "hidden",
                            border: "1px solid var(--success)"
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${tree.percent}%`,
                              background: "linear-gradient(90deg, var(--success), var(--primary))",
                              borderRadius: "var(--radius-full)"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT: BADGES */}
            {activeProfileTab === "badges" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
                {badgeDefinitions.map((badge) => {
                  const isUnlocked = selectedStudent.badges?.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${isUnlocked ? "var(--primary)" : "var(--card-border)"}`,
                        background: isUnlocked ? "var(--primary-surface)" : "var(--card-surface-alt)",
                        opacity: isUnlocked ? 1 : 0.6,
                        display: "flex",
                        gap: "10px",
                        alignItems: "center"
                      }}
                    >
                      <span style={{ fontSize: "1.8rem" }}>{badge.icon}</span>
                      <div>
                        <strong style={{ display: "block", fontSize: "0.95rem", fontFamily: "Baloo 2" }}>
                          {badge.name}
                        </strong>
                        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "block" }}>
                          {badge.condition}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: isUnlocked ? "var(--primary)" : "var(--text-muted)"
                          }}
                        >
                          {isUnlocked ? "✓ UNLOCKED" : "🔒 LOCKED"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeProfileTab === "history" && (
              <div className="activity-feed-list" style={{ maxHeight: "420px" }}>
                {(selectedStudent.activities || []).map((act) => (
                  <div key={act.id} className="activity-feed-item">
                    <div>
                      <strong style={{ display: "block", fontSize: "0.95rem" }}>{act.label}</strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {formatCalendarDate(act.date)}
                      </span>
                    </div>
                    <span style={{ fontFamily: "Baloo 2", fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>
                      +{act.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: QUICK ATTENDANCE POPUP
          ========================================== */}
      {showQuickAttendance && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-attendance-title"
          onClick={() => setShowQuickAttendance(false)}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="quick-attendance-title">✅ Quick Attendance Check</h2>
              <button className="modal-close-btn" aria-label="Close modal" onClick={() => setShowQuickAttendance(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button
                className={`clay-btn clay-btn-sm ${attendanceSessionType === "sundaySchool" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => setAttendanceSessionType("sundaySchool")}
              >
                Sunday School (+10 pts)
              </button>
              <button
                className={`clay-btn clay-btn-sm ${attendanceSessionType === "outreach" ? "clay-btn-primary" : "clay-btn-secondary"}`}
                onClick={() => setAttendanceSessionType("outreach")}
              >
                Outreach (+15 pts)
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px", maxHeight: "280px", overflowY: "auto", marginBottom: "16px" }}>
              {students.map((s) => {
                const isSel = presentStudentIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const next = new Set(presentStudentIds);
                      if (next.has(s.id)) next.delete(s.id);
                      else next.add(s.id);
                      setPresentStudentIds(next);
                      playSynthSound("pop");
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${isSel ? "var(--primary)" : "var(--card-border)"}`,
                      background: isSel ? "var(--primary-surface)" : "var(--card-surface-alt)",
                      fontWeight: 700,
                      fontFamily: "Baloo 2"
                    }}
                  >
                    {s.name} {isSel ? "✓" : ""}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="clay-btn clay-btn-accent"
                style={{ flex: 1 }}
                onClick={() => {
                  const ids = Array.from(presentStudentIds);
                  if (ids.length === 0) {
                    triggerToast("No Selection", "Please tap at least one student.");
                    return;
                  }
                  const pts = attendanceSessionType === "sundaySchool" ? 10 : 15;
                  const label = attendanceSessionType === "sundaySchool" ? "Sunday School Attendance" : "Outreach Attendance";
                  const kind = attendanceSessionType === "sundaySchool" ? "attendance" : "outreach";
                  awardPointsToMultiple(ids, pts, label, kind);
                  setPresentStudentIds(new Set());
                  setShowQuickAttendance(false);
                }}
              >
                Submit Attendance ({presentStudentIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: QUICK AWARD POPUP
          ========================================== */}
      {showQuickAward && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-award-title"
          onClick={() => setShowQuickAward(false)}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="quick-award-title">⚡ Quick Point Award</h2>
              <button className="modal-close-btn" aria-label="Close modal" onClick={() => setShowQuickAward(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Select Student</label>
                <select
                  value={quickAwardStudentId}
                  onChange={(e) => setQuickAwardStudentId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 700
                  }}
                >
                  <option value="">-- Choose a Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.group}) - {totalPoints(s).earned} pts
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {[5, 10, 15, 20].map((amt) => (
                  <button
                    key={amt}
                    className={`clay-btn clay-btn-sm ${quickAwardAmount === amt ? "clay-btn-primary" : "clay-btn-secondary"}`}
                    onClick={() => setQuickAwardAmount(amt)}
                  >
                    +{amt} pts
                  </button>
                ))}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Award Reason</label>
                <input
                  type="text"
                  value={quickAwardLabel}
                  onChange={(e) => setQuickAwardLabel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 600
                  }}
                />
              </div>

              <button
                className="clay-btn clay-btn-accent"
                onClick={() => {
                  if (!quickAwardStudentId) {
                    triggerToast("Select Student", "Please pick a student to award.");
                    return;
                  }
                  awardPointsToStudent(quickAwardStudentId, quickAwardAmount, quickAwardLabel || "Quick Award");
                  setShowQuickAward(false);
                }}
              >
                Award +{quickAwardAmount} Points Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 4: ADD STUDENT MODAL
          ========================================== */}
      {showAddStudentModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-title"
          onClick={() => setShowAddStudentModal(false)}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="add-student-title">➕ Enroll New Student</h2>
              <button className="modal-close-btn" aria-label="Close modal" onClick={() => setShowAddStudentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah, Caleb, Daniel"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "6px" }}>Group / Class</label>
                <select
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--card-border)",
                    fontWeight: 700
                  }}
                >
                  <option value="Sunday School">Sunday School</option>
                  <option value="Outreach Kids">Outreach Kids</option>
                  <option value="Youth Bible Class">Youth Bible Class</option>
                </select>
              </div>

              <button type="submit" className="clay-btn clay-btn-primary">
                Enroll Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 5: DELETE CONFIRMATION MODAL
          ========================================== */}
      {pendingDeleteStudentId && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={() => setPendingDeleteStudentId(null)}
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="delete-confirm-title" style={{ color: "var(--danger)" }}>⚠️ Confirm Removal</h2>
              <button className="modal-close-btn" aria-label="Close modal" onClick={() => setPendingDeleteStudentId(null)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
              Are you sure you want to delete this student and their entire points history?
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="clay-btn clay-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setPendingDeleteStudentId(null)}
              >
                Cancel
              </button>
              <button
                className="clay-btn clay-btn-danger"
                style={{ flex: 1 }}
                onClick={() => void handleDeleteStudent(pendingDeleteStudentId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FLOATING CELEBRATION TOAST
          ========================================== */}
      {flashMessage && (
        <div className="floating-toast">
          <Sparkles size={22} color="var(--primary)" />
          <div>
            <strong>{flashMessage.title}</strong>
            {flashMessage.desc && <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>{flashMessage.desc}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
