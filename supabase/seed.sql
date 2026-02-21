-- ============================================================
-- LIFE OS — Seed Data
-- Run this AFTER schema.sql and rls-policies.sql
-- NOTE: Replace 'YOUR_USER_ID' with your actual auth user UUID
-- after you sign up for the first time.
-- You can find it in Supabase → Authentication → Users
-- ============================================================

-- ============================================================
-- INSTRUCTIONS:
-- 1. First, sign up in the app (create your account)
-- 2. Go to Supabase Dashboard → Authentication → Users
-- 3. Copy your User UID
-- 4. Replace every 'YOUR_USER_ID' below with that UUID
-- 5. Run this SQL in the SQL Editor
-- ============================================================

-- ============================================================
-- The 5 PIANKY Hierarchy Goals
-- ============================================================

INSERT INTO goals (user_id, title, subtitle, tier, color, icon, flask_type, sort_order) VALUES
  ('YOUR_USER_ID', 'The Crystal Flask of Aman', 'Health — If the flask is empty, the man is empty.', 1, '#D4AF37', 'flask', 'crystal_aman', 1),
  ('YOUR_USER_ID', 'The Father''s Legacy', 'Sacred — Your father is 84. This tier runs on a biological clock.', 2, '#8B4513', 'scroll', 'legacy_vessel', 2),
  ('YOUR_USER_ID', 'Sovereign Self', 'Growth — Owning your time, your mobility, and your mind.', 3, '#4169E1', 'crown', 'sovereign_chalice', 3),
  ('YOUR_USER_ID', 'PIANKY PICTURES', 'The Empire — Your identity as a filmmaker.', 4, '#9B59B6', 'film', 'empire_amphora', 4),
  ('YOUR_USER_ID', 'PIANKY OS', 'The Architect — Turn ADHD management into a product.', 5, '#00CED1', 'code', 'architect_beaker', 5);

-- ============================================================
-- Key Results per Goal
-- (weights must sum to 1.0 within each goal)
-- ============================================================

-- Crystal Flask of Aman (Health)
INSERT INTO key_results (user_id, goal_id, title, weight, target_value, unit) VALUES
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'The Crystal Flask of Aman' AND user_id = 'YOUR_USER_ID'), 'Diagnosis resolved (H. pylori/SIBO)', 0.35, 100, '%'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'The Crystal Flask of Aman' AND user_id = 'YOUR_USER_ID'), 'Weight gain to 65kg', 0.35, 65, 'kg'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'The Crystal Flask of Aman' AND user_id = 'YOUR_USER_ID'), 'Gym habit (3x/week consistency)', 0.30, 100, '%');

-- The Father's Legacy
INSERT INTO key_results (user_id, goal_id, title, weight, target_value, unit) VALUES
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'The Father''s Legacy' AND user_id = 'YOUR_USER_ID'), 'Documentary footage organized & 5 interviews done', 0.50, 100, '%'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'The Father''s Legacy' AND user_id = 'YOUR_USER_ID'), 'Calligraphy business: 10 paintings + social media launch', 0.50, 100, '%');

-- Sovereign Self
INSERT INTO key_results (user_id, goal_id, title, weight, target_value, unit) VALUES
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'Sovereign Self' AND user_id = 'YOUR_USER_ID'), 'Salary raised to 17k MAD', 0.35, 100, '%'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'Sovereign Self' AND user_id = 'YOUR_USER_ID'), 'Read 30 books this year', 0.35, 30, 'books'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'Sovereign Self' AND user_id = 'YOUR_USER_ID'), 'Driving license obtained', 0.30, 100, '%');

-- PIANKY PICTURES
INSERT INTO key_results (user_id, goal_id, title, weight, target_value, unit) VALUES
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'PIANKY PICTURES' AND user_id = 'YOUR_USER_ID'), 'Water For The Birds: distribution strategy executed', 0.35, 100, '%'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'PIANKY PICTURES' AND user_id = 'YOUR_USER_ID'), '2 screenplays in active development', 0.35, 2, 'scripts'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'PIANKY PICTURES' AND user_id = 'YOUR_USER_ID'), 'Company strategy document completed', 0.30, 100, '%');

-- PIANKY OS
INSERT INTO key_results (user_id, goal_id, title, weight, target_value, unit) VALUES
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'PIANKY OS' AND user_id = 'YOUR_USER_ID'), 'Life OS Phase 1 complete & daily use', 0.50, 100, '%'),
  ('YOUR_USER_ID', (SELECT id FROM goals WHERE title = 'PIANKY OS' AND user_id = 'YOUR_USER_ID'), 'AI Production Manager prototype', 0.50, 100, '%');

-- ============================================================
-- Inspirational Quotes (loading screen)
-- ============================================================

INSERT INTO quotes (user_id, text, author, source, is_featured) VALUES
  ('YOUR_USER_ID', 'The secret of getting ahead is getting started.', 'Mark Twain', NULL, true),
  ('YOUR_USER_ID', 'Do not wait to strike till the iron is hot, but make it hot by striking.', 'William Butler Yeats', NULL, true),
  ('YOUR_USER_ID', 'A year from now you will wish you had started today.', 'Karen Lamb', NULL, true),
  ('YOUR_USER_ID', 'The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb', NULL, true),
  ('YOUR_USER_ID', 'He who has health has hope, and he who has hope has everything.', 'Arabian Proverb', NULL, true),
  ('YOUR_USER_ID', 'Small daily improvements over time lead to stunning results.', 'Robin Sharma', NULL, true),
  ('YOUR_USER_ID', 'The man who moves a mountain begins by carrying away small stones.', 'Confucius', NULL, true),
  ('YOUR_USER_ID', 'Discipline is choosing between what you want now and what you want most.', 'Abraham Lincoln', NULL, true),
  ('YOUR_USER_ID', 'Your body is the vessel of your ambitions. Fill the flask first.', 'PIANKY OS', 'System', true),
  ('YOUR_USER_ID', 'The legacy you leave is the life you lead.', 'Jim Kouzes', NULL, true),
  ('YOUR_USER_ID', 'Every master was once a disaster.', 'T. Harv Eker', NULL, true),
  ('YOUR_USER_ID', 'The only way to do great work is to love what you do.', 'Steve Jobs', NULL, true);
