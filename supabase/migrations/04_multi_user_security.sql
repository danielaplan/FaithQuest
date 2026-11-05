-- ====================================================================
-- MIGRATION 04: Multi-user security and ownership hardening
-- Apply after 01, 02, and 03.
-- ====================================================================

-- Profile creation must never trust user-controlled authority metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'teacher'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Keep the authorization helper deterministic and immune to search-path changes.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Browser clients may read profiles permitted by RLS, but role changes go through RPC.
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

-- Safe personal profile edits cannot change role, email, or identity.
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_name TEXT,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    name = NULLIF(BTRIM(p_name), ''),
    avatar_url = p_avatar_url,
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN v_profile;
END;
$$;

-- Only an existing admin may change roles. The final admin is protected.
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_role TEXT;
  v_profile public.profiles;
  v_admin_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_role NOT IN ('admin', 'teacher') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT role INTO v_old_role
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_old_role = 'admin' AND p_role = 'teacher' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'The final administrator cannot be demoted';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'profile.role_changed',
    'profile',
    p_user_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_role)
  );

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;

-- Preserve organizations and classes when an identity is removed.
ALTER TABLE public.churches
  DROP CONSTRAINT IF EXISTS churches_admin_id_fkey;
ALTER TABLE public.churches
  ADD CONSTRAINT churches_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.teacher_classes
  DROP CONSTRAINT IF EXISTS teacher_classes_user_id_fkey;
ALTER TABLE public.teacher_classes
  ADD CONSTRAINT teacher_classes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Audit history remains after an actor is removed.
ALTER TABLE public.audit_logs ALTER COLUMN actor_id DROP NOT NULL;

-- Transfer every owned record before disabling or deleting an account.
CREATE OR REPLACE FUNCTION public.transfer_user_ownership(
  p_from_user_id UUID,
  p_to_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_churches INTEGER;
  v_classes INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Source and destination users must differ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_to_user_id) THEN
    RAISE EXCEPTION 'Destination profile not found';
  END IF;

  UPDATE public.churches
  SET admin_id = p_to_user_id, updated_at = NOW()
  WHERE admin_id = p_from_user_id;
  GET DIAGNOSTICS v_churches = ROW_COUNT;

  UPDATE public.teacher_classes
  SET user_id = p_to_user_id, updated_at = NOW()
  WHERE user_id = p_from_user_id;
  GET DIAGNOSTICS v_classes = ROW_COUNT;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'profile.ownership_transferred',
    'profile',
    p_from_user_id,
    jsonb_build_object('owner_id', p_from_user_id),
    jsonb_build_object(
      'owner_id', p_to_user_id,
      'churches', v_churches,
      'classes', v_classes
    )
  );

  RETURN jsonb_build_object('churches', v_churches, 'classes', v_classes);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_user_ownership(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_user_ownership(UUID, UUID) TO authenticated;

-- Split soft-delete policies so owners may archive records without hard-deleting them.
DROP POLICY IF EXISTS "classes_all" ON public.teacher_classes;
DROP POLICY IF EXISTS "classes_select" ON public.teacher_classes;
DROP POLICY IF EXISTS "classes_insert" ON public.teacher_classes;
DROP POLICY IF EXISTS "classes_update" ON public.teacher_classes;
DROP POLICY IF EXISTS "classes_delete" ON public.teacher_classes;

CREATE POLICY "classes_select" ON public.teacher_classes
  FOR SELECT USING (
    deleted_at IS NULL AND (user_id = auth.uid() OR public.is_admin())
  );
CREATE POLICY "classes_insert" ON public.teacher_classes
  FOR INSERT WITH CHECK (
    deleted_at IS NULL AND (user_id = auth.uid() OR public.is_admin())
  );
CREATE POLICY "classes_update" ON public.teacher_classes
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "classes_delete" ON public.teacher_classes
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "students_all" ON public.students;
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select" ON public.students
  FOR SELECT USING (
    (archived_at IS NULL AND class_id IN (
      SELECT id FROM public.teacher_classes
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )) OR public.is_admin()
  );
CREATE POLICY "students_insert" ON public.students
  FOR INSERT WITH CHECK (
    (archived_at IS NULL AND class_id IN (
      SELECT id FROM public.teacher_classes
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )) OR public.is_admin()
  );
CREATE POLICY "students_update" ON public.students
  FOR UPDATE
  USING (
    class_id IN (
      SELECT id FROM public.teacher_classes
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) OR public.is_admin()
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.teacher_classes
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) OR public.is_admin()
  );
CREATE POLICY "students_delete" ON public.students
  FOR DELETE USING (public.is_admin());

-- Relational badge awards replace browser-only student.badges arrays.
CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON public.student_badges(badge_id);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_badges_all" ON public.student_badges;
CREATE POLICY "student_badges_all" ON public.student_badges
  FOR ALL
  USING (
    student_id IN (
      SELECT s.id
      FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    student_id IN (
      SELECT s.id
      FROM public.students s
      JOIN public.teacher_classes tc ON tc.id = s.class_id
      WHERE tc.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- One attendance record per student, day, and attendance channel.
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_unique_attendance
  ON public.activities(student_id, date, kind)
  WHERE kind IN ('attendance', 'outreach');

-- Collision-resistant, server-generated class creation.
CREATE OR REPLACE FUNCTION public.create_teacher_class(p_class_name TEXT)
RETURNS public.teacher_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_class public.teacher_classes;
  v_code TEXT;
  v_attempt INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NULLIF(BTRIM(p_class_name), '') IS NULL THEN
    RAISE EXCEPTION 'Class name is required';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := 'FQ-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));

    BEGIN
      INSERT INTO public.teacher_classes (user_id, class_name, join_code)
      VALUES (auth.uid(), BTRIM(p_class_name), v_code)
      RETURNING * INTO v_class;
      RETURN v_class;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'Unable to allocate a unique class code';
      END IF;
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.create_teacher_class(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_teacher_class(TEXT) TO authenticated;
