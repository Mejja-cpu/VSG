import { supabase } from '@/lib/supabase'
import type { 
  Profile, Subject, StudyGroup, Quiz, QuizQuestion, 
  Report, ActivityLog, AdminStats 
} from '@/types'

// ── ADMIN STATS ───────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminStats> {
  const [
    studentsRes, activeStudentsRes, groupsRes, subjectsRes,
    quizzesRes, sessionsRes, resourcesRes, reportsRes, completedQuizzesRes
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
      .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase.from('study_groups').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('study_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
  ])

  return {
    totalStudents: studentsRes.count ?? 0,
    activeStudents: activeStudentsRes.count ?? 0,
    totalGroups: groupsRes.count ?? 0,
    totalSubjects: subjectsRes.count ?? 0,
    totalQuizzes: quizzesRes.count ?? 0,
    totalSessions: sessionsRes.count ?? 0,
    totalResources: resourcesRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
    completedQuizzes: completedQuizzesRes.count ?? 0,
  }
}

// ── STUDENT MANAGEMENT ────────────────────────────────────────
export async function getStudents(search?: string) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,course.ilike.%${search}%`)
  }

  const { data, error } = await query.limit(100)
  if (error) throw error
  return data as Profile[]
}

export async function deactivateStudent(userId: string): Promise<void> {
  await supabase.auth.admin.updateUserById(userId, { ban_duration: 'indefinite' })
  await logActivity('student_deactivated', `Student account deactivated`, { user_id: userId })
}

export async function activateStudent(userId: string): Promise<void> {
  await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })
  await logActivity('student_activated', `Student account activated`, { user_id: userId })
}

// ── SUBJECT MANAGEMENT ────────────────────────────────────────
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Subject[]
}

export async function createSubject(data: {
  name: string
  description?: string
  icon?: string
  color?: string
}): Promise<Subject> {
  const { data: subject, error } = await supabase
    .from('subjects')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  await logActivity('subject_created', `Subject "${data.name}" created`)
  return subject as Subject
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const { data: subject, error } = await supabase
    .from('subjects')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return subject as Subject
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// ── GROUP MANAGEMENT ──────────────────────────────────────────
export async function adminGetGroups(search?: string): Promise<StudyGroup[]> {
  let query = supabase
    .from('study_groups')
    .select(`
      *,
      subject:subjects(id, name, icon),
      owner:profiles!study_groups_owner_id_fkey(full_name, course)
    `)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query.limit(100)
  if (error) throw error
  return data as StudyGroup[]
}

export async function adminRemoveGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('study_groups')
    .update({ is_active: false })
    .eq('id', groupId)

  if (error) throw error
  await logActivity('group_removed', `Study group removed by admin`, { group_id: groupId })
}

// ── QUIZ MANAGEMENT ───────────────────────────────────────────
export async function adminGetQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`*, subject:subjects(name, icon, color)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Quiz[]
}

export async function adminCreateQuiz(
  createdBy: string,
  data: {
    title: string
    subject_id?: string
    description?: string
    difficulty: 'easy' | 'medium' | 'hard'
    time_limit: number
    passing_score: number
    allow_retake: boolean
  }
): Promise<Quiz> {
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .insert({ ...data, created_by: createdBy })
    .select()
    .single()

  if (error) throw error
  await logActivity('quiz_created', `Quiz "${data.title}" created`)
  return quiz as Quiz
}

export async function adminUpdateQuiz(id: string, data: Partial<Quiz>): Promise<void> {
  const { error } = await supabase.from('quizzes').update(data).eq('id', id)
  if (error) throw error
}

export async function adminDeleteQuiz(id: string): Promise<void> {
  const { error } = await supabase.from('quizzes').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

// ── QUESTION MANAGEMENT ───────────────────────────────────────
export async function adminGetQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as QuizQuestion[]
}

export async function adminAddQuestion(data: Omit<QuizQuestion, 'id' | 'created_at'>): Promise<QuizQuestion> {
  const { data: question, error } = await supabase
    .from('quiz_questions')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return question as QuizQuestion
}

export async function adminUpdateQuestion(id: string, data: Partial<QuizQuestion>): Promise<void> {
  const { error } = await supabase.from('quiz_questions').update(data).eq('id', id)
  if (error) throw error
}

export async function adminDeleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
  if (error) throw error
}

// ── REPORTS MANAGEMENT ────────────────────────────────────────
export async function getReports(status?: Report['status']): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(full_name, profile_image),
      reported_user:profiles!reports_reported_user_id_fkey(full_name, profile_image)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query.limit(100)
  if (error) throw error
  return data as Report[]
}

export async function updateReportStatus(
  reportId: string,
  status: Report['status'],
  adminNotes?: string,
  resolvedBy?: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ status, admin_notes: adminNotes, resolved_by: resolvedBy })
    .eq('id', reportId)

  if (error) throw error
  await logActivity('report_resolved', `Report ${reportId} marked as ${status}`)
}

// ── ACTIVITY LOGS ─────────────────────────────────────────────
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`*, admin:profiles!activity_logs_admin_id_fkey(full_name)`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return data as ActivityLog[]
}

async function logActivity(action: string, description: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('activity_logs').insert({
    admin_id: user?.id,
    action,
    description,
    metadata,
  })
}

// ── Admin send notification to all students ──────────────────
export async function sendBroadcastNotification(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success'
): Promise<void> {
  const { data: students } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'student')

  if (!students || students.length === 0) return

  const notifications = students.map((s) => ({
    user_id: s.user_id,
    title,
    message,
    type,
  }))

  // Insert in batches of 100
  for (let i = 0; i < notifications.length; i += 100) {
    await supabase.from('notifications').insert(notifications.slice(i, i + 100))
  }

  await logActivity('broadcast_notification', `Broadcast: "${title}"`)
}
