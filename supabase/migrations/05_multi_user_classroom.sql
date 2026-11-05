-- ====================================================================
-- MIGRATION 05: Authoritative classroom catalogs and transactions
-- Apply after migration 04.
-- ====================================================================

ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS code TEXT;

UPDATE public.badges SET code = id::TEXT WHERE code IS NULL;
UPDATE public.rewards SET code = id::TEXT WHERE code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_badges_code ON public.badges(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_code ON public.rewards(code);

-- Stable global catalogs let the UI use readable codes while relations keep UUID keys.
INSERT INTO public.rewards (id, class_id, code, name, cost, type)
VALUES
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:small-fish'), NULL, 'small-fish', 'Small Guppy', 50, 'fish'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:color-fish'), NULL, 'color-fish', 'Neon Tetra', 100, 'fish'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:rare-fish'), NULL, 'rare-fish', 'Angelfish', 300, 'fish'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:golden-fish'), NULL, 'golden-fish', 'Golden Koi', 500, 'fish'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:water-plant'), NULL, 'water-plant', 'Sea Grass', 70, 'decor'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:castle'), NULL, 'castle', 'Treasure Castle', 180, 'decor'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:coral'), NULL, 'coral', 'Rainbow Coral', 140, 'decor'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:reward:rocks'), NULL, 'rocks', 'Smooth River Rocks', 60, 'decor')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  cost = EXCLUDED.cost,
  type = EXCLUDED.type;

