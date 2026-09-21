import { supabase } from '@/lib/supabase'
import type { DashboardStats, ProgressData } from '@/types'

// ── Get dashboard stats for a student ────────────────────────
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  const [
    groupRes,
    sessionRes,
    quizRes,
    goalRes,
    streakRes,
  ] = await Promise.all([
    // Group count
    supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Upcoming sessions
    supabase
      .from('session_participants')
      .select('session_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .filter('session.session_date', 'gte', today),

    // Quiz stats
    supabase
      .from('quiz_attempts')
      .select('percentage, passed')
      .eq('user_id', userId)
      .not('completed_at', 'is', null),

    // Goal stats
    supabase
      .from('learning_goals')
      .select('status')
      .eq('user_id', userId),

    // Study streak
    supabase
      .from('profiles')
      .select('study_streak')
      .eq('user_id', userId)
      .single(),
  ])

  const quizAttempts = quizRes.data ?? []
  const goals = goalRes.data ?? []
  const completedGoals = goals.filter((g) => g.status === 'completed').length
  const avgScore =
    quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / quizAttempts.length)
      : 0

  return {
    groupCount: groupRes.count ?? 0,
    upcomingSessions: sessionRes.count ?? 0,
    completedQuizzes: quizAttempts.length,
    averageQuizScore: avgScore,
    goalCompletion: goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0,
    studyStreak: streakRes.data?.study_streak ?? 0,
    totalGoals: goals.length,
    completedGoals,
  }
}

// ── Get full progress data ────────────────────────────────────
export async function getProgressData(userId: string): Promise<ProgressData> {
  const [quizRes, goalRes, sessionRes, achievementRes] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:quizzes(id, title, subject:subjects(name, icon, color))
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true }),

    supabase
      .from('learning_goals')
      .select(`*, subject:subjects(id, name, icon, color)`)
      .eq('user_id', userId),

    supabase
      .from('session_participants')
      .select(`
        attendance_status,
        session:study_sessions(
          id, title, session_date,
          group:study_groups(name),
          subject:subjects(name)
        )
      `)
      .eq('user_id', userId),

    supabase
      .from('student_achievements')
      .select(`*, achievement:achievements(*)`)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false }),
  ])

  return {
    quizAttempts: (quizRes.data ?? []) as ProgressData['quizAttempts'],
    goals: (goalRes.data ?? []) as ProgressData['goals'],
    sessions: (sessionRes.data ?? []).filter((sp) => sp.session).map((sp) => ({
      ...(sp.session as object),
      user_attendance: sp.attendance_status,
    })) as ProgressData['sessions'],
    achievements: (achievementRes.data ?? []) as ProgressData['achievements'],
  }
}

// ── Update study streak ───────────────────────────────────────
export async function updateStudyStreak(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('study_streak, last_active')
    .eq('user_id', userId)
    .single()

  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (profile.last_active === today) return // Already updated today

  const newStreak =
    profile.last_active === yesterday
      ? (profile.study_streak ?? 0) + 1
      : 1

  await supabase
    .from('profiles')
    .update({ study_streak: newStreak, last_active: today })
    .eq('user_id', userId)

  // Check streak achievements
  const streakAchievements = [
    { threshold: 7, name: 'Study Streak 7' },
    { threshold: 14, name: 'Consistent Learner' },
    { threshold: 30, name: 'Study Streak 30' },
  ]

  for (const { threshold, name } of streakAchievements) {
    if (newStreak >= threshold) {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('name', name)
        .single()

      if (achievement) {
        await supabase
          .from('student_achievements')
          .upsert(
            { user_id: userId, achievement_id: achievement.id },
            { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
          )
      }
    }
  }
}

// ── Compute quiz improvement percentage ───────────────────────
export function computeImprovementPercentage(attempts: Array<{ percentage: number }>): number {
  if (attempts.length < 2) return 0
  const first = attempts[0].percentage
  const last = attempts[attempts.length - 1].percentage
  if (first === 0) return 0
  return Math.round(((last - first) / first) * 100)
}
