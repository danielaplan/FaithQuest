import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("new profiles are always teachers", () => {
  const migration = read("supabase/migrations/04_multi_user_security.sql");
  assert.match(migration, /NEW\.email,[\s\S]*'teacher'/);
  assert.doesNotMatch(migration, /raw_user_meta_data->>'role'/);

  const signup = read("app/auth/signup/page.tsx");
  assert.doesNotMatch(signup, /role:\s*["']teacher["']/);
});

test("role changes and ownership transfers use protected functions", () => {
  const migration = read("supabase/migrations/04_multi_user_security.sql");
  assert.match(migration, /DROP POLICY IF EXISTS "profiles_update"/);
  assert.match(migration, /FUNCTION public\.set_user_role/);
  assert.match(migration, /The final administrator cannot be demoted/);
  assert.match(migration, /FUNCTION public\.transfer_user_ownership/);
  assert.match(migration, /CREATE POLICY "students_update"/);
  assert.match(migration, /CREATE POLICY "classes_update"/);

  const adminPage = read("app/admin/teachers/page.tsx");
  assert.match(adminPage, /\.rpc\("set_user_role"/);
  assert.doesNotMatch(adminPage, /\.update\(\{\s*role:/);
});

test("owner foreign keys no longer cascade", () => {
  const migration = read("supabase/migrations/04_multi_user_security.sql");
  assert.match(migration, /churches_admin_id_fkey[\s\S]*ON DELETE RESTRICT/);
  assert.match(migration, /teacher_classes_user_id_fkey[\s\S]*ON DELETE RESTRICT/);
});

test("real empty classes do not load demo students", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const initialStudents = classId \? \[\] : starterStudents/);

  const persistence = read("app/lib/persistence.ts");
  assert.doesNotMatch(persistence, /dbStudents && dbStudents\.length > 0/);
});

test("class codes and badge awards are server controlled", () => {
  const migration04 = read("supabase/migrations/04_multi_user_security.sql");
  const migration05 = read("supabase/migrations/05_multi_user_classroom.sql");
  const dashboard = read("app/dashboard/page.tsx");

  assert.match(migration04, /FUNCTION public\.create_teacher_class/);
  assert.match(dashboard, /\.rpc\("create_teacher_class"/);
  assert.match(migration04, /CREATE TABLE IF NOT EXISTS public\.student_badges/);
  assert.match(migration05, /FUNCTION public\.sync_student_badges/);
  assert.match(migration05, /FUNCTION public\.redeem_student_reward/);
});

test("classroom mutations use explicit server commands", () => {
  const migration = read("supabase/migrations/07_classroom_commands.sql");
  const persistence = read("app/lib/persistence.ts");

  assert.match(migration, /FUNCTION public\.record_student_activity/);
  assert.match(migration, /EXCEPTION WHEN unique_violation/);
  assert.match(persistence, /\.rpc\("record_student_activity"/);
  assert.match(persistence, /createPersistedStudent/);
  assert.match(persistence, /upsertPersistedQuiz/);
});

test("admin summaries are aggregated in PostgreSQL", () => {
  const migration = read("supabase/migrations/06_admin_analytics.sql");
  const dashboard = read("app/admin/page.tsx");
  const points = read("app/admin/analytics/points/page.tsx");

  assert.match(migration, /FUNCTION public\.admin_dashboard_stats/);
  assert.match(migration, /FUNCTION public\.admin_points_analytics/);
  assert.match(dashboard, /\.rpc\("admin_dashboard_stats"/);
  assert.match(points, /\.rpc\("admin_points_analytics"/);
});

test("unauthorized class routes do not render cached classroom data", () => {
  const route = read("app/teacher/[classId]/page.tsx");
  const persistence = read("app/lib/persistence.ts");

  assert.match(route, /Class access denied/);
  assert.match(route, /setAuthorized\(false\)/);
  assert.match(persistence, /return classId && client \? null : readLocalState/);
});

test("realtime invalidation is scoped to one class", () => {
  const migration = read("supabase/migrations/08_class_scoped_realtime.sql");
  const persistence = read("app/lib/persistence.ts");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.class_sync_events/);
  assert.match(migration, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.class_sync_events/);
  assert.match(persistence, /class_id=eq\.\$\{classId\}/);
  assert.doesNotMatch(persistence, /\["students", "activities", "quizzes"/);
});
