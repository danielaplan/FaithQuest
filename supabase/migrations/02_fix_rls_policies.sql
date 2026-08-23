-- ====================================================================
-- PATCH MIGRATION 02: ADD MISSING RLS POLICIES FOR CHURCHES & BADGES
-- Run this in Supabase SQL Editor
-- ====================================================================

-- 1. CHURCHES POLICIES
-- Church admins can manage their own church, teachers can view the church their class belongs to
DROP POLICY IF EXISTS "churches_select" ON public.churches;
CREATE POLICY "churches_select" ON public.churches
  FOR SELECT USING (
    admin_id = auth.uid()
    OR id IN (SELECT church_id FROM public.teacher_classes WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "churches_insert" ON public.churches;
CREATE POLICY "churches_insert" ON public.churches
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "churches_update" ON public.churches;
CREATE POLICY "churches_update" ON public.churches
  FOR UPDATE USING (
    admin_id = auth.uid() OR public.is_admin()
  ) WITH CHECK (
    admin_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "churches_delete" ON public.churches;
CREATE POLICY "churches_delete" ON public.churches
  FOR DELETE USING (
    admin_id = auth.uid() OR public.is_admin()
  );

-- 2. BADGES POLICIES
-- Teachers can view global badges (class_id IS NULL) and their class-specific badges
-- Teachers can create/update/delete badges for their own classes; Admins can manage all (including global)
DROP POLICY IF EXISTS "badges_all" ON public.badges;
CREATE POLICY "badges_all" ON public.badges
  FOR ALL USING (
    class_id IS NULL 
    OR class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) 
    OR public.is_admin()
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.teacher_classes WHERE user_id = auth.uid()) 
    OR public.is_admin()
  );
