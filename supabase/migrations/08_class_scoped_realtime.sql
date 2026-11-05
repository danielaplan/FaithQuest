-- ====================================================================
-- MIGRATION 08: Class-scoped Realtime invalidation
-- Apply after migration 07.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.class_sync_events (
  class_id UUID PRIMARY KEY REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.class_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_sync_events_select" ON public.class_sync_events;
CREATE POLICY "class_sync_events_select" ON public.class_sync_events
  FOR SELECT USING (
    class_id IN (
      SELECT id
      FROM public.teacher_classes
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) OR public.is_admin()
  );

CREATE OR REPLACE FUNCTION public.touch_class_sync_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
BEGIN
  IF TG_TABLE_NAME IN ('students', 'quizzes') THEN
    IF TG_OP = 'DELETE' THEN
      v_class_id := OLD.class_id;
    ELSE
      v_class_id := NEW.class_id;
    END IF;
  ELSE
    IF TG_OP = 'DELETE' THEN
      v_student_id := OLD.student_id;
    ELSE
      v_student_id := NEW.student_id;
    END IF;

    SELECT class_id INTO v_class_id
    FROM public.students
    WHERE id = v_student_id;
  END IF;

  IF v_class_id IS NOT NULL THEN
    INSERT INTO public.class_sync_events (class_id, version, updated_at)
    VALUES (v_class_id, 1, NOW())
    ON CONFLICT (class_id) DO UPDATE
      SET version = public.class_sync_events.version + 1,
          updated_at = NOW();
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_event_students ON public.students;
CREATE TRIGGER sync_event_students
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.touch_class_sync_event();

DROP TRIGGER IF EXISTS sync_event_activities ON public.activities;
CREATE TRIGGER sync_event_activities
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW EXECUTE PROCEDURE public.touch_class_sync_event();

DROP TRIGGER IF EXISTS sync_event_quizzes ON public.quizzes;
CREATE TRIGGER sync_event_quizzes
  AFTER INSERT OR UPDATE OR DELETE ON public.quizzes
  FOR EACH ROW EXECUTE PROCEDURE public.touch_class_sync_event();

DROP TRIGGER IF EXISTS sync_event_student_badges ON public.student_badges;
CREATE TRIGGER sync_event_student_badges
  AFTER INSERT OR UPDATE OR DELETE ON public.student_badges
  FOR EACH ROW EXECUTE PROCEDURE public.touch_class_sync_event();

DROP TRIGGER IF EXISTS sync_event_student_rewards ON public.student_rewards;
CREATE TRIGGER sync_event_student_rewards
  AFTER INSERT OR UPDATE OR DELETE ON public.student_rewards
  FOR EACH ROW EXECUTE PROCEDURE public.touch_class_sync_event();

-- Add the compact invalidation table to Supabase Realtime once.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'class_sync_events'
    ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_sync_events;
  END IF;
END;
$$;
