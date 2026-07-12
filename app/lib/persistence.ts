import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PersistedAppState = {
  students: unknown[];
  quizzes: unknown[];
  theme: "emerald" | "gold" | "aqua";
  sound: boolean;
};

const STORAGE_KEY = "faithquest-state-v2";
let supabaseClient: SupabaseClient | null | undefined;

function getSupabaseClient() {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (supabaseClient === undefined) {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseClient;
}

function normalizeState(value: unknown): PersistedAppState | null {
  if (!value || typeof value !== "object") return null;

  const parsed = value as Record<string, unknown>;
  return {
    students: Array.isArray(parsed.students) ? parsed.students : [],
    quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
    theme: parsed.theme === "gold" || parsed.theme === "aqua" ? parsed.theme : "emerald",
    sound: typeof parsed.sound === "boolean" ? parsed.sound : true
  };
}

function readLocalState(): PersistedAppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to read local persistence state", error);
    return null;
  }
}

function readLegacyLocalState(): PersistedAppState | null {
  if (typeof window === "undefined") return null;

  try {
    const studentsRaw = window.localStorage.getItem("faithquest-students");
    const quizzesRaw = window.localStorage.getItem("faithquest-quizzes");
    const themeRaw = window.localStorage.getItem("faithquest-theme");
    const soundRaw = window.localStorage.getItem("faithquest-sound");

    const students = studentsRaw ? JSON.parse(studentsRaw) : [];
    const quizzes = quizzesRaw ? JSON.parse(quizzesRaw) : [];
    const theme = themeRaw === "gold" || themeRaw === "aqua" ? themeRaw : "emerald";
    const sound = soundRaw === "true";

    return {
      students,
      quizzes,
      theme,
      sound
    };
  } catch (error) {
    console.warn("Failed to read legacy local persistence state", error);
    return null;
  }
}

export async function loadPersistedState(): Promise<PersistedAppState | null> {
  if (typeof window === "undefined") return null;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from("faithquest_state")
        .select("content")
        .eq("id", "main")
        .maybeSingle();

      if (!error && data?.content) {
        const normalized = normalizeState(data.content);
        if (normalized) return normalized;
      }
    } catch (error) {
      console.warn("Supabase load failed, falling back to local storage", error);
    }
  }

  return readLocalState() ?? readLegacyLocalState();
}

export async function savePersistedState(state: PersistedAppState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from("faithquest_state").upsert(
      {
        id: "main",
        content: state
      },
      { onConflict: "id" }
    );
  } catch (error) {
    console.warn("Supabase save failed; local storage remains available", error);
  }
}
