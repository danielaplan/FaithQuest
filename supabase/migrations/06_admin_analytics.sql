-- ====================================================================
-- MIGRATION 06: Server-side admin analytics
-- Apply after migration 05.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  SELECT jsonb_build_object(
    'totalChurches', (SELECT COUNT(*) FROM public.churches WHERE deleted_at IS NULL),
    'totalTeachers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'teacher'),
    'totalClasses', (SELECT COUNT(*) FROM public.teacher_classes WHERE deleted_at IS NULL),
    'totalStudents', (SELECT COUNT(*) FROM public.students WHERE archived_at IS NULL),
    'totalPoints', (SELECT COALESCE(SUM(points), 0) FROM public.activities),
    'totalActivities', (SELECT COUNT(*) FROM public.activities)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_points_analytics(p_limit INTEGER DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  WITH student_totals AS (
    SELECT
      s.id,
      s.name,
      tc.class_name,
      COALESCE(c.name, '—') AS church_name,
      COALESCE(SUM(a.points), 0)::INTEGER AS total_points
    FROM public.students s
    JOIN public.teacher_classes tc ON tc.id = s.class_id AND tc.deleted_at IS NULL
    LEFT JOIN public.churches c ON c.id = tc.church_id AND c.deleted_at IS NULL
    LEFT JOIN public.activities a ON a.student_id = s.id
    WHERE s.archived_at IS NULL
    GROUP BY s.id, s.name, tc.class_name, c.name
    ORDER BY total_points DESC, s.name
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500))
  ),
  activity_breakdown AS (
    SELECT kind, COALESCE(SUM(points), 0)::INTEGER AS points
    FROM public.activities
    GROUP BY kind
    ORDER BY points DESC
  )
  SELECT jsonb_build_object(
    'leaderboard', COALESCE((SELECT jsonb_agg(to_jsonb(student_totals)) FROM student_totals), '[]'::JSONB),
    'breakdown', COALESCE((SELECT jsonb_agg(to_jsonb(activity_breakdown)) FROM activity_breakdown), '[]'::JSONB),
    'totalPoints', (SELECT COALESCE(SUM(points), 0) FROM public.activities)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_points_analytics(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_points_analytics(INTEGER) TO authenticated;
