-- ============================================================
-- LIFE OS — Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- User profile & settings
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  date_of_birth DATE,
  height_cm NUMERIC,
  target_weight_kg NUMERIC DEFAULT 65,
  xp_total NUMERIC DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  health_multiplier_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vision board goals (5 PIANKY Hierarchy pillars)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  image_url TEXT,
  color TEXT DEFAULT '#D4AF37',
  icon TEXT,
  flask_type TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Key results under each goal (2-3 per goal)
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  weight NUMERIC NOT NULL CHECK (weight > 0 AND weight <= 1),
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC DEFAULT 100,
  unit TEXT DEFAULT '%',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks (daily actions linked to key results)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_result_id UUID REFERENCES key_results(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  base_xp NUMERIC NOT NULL DEFAULT 5.00,
  is_highlighted BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  scheduled_date DATE DEFAULT CURRENT_DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- XP transaction log (immutable audit trail)
CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  multiplier NUMERIC DEFAULT 1.0,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deadlines & events
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'general',
  pre_questions TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grocery list
CREATE TABLE IF NOT EXISTS groceries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  category TEXT DEFAULT 'general',
  is_bought BOOLEAN DEFAULT false,
  bought_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weight tracking
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg NUMERIC NOT NULL,
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily health check (for multiplier calculation)
CREATE TABLE IF NOT EXISTS daily_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_date DATE DEFAULT CURRENT_DATE,
  meds_taken BOOLEAN DEFAULT false,
  symptom_notes TEXT,
  health_minimum_met BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_date)
);

-- Inspirational quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  author TEXT,
  source TEXT,
  book_id UUID,
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Phase 2 Tables (created now for schema completeness)
-- ============================================================

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  format TEXT CHECK (format IN ('paper', 'audio', 'ebook')),
  total_pages INTEGER,
  total_hours NUMERIC,
  current_progress NUMERIC DEFAULT 0,
  skill_category TEXT,
  status TEXT DEFAULT 'reading' CHECK (status IN ('to_read', 'reading', 'completed', 'abandoned')),
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Book reading sessions
CREATE TABLE IF NOT EXISTS reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  unit TEXT DEFAULT 'pages',
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- Skill points for radar chart
CREATE TABLE IF NOT EXISTS skill_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  points NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- ============================================================
-- Phase 3 Tables
-- ============================================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  current_phase TEXT,
  next_action TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  is_stalled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'profiles', 'goals', 'key_results', 'tasks',
      'deadlines', 'groceries', 'books', 'projects'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
