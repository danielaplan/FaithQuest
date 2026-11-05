import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PersistedAppState = {
  students: unknown[];
  quizzes: unknown[];
  theme: "emerald" | "gold" | "aqua";
  sound: boolean;
};

const DEFAULT_STORAGE_KEY = "faithquest-state-v2";
let supabaseClient: SupabaseClient | null | undefined;

function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getSupabaseClient() {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (supabaseClient === undefined) {
    supabaseClient = createBrowserClient(url, key);
  }

  return supabaseClient;
}

function getStorageKey(classId?: string) {
  return classId ? `faithquest-state-class-${classId}` : DEFAULT_STORAGE_KEY;
}

function normalizeState(value: unknown): PersistedAppState | null {
  if (!value || typeof value !== "object") return null;

  const parsed = value as Record<string, unknown>;
  return {
    students: Array.isArray(parsed.students) ? parsed.students : [],
    quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
    theme: parsed.theme === "gold" || parsed.theme === "aqua" ? parsed.theme : "emerald",
    sound: typeof parsed.sound === "boolean" ? parsed.sound : true,
  };
}

function readLocalState(classId?: string): PersistedAppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(classId));
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to read local persistence state", error);
    return null;
  }
}

function writeLocalState(state: PersistedAppState, classId?: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getStorageKey(classId), JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to write local persistence state", error);
  }
}

export async function loadPersistedState(classId?: string): Promise<PersistedAppState | null> {
  if (typeof window === "undefined") return null;

  const client = getSupabaseClient();
  if (client) {
    try {
      if (classId) {
        // Multi-tenant class state: read from teacher_classes state or class-scoped records
        const { data: clsData, error: clsError } = await client
          .from("teacher_classes")
          .select("id, class_name")
          .eq("id", classId)
          .maybeSingle();

        if (clsError) throw clsError;
        if (clsData) {
          // Check for class students and quizzes in relational tables
          const { data: dbStudents, error: studentsError } = await client
            .from("students")
            .select("*, activities(*), student_rewards(rewards(code)), student_badges(badges(code))")
            .eq("class_id", classId)
            .is("archived_at", null)
            .order("name");

          const { data: dbQuizzes, error: quizzesError } = await client
            .from("quizzes")
            .select("*")
            .eq("class_id", classId)
            .order("created_at", { ascending: false });

          if (studentsError) throw studentsError;
          if (quizzesError) throw quizzesError;

          const formattedStudents = (dbStudents || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              group: s.group_name || "General",
              joinedAt: s.joined_at ? s.joined_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
              activities: (s.activities || []).sort((a: any, b: any) =>
                String(b.created_at || b.date).localeCompare(String(a.created_at || a.date))
              ).map((a: any) => ({
                id: a.id,
                date: a.date,
                kind: a.kind,
                label: a.label,
                points: a.points,
              })),
              rewards: (s.student_rewards || [])
                .map((r: any) => r.rewards?.code)
                .filter(Boolean),
              badges: (s.student_badges || [])
                .map((b: any) => b.badges?.code)
                .filter(Boolean),
            }));

          const formattedQuizzes = (dbQuizzes || []).map((q: any) => ({
              id: q.id,
              title: q.title,
              pointsPerCorrect: q.points_per_correct || 10,
              createdAt: q.created_at,
              questions: q.questions || [],
            }));

          const local = readLocalState(classId);
          return {
            students: formattedStudents,
            quizzes: formattedQuizzes,
            theme: local?.theme || "emerald",
            sound: local?.sound ?? true,
          };
        }
      } else {
        // Fallback / legacy state
        const { data, error } = await client
          .from("faithquest_state")
          .select("content")
          .eq("id", "main")
          .maybeSingle();

        if (!error && data?.content) {
          const normalized = normalizeState(data.content);
          if (normalized) return normalized;
        }
      }
    } catch (error) {
      console.warn("Error reading state from Supabase, falling back to localStorage", error);
    }
  }

  return classId && client ? null : readLocalState(classId);
}

export async function savePersistedState(state: PersistedAppState, classId?: string): Promise<void> {
  if (typeof window === "undefined") return;

  const client = getSupabaseClient();
  writeLocalState(client && classId ? { ...state, students: [], quizzes: [] } : state, classId);

  if (client && !classId) {
    const { error } = await client.from("faithquest_state").upsert(
      {
        id: "main",
        content: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }
}

export async function createPersistedStudent(
  classId: string,
  student: { id: string; name: string; group: string }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(student.id)) throw new Error("Student has an invalid ID");

  const { error } = await client.from("students").insert({
    id: student.id,
    class_id: classId,
    name: student.name,
    group_name: student.group || "General",
  });
  if (error) throw error;
}

export async function recordPersistedActivity(
  studentId: string,
  activity: { id: string; kind: string; points: number; date: string; label: string }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(studentId) || !isUuid(activity.id)) throw new Error("Activity has an invalid ID");

  const { error } = await client.rpc("record_student_activity", {
    p_activity_id: activity.id,
    p_student_id: studentId,
    p_kind: activity.kind,
    p_points: activity.points,
    p_date: activity.date,
    p_label: activity.label,
  });
  if (error) throw error;
}

export async function syncPersistedBadges(studentId: string, badgeCodes: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  const { error } = await client.rpc("sync_student_badges", {
    p_student_id: studentId,
    p_badge_codes: badgeCodes,
  });
  if (error) throw error;
}

export async function upsertPersistedQuiz(
  classId: string,
  quiz: { id: string; title: string; questions: unknown[]; pointsPerCorrect: number }
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(quiz.id)) throw new Error("Quiz has an invalid ID");

  const { error } = await client.from("quizzes").upsert(
    {
      id: quiz.id,
      class_id: classId,
      title: quiz.title,
      questions: quiz.questions,
      points_per_correct: quiz.pointsPerCorrect,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function archivePersistedStudent(studentId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(studentId)) throw new Error("Student has an invalid ID");

  const { error } = await client
    .from("students")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", studentId);
  if (error) throw error;
}

export async function deletePersistedQuiz(quizId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(quizId)) throw new Error("Quiz has an invalid ID");

  const { error } = await client.from("quizzes").delete().eq("id", quizId);
  if (error) throw error;
}

export async function redeemPersistedReward(studentId: string, rewardCode: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");
  if (!isUuid(studentId)) throw new Error("Student has an invalid ID");

  const { error } = await client.rpc("redeem_student_reward", {
    p_student_id: studentId,
    p_reward_code: rewardCode,
  });
  if (error) throw error;
}

export function subscribeToStateChanges(
  onChange: (state: PersistedAppState) => void,
  classId?: string
) {
  if (typeof window === "undefined") return undefined;

  const client = getSupabaseClient();
  if (!client) return undefined;

  const channelName = classId ? `faithquest-class-${classId}` : "faithquest-state-changes";
  let channel = client.channel(channelName);
  const subscriptions = classId
    ? [{ table: "class_sync_events", filter: `class_id=eq.${classId}` }]
    : [{ table: "faithquest_state", filter: undefined }];

  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  for (const subscription of subscriptions) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: subscription.table,
        filter: subscription.filter,
      },
      () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          void loadPersistedState(classId).then((data) => {
            if (data) onChange(data);
          });
        }, 750);
      }
    );
  }

  channel.subscribe();

  return () => {
    if (reloadTimer) clearTimeout(reloadTimer);
    void client.removeChannel(channel);
  };
}
