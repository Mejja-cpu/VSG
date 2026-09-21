import { supabase } from '@/lib/supabase'
import type { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from '@/types'

// ── Browse quizzes ────────────────────────────────────────────
export async function getQuizzes(filters?: {
  subject_id?: string
  difficulty?: string
  search?: string
  group_id?: string
}): Promise<Quiz[]> {
  let query = supabase
    .from('quizzes')
    .select(`
      *,
      subject:subjects(id, name, icon, color)
    `)
    .eq('is_active', true)

  if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id)
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters?.group_id) query = query.eq('group_id', filters.group_id)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error

  // Add question count
  const quizIds = data?.map((q) => q.id) ?? []
  if (quizIds.length > 0) {
    const { data: counts } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds)

    const countMap: Record<string, number> = {}
    counts?.forEach((c) => {
      countMap[c.quiz_id] = (countMap[c.quiz_id] || 0) + 1
    })

    return data?.map((q) => ({ ...q, question_count: countMap[q.id] || 0 })) as Quiz[]
  }

  return data as Quiz[]
}

// ── Get a single quiz with questions ─────────────────────────
export async function getQuizWithQuestions(quizId: string): Promise<{
  quiz: Quiz
  questions: QuizQuestion[]
}> {
  const [quizRes, questionsRes] = await Promise.all([
    supabase
      .from('quizzes')
      .select(`*, subject:subjects(id, name, icon, color)`)
      .eq('id', quizId)
      .single(),
    supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true }),
  ])

  if (quizRes.error) throw quizRes.error
  if (questionsRes.error) throw questionsRes.error

  return {
    quiz: quizRes.data as Quiz,
    questions: questionsRes.data as QuizQuestion[],
  }
}

// ── Start a quiz attempt ──────────────────────────────────────
export async function startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', quizId)

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      user_id: userId,
      total_questions: questions?.length ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as QuizAttempt
}

// ── Submit quiz answers ───────────────────────────────────────
export async function submitQuiz(
  attemptId: string,
  quizId: string,
  userId: string,
  answers: Array<{ questionId: string; selectedAnswer: 'a' | 'b' | 'c' | 'd' | null }>,
  timeTaken: number
): Promise<QuizAttempt> {
  // Fetch correct answers
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer, points')
    .eq('quiz_id', quizId)

  const correctMap: Record<string, { answer: string; points: number }> = {}
  questions?.forEach((q) => {
    correctMap[q.id] = { answer: q.correct_answer, points: q.points }
  })

  let score = 0
  const quizAnswers: Omit<QuizAnswer, 'id' | 'created_at'>[] = []

  for (const ans of answers) {
    const isCorrect = !!ans.selectedAnswer && correctMap[ans.questionId]?.answer === ans.selectedAnswer
    if (isCorrect) score += correctMap[ans.questionId]?.points ?? 1

    quizAnswers.push({
      attempt_id: attemptId,
      question_id: ans.questionId,
      selected_answer: ans.selectedAnswer ?? undefined,
      is_correct: isCorrect,
    })
  }

  const totalQuestions = questions?.length ?? 1
  const percentage = Math.round((score / totalQuestions) * 100)

  // Get passing score
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('passing_score')
    .eq('id', quizId)
    .single()

  const passed = percentage >= (quiz?.passing_score ?? 60)

  // Insert answers
  await supabase.from('quiz_answers').insert(quizAnswers)

  // Update attempt
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .update({
      score,
      percentage,
      passed,
      time_taken: timeTaken,
      completed_at: new Date().toISOString(),
      total_questions: totalQuestions,
    })
    .eq('id', attemptId)
    .select(`
      *,
      quiz:quizzes(id, title, passing_score, subject:subjects(name))
    `)
    .single()

  if (error) throw error

  // Check for achievements
  await checkQuizAchievements(userId)

  return attempt as QuizAttempt
}

// ── Get quiz attempt with answers ─────────────────────────────
export async function getQuizAttemptResult(attemptId: string): Promise<QuizAttempt> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quiz:quizzes(*, subject:subjects(name, icon)),
      answers:quiz_answers(
        *,
        question:quiz_questions(*)
      )
    `)
    .eq('id', attemptId)
    .single()

  if (error) throw error
  return data as QuizAttempt
}

// ── Submit quiz attempt (simplified version for QuizzesPage) ───
export async function submitQuizAttempt(data: {
  quiz_id: string
  user_id: string
  score: number
  total_questions: number
  correct_answers: number
  started_at: string
  answers: Array<{ question_id: string; selected_answer: string; is_correct: boolean }>
}): Promise<QuizAttempt> {
  // First create the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: data.quiz_id,
      user_id: data.user_id,
      score: data.score,
      percentage: data.score,
      total_questions: data.total_questions,
      passed: data.score >= 60, // Default passing threshold
      time_taken: Math.floor((new Date().getTime() - new Date(data.started_at).getTime()) / 1000),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (attemptError) throw attemptError

  // Insert answers
  const quizAnswers = data.answers.map((ans) => ({
    attempt_id: attempt.id,
    question_id: ans.question_id,
    selected_answer: ans.selected_answer,
    is_correct: ans.is_correct,
  }))

  const { error: answersError } = await supabase
    .from('quiz_answers')
    .insert(quizAnswers)

  if (answersError) throw answersError

  // Check for achievements
  await checkQuizAchievements(data.user_id)

  return attempt as QuizAttempt
}

// ── Get quiz attempts for a user ───────────────────────────────
export async function getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quiz:quizzes(id, title, subject:subjects(name, icon, color))
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data as QuizAttempt[]
}

// ── Get user's quiz history ───────────────────────────────────
export async function getUserQuizHistory(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      quiz:quizzes(id, title, subject:subjects(name, icon, color))
    `)
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data as QuizAttempt[]
}

// ── Check and award quiz achievements ────────────────────────
async function checkQuizAchievements(userId: string) {
  const { data: completedAttempts } = await supabase
    .from('quiz_attempts')
    .select('id, percentage')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  const count = completedAttempts?.length ?? 0
  const hasHighScore = completedAttempts?.some((a) => a.percentage >= 90)

  const milestones = [
    { count: 1, achievementName: 'Quiz Starter' },
    { count: 5, achievementName: 'Quiz Enthusiast' },
    { count: 10, achievementName: 'Quiz Master' },
  ]

  for (const { count: milestone, achievementName } of milestones) {
    if (count >= milestone) {
      await awardAchievement(userId, achievementName)
    }
  }

  if (hasHighScore) {
    await awardAchievement(userId, 'High Scorer')
  }
}

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
