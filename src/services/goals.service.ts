import { supabase } from '@/lib/supabase'
import type { LearningGoal, GoalStatus } from '@/types'

// ── Create a goal ─────────────────────────────────────────────
export async function createGoal(
  userId: string,
  data: {
    title: string
    description?: string
    subject_id?: string
    target_date?: string
    priority?: 'low' | 'medium' | 'high'
  }
): Promise<LearningGoal> {
  const { data: goal, error } = await supabase
    .from('learning_goals')
    .insert({
      ...data,
      user_id: userId,
      status: 'not_started',
      progress: 0,
    })
    .select(`*, subject:subjects(id, name, icon, color)`)
    .single()

  if (error) throw error

  // Award "Goal Setter" achievement if first goal
  const { data: existingGoals } = await supabase
    .from('learning_goals')
    .select('id')
    .eq('user_id', userId)

  if (existingGoals && existingGoals.length === 1) {
    await awardAchievement(userId, 'Goal Setter')
  }

  return goal as LearningGoal
}

// ── Get all goals for a user ──────────────────────────────────
export async function getUserGoals(userId: string): Promise<LearningGoal[]> {
  const { data, error } = await supabase
    .from('learning_goals')
    .select(`*, subject:subjects(id, name, icon, color)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Auto-update overdue status
  const today = new Date().toISOString().split('T')[0]
  const goals = data as LearningGoal[]

  const overdueIds = goals
    .filter((g) => g.target_date && g.target_date < today && g.status !== 'completed' && g.status !== 'overdue')
    .map((g) => g.id)

  if (overdueIds.length > 0) {
    await supabase
      .from('learning_goals')
      .update({ status: 'overdue' })
      .in('id', overdueIds)

    return goals.map((g) => ({
      ...g,
      status: overdueIds.includes(g.id) ? 'overdue' : g.status,
    }))
  }

  return goals
}

// ── Update goal progress ──────────────────────────────────────
export async function updateGoalProgress(
  goalId: string,
  userId: string,
  progress: number,
  status?: GoalStatus
): Promise<LearningGoal> {
  const newStatus = status ?? (progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started')

  const { data, error } = await supabase
    .from('learning_goals')
    .update({ progress, status: newStatus })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select(`*, subject:subjects(id, name, icon, color)`)
    .single()

  if (error) throw error

  // Check achievement for completing goals
  if (newStatus === 'completed') {
    const { data: completedGoals } = await supabase
      .from('learning_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if ((completedGoals?.length ?? 0) >= 3) {
      await awardAchievement(userId, 'Goal Achiever')
    }
  }

  return data as LearningGoal
}

// ── Update goal ───────────────────────────────────────────────
export async function updateGoal(
  goalId: string,
  userId: string,
  updates: Partial<LearningGoal>
): Promise<LearningGoal> {
  const { data, error } = await supabase
    .from('learning_goals')
    .update(updates)
    .eq('id', goalId)
    .eq('user_id', userId)
    .select(`*, subject:subjects(id, name, icon, color)`)
    .single()

  if (error) throw error
  return data as LearningGoal
}

// ── Delete a goal ─────────────────────────────────────────────
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Get goal statistics ───────────────────────────────────────
export function computeGoalStats(goals: LearningGoal[]) {
  return {
    total: goals.length,
    completed: goals.filter((g) => g.status === 'completed').length,
    active: goals.filter((g) => g.status === 'in_progress').length,
    notStarted: goals.filter((g) => g.status === 'not_started').length,
    overdue: goals.filter((g) => g.status === 'overdue').length,
    completionPercentage:
      goals.length > 0
        ? Math.round((goals.filter((g) => g.status === 'completed').length / goals.length) * 100)
        : 0,
  }
}

// ── Helper: award achievement ─────────────────────────────────
async function awardAchievement(userId: string, achievementName: string) {
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('name', achievementName)
    .single()

  if (!achievement) return

  await supabase
    .from('student_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievement.id },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
}