INSERT INTO public.badges (id, class_id, code, name, category, icon, description, condition)
VALUES
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:first-steps'), NULL, 'first-steps', 'First Steps', 'attendance', '👣', 'Attend 1 session', '{"kind":"attendance_or_outreach","count":1}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:faithful-beginner'), NULL, 'faithful-beginner', 'Faithful Beginner', 'attendance', '🌱', 'Attend 5 sessions', '{"kind":"attendance_or_outreach","count":5}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:dedicated-learner'), NULL, 'dedicated-learner', 'Dedicated Learner', 'attendance', '📖', 'Attend 10 sessions', '{"kind":"attendance_or_outreach","count":10}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:consistent-member'), NULL, 'consistent-member', 'Consistent Member', 'attendance', '⚓', 'Attend 20 sessions', '{"kind":"attendance_or_outreach","count":20}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:always-present'), NULL, 'always-present', 'Always Present', 'attendance', '☀️', 'Attend 50 sessions', '{"kind":"attendance_or_outreach","count":50}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:sunday-champion'), NULL, 'sunday-champion', 'Sunday Champion', 'attendance', '⛪', 'Attend 10 Sunday School sessions', '{"kind":"attendance","count":10}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:first-mission'), NULL, 'first-mission', 'First Mission', 'outreach', '🌱', 'Attend 1 outreach', '{"kind":"outreach","count":1}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:outreach-faithful'), NULL, 'outreach-faithful', 'Outreach Faithful', 'outreach', '🌿', 'Attend 3 outreach events', '{"kind":"outreach","count":3}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:outreach-hero'), NULL, 'outreach-hero', 'Outreach Hero', 'outreach', '🌍', 'Attend 5 outreach events', '{"kind":"outreach","count":5}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:mission-dedicated'), NULL, 'mission-dedicated', 'Mission Dedicated', 'outreach', '✝️', 'Attend 10 outreach events', '{"kind":"outreach","count":10}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:outreach-champion'), NULL, 'outreach-champion', 'Outreach Champion', 'outreach', '🏅', 'Attend 20 outreach events', '{"kind":"outreach","count":20}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:verse-explorer'), NULL, 'verse-explorer', 'Verse Explorer', 'scripture', '🔍', 'Memorize 1 Bible verse', '{"kind":"verse","count":1}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:scripture-learner'), NULL, 'scripture-learner', 'Scripture Learner', 'scripture', '🧠', 'Memorize 5 verses', '{"kind":"verse","count":5}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:word-keeper'), NULL, 'word-keeper', 'Word Keeper', 'scripture', '📥', 'Memorize 10 verses', '{"kind":"verse","count":10}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:scripture-master'), NULL, 'scripture-master', 'Scripture Master', 'scripture', '🎓', 'Memorize 20 verses', '{"kind":"verse","count":20}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:living-word'), NULL, 'living-word', 'Living Word', 'scripture', '🔥', 'Memorize 50 verses', '{"kind":"verse","count":50}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:faith-starter'), NULL, 'faith-starter', 'Faith Starter', 'points', '✨', 'Earn 50 Faith Points', '{"kind":"points","count":50}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:growing-in-faith'), NULL, 'growing-in-faith', 'Growing in Faith', 'points', '📈', 'Earn 100 Faith Points', '{"kind":"points","count":100}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:shining-light'), NULL, 'shining-light', 'Shining Light', 'points', '💡', 'Earn 200 Faith Points', '{"kind":"points","count":200}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:role-model'), NULL, 'role-model', 'Role Model', 'points', '🌟', 'Earn 300 Faith Points', '{"kind":"points","count":300}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:faith-champion'), NULL, 'faith-champion', 'Faith Champion', 'points', '🏆', 'Earn 500 Faith Points', '{"kind":"points","count":500}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:legendary'), NULL, 'legendary', 'Legendary', 'points', '🛡️', 'Earn 1000 Faith Points', '{"kind":"points","count":1000}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:quiz-taker'), NULL, 'quiz-taker', 'Quiz Taker', 'quiz', '🎯', 'Answer 1 quiz correctly', '{"kind":"quiz","count":1}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:bible-scholar'), NULL, 'bible-scholar', 'Bible Scholar', 'quiz', '📜', 'Answer 10 quizzes correctly', '{"kind":"quiz","count":10}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:trivia-master'), NULL, 'trivia-master', 'Trivia Master', 'quiz', '👑', 'Answer 25 quizzes correctly', '{"kind":"quiz","count":25}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:kind-heart'), NULL, 'kind-heart', 'Kind Heart', 'character', '❤️', 'Help a classmate once', '{"kind":"helping","count":1}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:servant-leader'), NULL, 'servant-leader', 'Servant Leader', 'character', '🤝', 'Help a classmate 5 times', '{"kind":"helping","count":5}'),
  (uuid_generate_v5(uuid_ns_url(), 'faithquest:badge:community-pillar'), NULL, 'community-pillar', 'Community Pillar', 'character', '🏛️', 'Help a classmate 10 times', '{"kind":"helping","count":10}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  condition = EXCLUDED.condition;

-- Idempotently replace the earned badge set for one authorized student.
CREATE OR REPLACE FUNCTION public.sync_student_badges(
  p_student_id UUID,
  p_badge_codes TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_classes tc ON tc.id = s.class_id
    WHERE s.id = p_student_id
      AND (tc.user_id = auth.uid() OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'Student access denied';
  END IF;

  DELETE FROM public.student_badges sb
  WHERE sb.student_id = p_student_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.badges b
      WHERE b.id = sb.badge_id
        AND b.code = ANY(COALESCE(p_badge_codes, ARRAY[]::TEXT[]))
    );

  INSERT INTO public.student_badges (student_id, badge_id, awarded_by)
  SELECT p_student_id, b.id, auth.uid()
  FROM public.badges b
  WHERE b.code = ANY(COALESCE(p_badge_codes, ARRAY[]::TEXT[]))
  ON CONFLICT (student_id, badge_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_student_badges(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_student_badges(UUID, TEXT[]) TO authenticated;

-- Reward redemption locks the student, validates balance, and writes once.
CREATE OR REPLACE FUNCTION public.redeem_student_reward(
  p_student_id UUID,
  p_reward_code TEXT
)
RETURNS public.student_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reward public.rewards;
  v_result public.student_rewards;
  v_earned INTEGER;
  v_spent INTEGER;
BEGIN
  PERFORM 1
  FROM public.students s
  JOIN public.teacher_classes tc ON tc.id = s.class_id
  WHERE s.id = p_student_id
    AND (tc.user_id = auth.uid() OR public.is_admin())
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Student access denied';
  END IF;

  SELECT * INTO v_reward
  FROM public.rewards
  WHERE code = p_reward_code;

  IF v_reward.id IS NULL THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  SELECT * INTO v_result
  FROM public.student_rewards
  WHERE student_id = p_student_id AND reward_id = v_reward.id;

  IF v_result.id IS NOT NULL THEN
    RETURN v_result;
  END IF;

  SELECT COALESCE(SUM(points), 0) INTO v_earned
  FROM public.activities
  WHERE student_id = p_student_id;

  SELECT COALESCE(SUM(r.cost), 0) INTO v_spent
  FROM public.student_rewards sr
  JOIN public.rewards r ON r.id = sr.reward_id
  WHERE sr.student_id = p_student_id;

  IF v_earned - v_spent < v_reward.cost THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  INSERT INTO public.student_rewards (student_id, reward_id)
  VALUES (p_student_id, v_reward.id)
  ON CONFLICT (student_id, reward_id) DO UPDATE
    SET purchased_at = public.student_rewards.purchased_at
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_student_reward(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_student_reward(UUID, TEXT) TO authenticated;
