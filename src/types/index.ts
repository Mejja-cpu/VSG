// ============================================================
// TypeScript Interfaces for all database entities
// ============================================================

export type Role = 'student' | 'admin'
export type Visibility = 'public' | 'private'
export type StudyLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'
export type GoalPriority = 'low' | 'medium' | 'high'
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'
export type AttendanceStatus = 'invited' | 'confirmed' | 'attended' | 'absent'
export type ResourceType = 'pdf' | 'document' | 'image' | 'link' | 'video' | 'other'
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'session_reminder' | 'group_invite' | 'feedback' | 'quiz' | 'goal' | 'message' | 'join_request' | 'join_approved'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'
export type ContentType = 'message' | 'resource' | 'group' | 'feedback' | 'user' | 'other'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type MemberRole = 'owner' | 'moderator' | 'member'
export type CorrectAnswer = 'a' | 'b' | 'c' | 'd'

// ── Profile ──────────────────────────────────────────────────
export interface Profile {
  id: string
  user_id: string
  role: Role
  full_name: string
  student_id?: string
  course?: string
  year_of_study?: number
  profile_image?: string
  bio?: string
  study_streak: number
  last_active?: string
  notification_preferences: {
    email: boolean
    push: boolean
    session_reminders: boolean
    group_invites: boolean
    feedback: boolean
    quiz_results: boolean
  }
  created_at: string
  updated_at: string
}

// ── Subject ───────────────────────────────────────────────────
export interface Subject {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
}

// ── UserSubject ───────────────────────────────────────────────
export interface UserSubject {
  id: string
  user_id: string
  subject_id: string
  created_at: string
  subject?: Subject
}

// ── StudyGroup ────────────────────────────────────────────────
export interface StudyGroup {
  id: string
  name: string
  subject_id?: string
  description?: string
  owner_id: string
  max_members: number
  visibility: Visibility
  study_level: StudyLevel
  course?: string
  group_image?: string
  study_objectives?: string
  is_active: boolean
  member_count: number
  created_at: string
  updated_at: string
  subject?: Subject
  owner?: Profile
  is_member?: boolean
  member_role?: MemberRole
}

// ── GroupMember ───────────────────────────────────────────────
export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
}

// ── GroupJoinRequest ──────────────────────────────────────────
export interface GroupJoinRequest {
  id: string
  group_id: string
  user_id: string
  message?: string
  status: RequestStatus
  created_at: string
  updated_at: string
  profile?: Profile
  group?: StudyGroup
}

// ── Message ───────────────────────────────────────────────────
export interface Message {
  id: string
  group_id: string
  sender_id: string
  message: string
  reply_to?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  sender?: Profile
  reply_message?: Message
}

// ── Resource ──────────────────────────────────────────────────
export interface Resource {
  id: string
  group_id?: string
  subject_id?: string
  uploaded_by: string
  title: string
  description?: string
  file_url?: string
  external_url?: string
  resource_type: ResourceType
  topic?: string
  download_count: number
  is_active: boolean
  created_at: string
  uploader?: Profile
  subject?: Subject
}

// ── StudySession ──────────────────────────────────────────────
export interface StudySession {
  id: string
  group_id: string
  organizer_id: string
  title: string
  description?: string
  subject_id?: string
  session_date: string
  start_time: string
  end_time: string
  meeting_link?: string
  location?: string
  status: SessionStatus
  reminder_sent_24h: boolean
  reminder_sent_1h: boolean
  created_at: string
  updated_at: string
  group?: StudyGroup
  organizer?: Profile
  subject?: Subject
  participant_count?: number
  user_attendance?: AttendanceStatus
}

// ── SessionParticipant ────────────────────────────────────────
export interface SessionParticipant {
  id: string
  session_id: string
  user_id: string
  attendance_status: AttendanceStatus
  joined_at?: string
  profile?: Profile
}

// ── LearningGoal ──────────────────────────────────────────────
export interface LearningGoal {
  id: string
  user_id: string
  subject_id?: string
  title: string
  description?: string
  target_date?: string
  priority: GoalPriority
  progress: number
  status: GoalStatus
  created_at: string
  updated_at: string
  subject?: Subject
}

// ── Quiz ──────────────────────────────────────────────────────
export interface Quiz {
  id: string
  title: string
  subject_id?: string
  group_id?: string
  description?: string
  difficulty: QuizDifficulty
  time_limit: number
  passing_score: number
  created_by?: string
  is_active: boolean
  allow_retake: boolean
  created_at: string
  updated_at: string
  subject?: Subject
  question_count?: number
  user_attempts?: QuizAttempt[]
}

// ── QuizQuestion ──────────────────────────────────────────────
export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  option_a: string
  option_b: string
  option_c?: string
  option_d?: string
  correct_answer: CorrectAnswer
  explanation?: string
  points: number
  order_index: number
  created_at: string
}

// ── QuizAttempt ───────────────────────────────────────────────
export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  percentage: number
  time_taken?: number
  passed: boolean
  started_at: string
  completed_at?: string
  quiz?: Quiz
  answers?: QuizAnswer[]
}

// ── QuizAnswer ────────────────────────────────────────────────
export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_answer?: CorrectAnswer
  is_correct: boolean
  created_at: string
  question?: QuizQuestion
}

// ── PeerFeedback ──────────────────────────────────────────────
export interface PeerFeedback {
  id: string
  session_id?: string
  group_id?: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  participation_rating?: number
  collaboration_rating?: number
  helpfulness_rating?: number
  understanding_rating?: number
  comment?: string
  is_reported: boolean
  created_at: string
  reviewer?: Profile
  reviewed_user?: Profile
  session?: StudySession
}

// ── Notification ──────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
}

// ── Achievement ───────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
  created_at: string
}

// ── StudentAchievement ────────────────────────────────────────
export interface StudentAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  achievement?: Achievement
}

// ── Report ────────────────────────────────────────────────────
export interface Report {
  id: string
  reporter_id: string
  reported_user_id?: string
  content_type: ContentType
  content_id?: string
  reason: string
  description?: string
  status: ReportStatus
  admin_notes?: string
  resolved_by?: string
  created_at: string
  updated_at: string
  reporter?: Profile
  reported_user?: Profile
}

// ── ActivityLog ───────────────────────────────────────────────
export interface ActivityLog {
  id: string
  admin_id?: string
  action: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
  admin?: Profile
}

// ── Helper Types ──────────────────────────────────────────────
export interface DashboardStats {
  groupCount: number
  upcomingSessions: number
  completedQuizzes: number
  averageQuizScore: number
  goalCompletion: number
  studyStreak: number
  totalGoals: number
  completedGoals: number
}

export interface ProgressData {
  quizAttempts: QuizAttempt[]
  goals: LearningGoal[]
  sessions: StudySession[]
  achievements: StudentAchievement[]
}

export interface AdminStats {
  totalStudents: number
  activeStudents: number
  totalGroups: number
  totalSubjects: number
  totalQuizzes: number
  totalSessions: number
  totalResources: number
  pendingReports: number
  completedQuizzes: number
}
