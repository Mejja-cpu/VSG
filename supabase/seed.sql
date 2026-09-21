-- ============================================================
-- Virtual Study Group System — Seed Data
-- Run this AFTER rls.sql (Step 3 of 3)
-- ============================================================
-- IMPORTANT: After running this script, create the admin account
-- manually through Supabase Auth > Users > "Add user"
-- Email: admin@vsg.edu | Password: Admin@VSG2024!
-- Then update the profile role to 'admin':
--   UPDATE public.profiles SET role = 'admin' WHERE user_id = '<the-admin-user-id>';
-- OR use the function below after creating the user.
-- ============================================================

-- ============================================================
-- SUBJECTS
-- ============================================================
INSERT INTO public.subjects (name, description, icon, color) VALUES
  ('Mathematics', 'Algebra, Calculus, Statistics, and more', '📐', '#6366f1'),
  ('Accounting', 'Financial accounting, managerial accounting, auditing', '💰', '#22c55e'),
  ('Computer Science', 'Programming, algorithms, data structures, AI', '💻', '#3b82f6'),
  ('Economics', 'Microeconomics, macroeconomics, international trade', '📊', '#f59e0b'),
  ('Biology', 'Cell biology, genetics, ecology, human biology', '🧬', '#10b981'),
  ('Business Studies', 'Management, marketing, entrepreneurship', '🏢', '#8b5cf6'),
  ('Physics', 'Mechanics, thermodynamics, electromagnetism', '⚛️', '#ef4444'),
  ('Chemistry', 'Organic chemistry, physical chemistry, biochemistry', '🧪', '#ec4899'),
  ('History', 'World history, African history, contemporary history', '📜', '#a78bfa'),
  ('English', 'Literature, grammar, writing, communication skills', '📝', '#06b6d4'),
  ('Geography', 'Physical geography, human geography, GIS', '🗺️', '#84cc16'),
  ('Psychology', 'Cognitive psychology, social psychology, research methods', '🧠', '#f97316')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value) VALUES
  ('First Steps', 'Joined your first study group', '🎯', 'first_group', 1),
  ('Quiz Starter', 'Completed your first quiz', '📝', 'quiz_count', 1),
  ('Quiz Enthusiast', 'Completed 5 quizzes', '🏆', 'quiz_count', 5),
  ('Quiz Master', 'Completed 10 quizzes', '🥇', 'quiz_count', 10),
  ('Goal Setter', 'Created your first learning goal', '🎯', 'goal_count', 1),
  ('Goal Achiever', 'Completed 3 learning goals', '✅', 'goals_completed', 3),
  ('Helpful Peer', 'Given feedback to 5 fellow students', '🤝', 'feedback_given', 5),
  ('Social Learner', 'Joined 3 study groups', '👥', 'group_count', 3),
  ('Study Streak 7', 'Maintained a 7-day study streak', '🔥', 'study_streak', 7),
  ('Study Streak 30', 'Maintained a 30-day study streak', '⚡', 'study_streak', 30),
  ('Resource Sharer', 'Shared 5 study resources', '📚', 'resources_shared', 5),
  ('High Scorer', 'Scored 90% or above on a quiz', '⭐', 'quiz_high_score', 90),
  ('Consistent Learner', 'Active for 14 consecutive days', '📅', 'study_streak', 14),
  ('Session Organizer', 'Organized your first study session', '📅', 'sessions_organized', 1)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SAMPLE QUIZZES (will be linked to subjects after creation)
-- NOTE: Insert quizzes after the admin user is created, or use
-- a placeholder UUID for created_by
-- ============================================================

-- Mathematics Quiz
WITH math_subject AS (SELECT id FROM public.subjects WHERE name = 'Mathematics' LIMIT 1)
INSERT INTO public.quizzes (title, subject_id, description, difficulty, time_limit, passing_score, allow_retake)
SELECT 
  'Algebra Fundamentals Quiz',
  math_subject.id,
  'Test your understanding of basic algebraic concepts including equations, inequalities, and functions.',
  'easy',
  20,
  60,
  TRUE
FROM math_subject
ON CONFLICT DO NOTHING;

