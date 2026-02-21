-- ============================================================
-- LIFE OS — Row Level Security Policies
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Helper: Enable RLS + create ownership policies for a table
-- We do each table explicitly for clarity

-- ============================================================
-- profiles (uses id, not user_id)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Insert handled by trigger, but allow manual insert too
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================
-- goals
-- ============================================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own goals" ON goals
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own goals" ON goals
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own goals" ON goals
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own goals" ON goals
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ============================================================
-- key_results
-- ============================================================
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own key_results" ON key_results
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own key_results" ON key_results
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own key_results" ON key_results
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own key_results" ON key_results
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_key_results_user_id ON key_results(user_id);
CREATE INDEX IF NOT EXISTS idx_key_results_goal_id ON key_results(goal_id);

-- ============================================================
-- tasks
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own tasks" ON tasks
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own tasks" ON tasks
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own tasks" ON tasks
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================================
-- xp_logs
-- ============================================================
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own xp_logs" ON xp_logs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own xp_logs" ON xp_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created_at ON xp_logs(created_at);

-- ============================================================
-- deadlines
-- ============================================================
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own deadlines" ON deadlines
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own deadlines" ON deadlines
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own deadlines" ON deadlines
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own deadlines" ON deadlines
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_deadlines_user_id ON deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_at ON deadlines(due_at);

-- ============================================================
-- groceries
-- ============================================================
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own groceries" ON groceries
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own groceries" ON groceries
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own groceries" ON groceries
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own groceries" ON groceries
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_groceries_user_id ON groceries(user_id);

-- ============================================================
-- weight_logs
-- ============================================================
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own weight_logs" ON weight_logs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own weight_logs" ON weight_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own weight_logs" ON weight_logs
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);

-- ============================================================
-- daily_health_checks
-- ============================================================
ALTER TABLE daily_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own health_checks" ON daily_health_checks
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own health_checks" ON daily_health_checks
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own health_checks" ON daily_health_checks
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_health_checks_user_id ON daily_health_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_date ON daily_health_checks(check_date);

-- ============================================================
-- quotes
-- ============================================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own quotes" ON quotes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own quotes" ON quotes
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own quotes" ON quotes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own quotes" ON quotes
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);

-- ============================================================
-- books (Phase 2)
-- ============================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own books" ON books
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own books" ON books
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own books" ON books
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own books" ON books
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);

-- ============================================================
-- reading_logs (Phase 2)
-- ============================================================
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reading_logs" ON reading_logs
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own reading_logs" ON reading_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_logs_user_id ON reading_logs(user_id);

-- ============================================================
-- skill_points (Phase 2)
-- ============================================================
ALTER TABLE skill_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own skill_points" ON skill_points
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own skill_points" ON skill_points
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own skill_points" ON skill_points
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_points_user_id ON skill_points(user_id);

-- ============================================================
-- projects (Phase 3)
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own projects" ON projects
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users update own projects" ON projects
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users delete own projects" ON projects
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
