# FaithQuest Multi-Teacher System Implementation Plan (Supabase Native Auth & RLS)

**Project:** Convert FaithQuest from a single-teacher app into a secure multi-tenant system with role-based access  
**Architecture:** Next.js 16 + React 19 + Native Supabase Auth (`@supabase/ssr`) + PostgreSQL RLS  
**Cost:** $0 (100% Free Tier on Supabase, Google Cloud OAuth, and Vercel)  
**Status:** Ready to Implement  

---

## 1. System Overview & Architecture

### Key Goals
- **Multi-Teacher Isolation:** Each teacher manages their own classes, students, points, attendance, and quizzes independently.
- **Church & Admin Hierarchy:** Admins can oversee all classes, teachers, and church-wide metrics.
- **Native Hybrid Auth:** Google OAuth + Email/Password sign-in powered by Supabase Auth with zero external auth dependencies.
- **Bulletproof Row-Level Security (RLS):** Strict PostgreSQL policies at database level ensuring teachers only access their own classes.
- **Classroom Projector Experience:** Preserves the live projector SPA flow at `/teacher/[classId]`.

```
FaithQuest Multi-Tenant Architecture
├── /auth/signin             → Google OAuth + Email/Password login
├── /auth/signup             → Teacher registration
├── /auth/callback           → Supabase OAuth code exchange
├── /dashboard               → Role-based router & class picker
├── /admin                   → Church & teacher management (Admin only)
├── /teacher/[classId]       → FaithQuest Classroom SPA (Scoped by classId)
└── middleware.ts            → Session validation & route guard
```

---

## 2. Complete Phase 1: Supabase Database Schema & RLS

Execute the following SQL script in your **Supabase SQL Editor** (`Database -> SQL Editor -> New query`):

```sql
-- ====================================================================
-- FAITHQUEST MULTI-TENANCY SCHEMA & RLS POLICIES
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Churches Table (Organization Level)
CREATE TABLE IF NOT EXISTS public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Teacher Classes Table
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
  class_name VARCHAR(255) NOT NULL,
  join_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  group_name VARCHAR(100) DEFAULT 'General',
  avatar VARCHAR(100) DEFAULT 'seed',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- 7. Activities (Attendance, Live Points, Verses, Badges)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL CHECK (kind IN ('attendance', 'outreach', 'verse', 'quiz', 'discussion', 'bible', 'event', 'helping', 'custom')),
  points INT NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  points_per_correct INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Badges Catalog (Class-specific or global)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  description TEXT,
  condition JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Rewards Catalog (Fish & Decor items)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cost INT NOT NULL DEFAULT 10,
  type VARCHAR(50) NOT NULL CHECK (type IN ('fish', 'decor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Student Rewards Purchased (Aquarium inventory)
CREATE TABLE IF NOT EXISTS public.student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, reward_id)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON public.teacher_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_activities_student_id ON public.activities(student_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(date);
CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON public.quizzes(class_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_rewards ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Users see their own or admins see all
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teacher Classes: Teachers manage their own classes
CREATE POLICY "classes_all" ON public.teacher_classes
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Students: Accessible by the class owner teacher or admin
CREATE POLICY "students_all" ON public.students
  FOR ALL USING (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  );

-- Activities: Accessible by the student's teacher
CREATE POLICY "activities_all" ON public.activities
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Quizzes: Managed by class teacher
CREATE POLICY "quizzes_all" ON public.quizzes
  FOR ALL USING (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  );

-- Rewards & Badges: Managed by class teacher
CREATE POLICY "rewards_all" ON public.rewards
  FOR ALL USING (
    class_id IS NULL OR class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) OR public.is_admin()
  );

CREATE POLICY "student_rewards_all" ON public.student_rewards
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    ) OR public.is_admin()
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    ) OR public.is_admin()
  );
```

---

## 3. Phase 2: Supabase SSR Client Utilities

### 3.1 Dependencies
```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 3.2 Client Setup Files
1. `app/lib/supabase/client.ts` — Browser Client (`createBrowserClient`)
2. `app/lib/supabase/server.ts` — Server Client (`createServerClient` with cookies)
3. `app/lib/supabase/middleware.ts` — Session update helper for Next.js middleware

---

## 4. Phase 3: Auth Pages & Route Middleware

### 4.1 Route Map
- `/auth/signin` — Google Sign-In button + Email/Password form
- `/auth/signup` — Teacher registration form
- `/auth/callback` — Supabase OAuth code exchange route handler
- `/dashboard` — Teacher dashboard listing active classes with a "Create Class" modal
- `/teacher/[classId]` — FaithQuest Classroom SPA running scoped to the selected class
- `/admin` — Church Admin panel to view all teachers, classes, and statistics

### 4.2 Route Middleware (`middleware.ts`)
- Automatically refreshes active Supabase session cookies
- Redirects unauthenticated users attempting to access `/dashboard`, `/admin`, or `/teacher/*` to `/auth/signin`
- Redirects authenticated users from `/auth/signin` directly to `/dashboard`

---

## 5. Phase 4: Classroom SPA Multi-Tenant Data Layer

Refactor `app/lib/persistence.ts` and `app/page.tsx`:
- Pass `classId` to all fetch/mutation routines
- Load students, activities, badges, quizzes, and aquarium rewards belonging to `classId`
- Subscribe to Supabase Realtime changes filtered by `class_id=eq.${classId}`