-- Computer Science Quiz
WITH cs_subject AS (SELECT id FROM public.subjects WHERE name = 'Computer Science' LIMIT 1)
INSERT INTO public.quizzes (title, subject_id, description, difficulty, time_limit, passing_score, allow_retake)
SELECT
  'Programming Basics Quiz',
  cs_subject.id,
  'Covers variables, loops, conditionals, functions and basic data structures.',
  'easy',
  25,
  65,
  TRUE
FROM cs_subject
ON CONFLICT DO NOTHING;

-- Economics Quiz  
WITH econ_subject AS (SELECT id FROM public.subjects WHERE name = 'Economics' LIMIT 1)
INSERT INTO public.quizzes (title, subject_id, description, difficulty, time_limit, passing_score, allow_retake)
SELECT
  'Microeconomics Concepts Quiz',
  econ_subject.id,
  'Test your knowledge of supply, demand, market equilibrium, elasticity and consumer theory.',
  'medium',
  30,
  60,
  TRUE
FROM econ_subject
ON CONFLICT DO NOTHING;

-- Biology Quiz
WITH bio_subject AS (SELECT id FROM public.subjects WHERE name = 'Biology' LIMIT 1)
INSERT INTO public.quizzes (title, subject_id, description, difficulty, time_limit, passing_score, allow_retake)
SELECT
  'Cell Biology Quiz',
  bio_subject.id,
  'Questions on cell structure, organelles, cell division and cellular processes.',
  'medium',
  25,
  60,
  TRUE
FROM bio_subject
ON CONFLICT DO NOTHING;

-- ============================================================
-- QUIZ QUESTIONS — Algebra Fundamentals
-- ============================================================
WITH quiz_id AS (SELECT id FROM public.quizzes WHERE title = 'Algebra Fundamentals Quiz' LIMIT 1)
INSERT INTO public.quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index)
SELECT q.id, v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.explanation, v.order_index
FROM quiz_id q,
(VALUES
  ('What is the value of x if 2x + 6 = 14?', '2', '4', '6', '8', 'b', 'Subtract 6 from both sides: 2x = 8, then divide by 2: x = 4', 1),
  ('Which of the following is a quadratic equation?', 'y = 2x + 1', 'y = x² + 3x - 4', 'y = 1/x', 'y = x³', 'b', 'A quadratic equation has degree 2, meaning the highest power of x is 2', 2),
  ('Simplify: 3(2x - 4) + 6', '6x - 6', '6x + 18', '6x - 6', '5x - 4', 'c', '3(2x-4)+6 = 6x - 12 + 6 = 6x - 6', 3),
  ('What is the slope of the line y = -3x + 7?', '7', '-3', '3', '-7', 'b', 'In y = mx + b, m is the slope. Here m = -3', 4),
  ('Solve: x² - 9 = 0', 'x = 3 only', 'x = -3 only', 'x = ±3', 'x = ±9', 'c', 'x² = 9, so x = √9 = ±3', 5),
  ('What is the y-intercept of y = 4x - 5?', '4', '-5', '5', '-4', 'b', 'In y = mx + b, b is the y-intercept. Here b = -5', 6),
  ('Factor: x² + 5x + 6', '(x+1)(x+6)', '(x+2)(x+3)', '(x-2)(x-3)', '(x+6)(x-1)', 'b', 'Find two numbers that multiply to 6 and add to 5: 2 and 3', 7),
  ('If f(x) = 2x² - 3, what is f(3)?', '12', '15', '9', '18', 'b', 'f(3) = 2(3²) - 3 = 2(9) - 3 = 18 - 3 = 15', 8),
  ('What is 5! (5 factorial)?', '25', '100', '120', '60', 'c', '5! = 5 × 4 × 3 × 2 × 1 = 120', 9),
  ('Which inequality is represented by x ≥ -2?', 'x is less than -2', 'x equals -2', 'x is greater than or equal to -2', 'x is less than or equal to -2', 'c', 'The symbol ≥ means "greater than or equal to"', 10)
) AS v(question, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index);

