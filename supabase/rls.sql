-- ============================================================
-- Virtual Study Group System — Row Level Security Policies
-- Run this AFTER schema.sql (Step 2 of 3)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
-- Anyone authenticated can read profiles (for group member lists, etc.)
CREATE POLICY "profiles_read_authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile; admins can update any
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    -- Prevent students from changing their own role
    (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- Users can insert their own profile (handled by trigger, but allow as fallback)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE POLICY "subjects_read_all" ON public.subjects
  FOR SELECT USING (TRUE);

CREATE POLICY "subjects_manage_admin" ON public.subjects
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- USER_SUBJECTS
-- ============================================================
CREATE POLICY "user_subjects_read_own" ON public.user_subjects
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_subjects_manage_own" ON public.user_subjects
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STUDY GROUPS
-- ============================================================
-- Public groups visible to all authenticated users
CREATE POLICY "groups_read_public" ON public.study_groups
  FOR SELECT USING (
    visibility = 'public' 
    OR auth.uid() = owner_id
    OR public.is_group_member(id, auth.uid())
    OR public.is_admin(auth.uid())
  );

-- Only authenticated users can create groups
CREATE POLICY "groups_insert_authenticated" ON public.study_groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

-- Owner or admin can update
CREATE POLICY "groups_update_owner" ON public.study_groups
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- Owner or admin can delete
CREATE POLICY "groups_delete_owner" ON public.study_groups
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin(auth.uid()));

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
CREATE POLICY "group_members_read" ON public.group_members
  FOR SELECT USING (
    public.is_group_member(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    auth.uid() = user_id  -- member can leave
    OR public.is_group_moderator(group_id, auth.uid())  -- moderator can remove
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "group_members_update" ON public.group_members
  FOR UPDATE USING (
    public.is_group_moderator(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

-- ============================================================
-- GROUP JOIN REQUESTS
-- ============================================================
CREATE POLICY "join_requests_read" ON public.group_join_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_group_moderator(group_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "join_requests_insert" ON public.group_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "join_requests_update" ON public.group_join_requests
  FOR UPDATE USING (
    public.is_group_moderator(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "join_requests_delete" ON public.group_join_requests
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_group_moderator(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "messages_read_members" ON public.messages
  FOR SELECT USING (
    public.is_group_member(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "messages_insert_members" ON public.messages
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id, auth.uid()) AND auth.uid() = sender_id
  );

-- Users can only update (soft-delete) their own messages
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR public.is_group_moderator(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "messages_delete_admin" ON public.messages
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- RESOURCES
-- ============================================================
CREATE POLICY "resources_read" ON public.resources
  FOR SELECT USING (
    group_id IS NULL  -- subject-wide resources
    OR public.is_group_member(group_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "resources_insert" ON public.resources
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND (
      group_id IS NULL OR public.is_group_member(group_id, auth.uid())
    )
  );

CREATE POLICY "resources_update_own" ON public.resources
  FOR UPDATE USING (
    auth.uid() = uploaded_by OR public.is_admin(auth.uid())
  );

CREATE POLICY "resources_delete_own" ON public.resources
  FOR DELETE USING (
    auth.uid() = uploaded_by OR public.is_admin(auth.uid())
  );

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
CREATE POLICY "sessions_read" ON public.study_sessions
  FOR SELECT USING (
    public.is_group_member(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "sessions_insert" ON public.study_sessions
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id, auth.uid()) AND auth.uid() = organizer_id
  );

CREATE POLICY "sessions_update" ON public.study_sessions
  FOR UPDATE USING (
    auth.uid() = organizer_id OR public.is_group_moderator(group_id, auth.uid()) OR public.is_admin(auth.uid())
  );

CREATE POLICY "sessions_delete" ON public.study_sessions
  FOR DELETE USING (
    auth.uid() = organizer_id OR public.is_admin(auth.uid())
  );

-- ============================================================
-- SESSION PARTICIPANTS
-- ============================================================
CREATE POLICY "session_participants_read" ON public.session_participants
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.study_sessions ss
      WHERE ss.id = session_id AND (public.is_group_member(ss.group_id, auth.uid()) OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "session_participants_manage" ON public.session_participants
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.study_sessions ss
      WHERE ss.id = session_id AND (ss.organizer_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- ============================================================
-- LEARNING GOALS
-- ============================================================
CREATE POLICY "goals_own" ON public.learning_goals
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE POLICY "quizzes_read" ON public.quizzes
  FOR SELECT USING (
    is_active = TRUE OR public.is_admin(auth.uid())
  );

CREATE POLICY "quizzes_manage_admin" ON public.quizzes
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
CREATE POLICY "quiz_questions_read" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND (is_active = TRUE OR public.is_admin(auth.uid())))
  );

CREATE POLICY "quiz_questions_manage_admin" ON public.quiz_questions
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================
-- QUIZ ANSWERS
-- ============================================================
CREATE POLICY "quiz_answers_own" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts WHERE id = attempt_id AND user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- PEER FEEDBACK
-- ============================================================
-- Users can see feedback they gave or received
CREATE POLICY "feedback_read" ON public.peer_feedback
  FOR SELECT USING (
    auth.uid() = reviewer_id OR auth.uid() = reviewed_user_id OR public.is_admin(auth.uid())
  );

CREATE POLICY "feedback_insert" ON public.peer_feedback
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != reviewed_user_id);

-- Users cannot edit feedback they gave (immutable except for reporting)
CREATE POLICY "feedback_update_admin" ON public.peer_feedback
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE POLICY "achievements_read_all" ON public.achievements
  FOR SELECT USING (TRUE);

CREATE POLICY "achievements_manage_admin" ON public.achievements
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- STUDENT ACHIEVEMENTS
-- ============================================================
CREATE POLICY "student_achievements_read" ON public.student_achievements
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "student_achievements_insert" ON public.student_achievements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- REPORTS
-- ============================================================
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_read_own" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin(auth.uid()));

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE POLICY "activity_logs_admin" ON public.activity_logs
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- Storage Buckets (run these in Supabase dashboard or here)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', FALSE) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('group-images', 'group-images', TRUE) ON CONFLICT DO NOTHING;

-- Storage RLS
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "resources_read_auth" ON storage.objects FOR SELECT USING (bucket_id = 'resources' AND auth.role() = 'authenticated');
CREATE POLICY "resources_upload_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "group_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'group-images');
CREATE POLICY "group_images_upload_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'group-images' AND auth.role() = 'authenticated');
