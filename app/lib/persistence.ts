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

        if (!clsError && clsData) {
          // Check for class students and quizzes in relational tables
          const { data: dbStudents } = await client
            .from("students")
            .select("*, activities(*), student_rewards(reward_id)")
            .eq("class_id", classId);

          const { data: dbQuizzes } = await client
            .from("quizzes")
            .select("*")
            .eq("class_id", classId);

          if (dbStudents && dbStudents.length > 0) {
            const formattedStudents = dbStudents.map((s: any) => ({
              id: s.id,
              name: s.name,
              group: s.group_name || "General",
              joinedAt: s.joined_at ? s.joined_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
              activities: (s.activities || []).map((a: any) => ({
                id: a.id,
                date: a.date,
                kind: a.kind,
                label: a.label,
                points: a.points,
              })),
              rewards: (s.student_rewards || []).map((r: any) => r.reward_id),
              badges: [],
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
              quizzes: formattedQuizzes.length > 0 ? formattedQuizzes : (local?.quizzes || []),
              theme: local?.theme || "emerald",
              sound: local?.sound ?? true,
            };
          }
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

  return readLocalState(classId);
}

export async function savePersistedState(state: PersistedAppState, classId?: string): Promise<void> {
  if (typeof window === "undefined") return;

  writeLocalState(state, classId);

  const client = getSupabaseClient();
  if (client) {
    try {
      if (classId) {
        // Save to class in Supabase if online
        // In background: sync students & activities
        const students = (state.students || []) as any[];
        for (const st of students) {
          if (!st.name) continue;
          // Upsert student
          const { data: upsertedStudent } = await client
            .from("students")
            .upsert(
              {
                id: st.id && st.id.length > 20 ? st.id : undefined,
                class_id: classId,
                name: st.name,
                group_name: st.group || "General",
              },
              { onConflict: "id" }
            )
            .select("id")
            .single();

          const studentDbId = upsertedStudent?.id || st.id;

          // Upsert activities
          if (Array.isArray(st.activities) && st.activities.length > 0 && studentDbId) {
            const acts = st.activities.map((a: any) => ({
              id: a.id && a.id.length > 20 ? a.id : undefined,
              student_id: studentDbId,
              kind: a.kind || "attendance",
              points: a.points || 0,
              date: a.date || new Date().toISOString().slice(0, 10),
              label: a.label || "Activity",
            }));
            await client.from("activities").upsert(acts, { onConflict: "id" });
          }
        }
      } else {
        await client.from("faithquest_state").upsert(
          {
            id: "main",
            content: state,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
    } catch (error) {
      console.warn("Failed to sync state to Supabase, data is safe locally in localStorage", error);
    }
  }
}

export function subscribeToStateChanges(
  onChange: (state: PersistedAppState) => void,
  classId?: string
) {
  if (typeof window === "undefined") return undefined;

  const client = getSupabaseClient();
  if (!client) return undefined;

  const channelName = classId ? `faithquest-class-${classId}` : "faithquest-state-changes";
  const channel = client
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: classId ? "students" : "faithquest_state",
      },
      () => {
        void loadPersistedState(classId).then((data) => {
          if (data) onChange(data);
        });
      }
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