-- ============================================================
-- QUIZ QUESTIONS — Programming Basics
-- ============================================================
WITH quiz_id AS (SELECT id FROM public.quizzes WHERE title = 'Programming Basics Quiz' LIMIT 1)
INSERT INTO public.quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index)
SELECT q.id, v.question, v.option_a, v.option_b, v.option_c, v.option_d, v.correct_answer, v.explanation, v.order_index
FROM quiz_id q,
(VALUES
  ('What does a variable store in programming?', 'A fixed value that never changes', 'A named location that holds a value', 'A type of function', 'A loop counter', 'b', 'A variable is a named storage location in memory that holds a value which can change', 1),
  ('Which loop runs at least once?', 'for loop', 'while loop', 'do-while loop', 'foreach loop', 'c', 'A do-while loop executes the body first, then checks the condition, so it always runs at least once', 2),
  ('What is the output of: print(2 ** 3) in Python?', '5', '6', '8', '9', 'c', '2 ** 3 means 2 raised to the power of 3 = 8', 3),
  ('What data type stores True or False values?', 'Integer', 'String', 'Boolean', 'Float', 'c', 'Boolean data type stores True or False values', 4),
  ('What does an array/list store?', 'A single value', 'Multiple values of the same type', 'A collection of items', 'Key-value pairs', 'c', 'An array stores a collection of items in an ordered sequence', 5),
  ('What is a function in programming?', 'A loop structure', 'A reusable block of code', 'A variable declaration', 'A data type', 'b', 'A function is a reusable block of code that performs a specific task', 6),
  ('What does "if-else" represent?', 'A loop', 'Conditional logic', 'A function call', 'Variable assignment', 'b', 'if-else statements implement conditional logic — different code runs based on a condition', 7),
  ('Which symbol is commonly used for single-line comments in Python?', '//', '/*', '#', '--', 'c', 'Python uses # for single-line comments', 8),
  ('What is recursion?', 'A loop that runs forever', 'A function that calls itself', 'A type of variable', 'A data structure', 'b', 'Recursion is when a function calls itself, usually with a modified argument, until a base case is reached', 9),
  ('What does IDE stand for?', 'Integrated Development Environment', 'Internal Data Exchange', 'Integrated Design Extension', 'Internet Development Engine', 'a', 'IDE stands for Integrated Development Environment — a software for writing and testing code', 10)
) AS v(question, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index);

-- ============================================================
-- ADMIN ACCOUNT CREATION INSTRUCTIONS
-- ============================================================
-- After running this seed script:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: admin@vsg.edu
-- 4. Password: Admin@VSG2024!  (change this in production!)
-- 5. Click "Create user"
-- 6. Copy the new user's UUID
-- 7. Run this command in SQL Editor (replace <UUID> with the actual UUID):
--
--   UPDATE public.profiles 
--   SET role = 'admin', full_name = 'System Administrator'
--   WHERE user_id = '<UUID>';
--
-- OR use the convenience function below (run after creating the user):
-- SELECT public.make_admin('<UUID>');
-- ============================================================

CREATE OR REPLACE FUNCTION public.make_admin(uid UUID)
RETURNS VOID AS $$
  UPDATE public.profiles SET role = 'admin', full_name = 'System Administrator' WHERE user_id = uid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- VIEW: Student Stats (useful for admin dashboard)
-- ============================================================
CREATE OR REPLACE VIEW public.student_stats AS
SELECT
  p.user_id,
  p.full_name,
  p.course,
  p.year_of_study,
  p.study_streak,
  p.created_at as registered_at,
  COUNT(DISTINCT gm.group_id) as group_count,
  COUNT(DISTINCT qa.id) as quiz_attempts,
  COUNT(DISTINCT lg.id) as goals_count,
  AVG(qa.percentage) as avg_quiz_score
FROM public.profiles p
LEFT JOIN public.group_members gm ON gm.user_id = p.user_id
LEFT JOIN public.quiz_attempts qa ON qa.user_id = p.user_id AND qa.completed_at IS NOT NULL
LEFT JOIN public.learning_goals lg ON lg.user_id = p.user_id
WHERE p.role = 'student'
GROUP BY p.user_id, p.full_name, p.course, p.year_of_study, p.study_streak, p.created_at;
