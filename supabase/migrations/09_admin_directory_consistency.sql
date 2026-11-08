-- ====================================================================
-- MIGRATION 09: Consistent church assignments and admin directories
-- Apply after migration 08.
-- ====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS church_id UUID;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_church_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_church_id_fkey
  FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON public.profiles(church_id);

-- Preserve the assignment already represented by a teacher's classes.
UPDATE public.profiles p
SET church_id = assigned.church_id
FROM (
  SELECT DISTINCT ON (user_id) user_id, church_id
  FROM public.teacher_classes
  WHERE church_id IS NOT NULL AND deleted_at IS NULL
  ORDER BY user_id, created_at
) assigned
WHERE p.id = assigned.user_id AND p.church_id IS NULL;

CREATE OR REPLACE FUNCTION public.assign_user_church(p_user_id UUID, p_church_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_church_id UUID;
  v_profile public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF p_church_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.churches WHERE id = p_church_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Church not found';
  END IF;

  SELECT church_id INTO v_old_church_id
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE public.profiles
  SET church_id = p_church_id, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_profile;

  UPDATE public.teacher_classes
  SET church_id = p_church_id, updated_at = NOW()
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'profile.church_changed',
    'profile',
    p_user_id,
    jsonb_build_object('church_id', v_old_church_id),
    jsonb_build_object('church_id', p_church_id)
  );

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_church(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_church(UUID, UUID) TO authenticated;

-- New classes inherit the teacher's staff-level church assignment.
CREATE OR REPLACE FUNCTION public.create_teacher_class(p_class_name TEXT)
RETURNS public.teacher_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_class public.teacher_classes;
  v_church_id UUID;
  v_code TEXT;
  v_attempt INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NULLIF(BTRIM(p_class_name), '') IS NULL THEN
    RAISE EXCEPTION 'Class name is required';
  END IF;

  SELECT church_id INTO v_church_id FROM public.profiles WHERE id = auth.uid();

  LOOP
    v_attempt := v_attempt + 1;
    v_code := 'FQ-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));

    BEGIN
      INSERT INTO public.teacher_classes (user_id, church_id, class_name, join_code)
      VALUES (auth.uid(), v_church_id, BTRIM(p_class_name), v_code)
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
