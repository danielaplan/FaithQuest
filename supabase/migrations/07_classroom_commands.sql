-- ====================================================================
-- MIGRATION 07: Idempotent classroom commands
-- Apply after migration 06.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.record_student_activity(
  p_activity_id UUID,
  p_student_id UUID,
  p_kind TEXT,
  p_points INTEGER,
  p_date DATE,
  p_label TEXT
)
RETURNS public.activities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_activity public.activities;
BEGIN
  IF p_kind NOT IN ('attendance', 'outreach', 'verse', 'quiz', 'discussion', 'bible', 'event', 'helping', 'custom') THEN
    RAISE EXCEPTION 'Invalid activity kind';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_classes tc ON tc.id = s.class_id
    WHERE s.id = p_student_id
      AND s.archived_at IS NULL
      AND tc.deleted_at IS NULL
      AND (tc.user_id = auth.uid() OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Student access denied';
  END IF;

  BEGIN
    INSERT INTO public.activities (id, student_id, kind, points, date, label)
    VALUES (p_activity_id, p_student_id, p_kind, p_points, p_date, BTRIM(p_label))
    ON CONFLICT (id) DO NOTHING
    RETURNING * INTO v_activity;

    IF v_activity.id IS NULL THEN
      SELECT * INTO v_activity
      FROM public.activities
      WHERE id = p_activity_id AND student_id = p_student_id;

      IF v_activity.id IS NULL THEN
        RAISE EXCEPTION 'Activity ID already belongs to another student';
      END IF;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    IF p_kind IN ('attendance', 'outreach') THEN
      SELECT * INTO v_activity
      FROM public.activities
      WHERE student_id = p_student_id
        AND date = p_date
        AND kind = p_kind;
    ELSE
      RAISE;
    END IF;
  END;

  RETURN v_activity;
END;
$$;

REVOKE ALL ON FUNCTION public.record_student_activity(UUID, UUID, TEXT, INTEGER, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_student_activity(UUID, UUID, TEXT, INTEGER, DATE, TEXT) TO authenticated;
