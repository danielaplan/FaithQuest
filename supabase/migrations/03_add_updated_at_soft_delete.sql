-- ====================================================================
-- MIGRATION 03: Add updated_at columns, soft-delete, and audit fields
-- Run this in Supabase SQL Editor AFTER 01 and 02
-- ====================================================================

-- 1. Add updated_at to tables missing it
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.teacher_classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.student_rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create universal updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_churches_updated_at ON public.churches;
CREATE TRIGGER trigger_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_teacher_classes_updated_at ON public.teacher_classes;
CREATE TRIGGER trigger_teacher_classes_updated_at
  BEFORE UPDATE ON public.teacher_classes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_students_updated_at ON public.students;
CREATE TRIGGER trigger_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_activities_updated_at ON public.activities;
CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER trigger_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_badges_updated_at ON public.badges;
CREATE TRIGGER trigger_badges_updated_at
  BEFORE UPDATE ON public.badges
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_rewards_updated_at ON public.rewards;
CREATE TRIGGER trigger_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_student_rewards_updated_at ON public.student_rewards;
CREATE TRIGGER trigger_student_rewards_updated_at
  BEFORE UPDATE ON public.student_rewards
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 4. Soft-delete: Add deleted_at columns
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.teacher_classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. Partial indexes for active (non-deleted) records - speeds up common queries
CREATE INDEX IF NOT EXISTS idx_churches_active ON public.churches(admin_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_classes_active ON public.teacher_classes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_classes_church_active ON public.teacher_classes(church_id) WHERE deleted_at IS NULL;

-- 6. Update RLS policies to respect soft-delete (exclude deleted records)
-- Churches: don't show deleted churches
DROP POLICY IF EXISTS "churches_select" ON public.churches;
CREATE POLICY "churches_select" ON public.churches
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      admin_id = auth.uid()
      OR id IN (SELECT church_id FROM public.teacher_classes WHERE user_id = auth.uid() AND deleted_at IS NULL)
      OR public.is_admin()
    )
  );

-- Teacher classes: don't show deleted classes
DROP POLICY IF EXISTS "classes_all" ON public.teacher_classes;
CREATE POLICY "classes_all" ON public.teacher_classes
  FOR ALL USING (
    deleted_at IS NULL
    AND (user_id = auth.uid() OR public.is_admin())
  )
  WITH CHECK (
    deleted_at IS NULL
    AND (user_id = auth.uid() OR public.is_admin())
  );

-- Students: don't show students from deleted classes
DROP POLICY IF EXISTS "students_all" ON public.students;
CREATE POLICY "students_all" ON public.students
  FOR ALL USING (
    archived_at IS NULL
    AND class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR public.is_admin()
  )
  WITH CHECK (
    archived_at IS NULL
    AND class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR public.is_admin()
  );

-- 7. Helper function for soft-delete (optional, for application use)
CREATE OR REPLACE FUNCTION public.soft_delete_church(p_church_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.churches SET deleted_at = NOW() WHERE id = p_church_id AND (admin_id = auth.uid() OR public.is_admin());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.soft_delete_class(p_class_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.teacher_classes SET deleted_at = NOW() WHERE id = p_class_id AND (user_id = auth.uid() OR public.is_admin());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'church', 'class', 'teacher', 'student', 'badge', 'reward'
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- System can insert (via SECURITY DEFINER functions)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());