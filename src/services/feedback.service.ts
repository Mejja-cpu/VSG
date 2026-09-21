import { supabase } from '@/lib/supabase'
import type { PeerFeedback } from '@/types'

// ── Give feedback ──────────────────────────────────────────────
export async function giveFeedback(
  data: {
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
  }
): Promise<PeerFeedback> {
  const { data: feedback, error } = await supabase
    .from('peer_feedback')
    .insert(data)
    .select(`
      *,
      reviewer:profiles!peer_feedback_reviewer_id_fkey(user_id, full_name, profile_image),
      reviewed_user:profiles!peer_feedback_reviewed_user_id_fkey(user_id, full_name, profile_image)
    `)
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('You have already given feedback to this person for this session.')
    throw error
  }

  // Notify the person receiving feedback
  await supabase.from('notifications').insert({
    user_id: data.reviewed_user_id,
    title: 'New Peer Feedback Received',
    message: 'A fellow student has given you feedback. Check your feedback page to view it.',
    type: 'feedback',
    related_id: feedback.id,
    related_type: 'feedback',
  })

  // Check for "Helpful Peer" achievement
  const { count } = await supabase
    .from('peer_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', data.reviewer_id)

  if ((count ?? 0) >= 5) {
    await awardAchievement(data.reviewer_id, 'Helpful Peer')
  }

  return feedback as PeerFeedback
}

// ── Get feedback received by a user ───────────────────────────
export async function getReceivedFeedback(userId: string): Promise<PeerFeedback[]> {
  const { data, error } = await supabase
    .from('peer_feedback')
    .select(`
      *,
      reviewer:profiles!peer_feedback_reviewer_id_fkey(user_id, full_name, profile_image),
      session:study_sessions(id, title, session_date)
    `)
    .eq('reviewed_user_id', userId)
    .eq('is_reported', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PeerFeedback[]
}

// ── Get feedback given by a user ──────────────────────────────
export async function getGivenFeedback(userId: string): Promise<PeerFeedback[]> {
  const { data, error } = await supabase
    .from('peer_feedback')
    .select(`
      *,
      reviewed_user:profiles!peer_feedback_reviewed_user_id_fkey(user_id, full_name, profile_image),
      session:study_sessions(id, title, session_date)
    `)
    .eq('reviewer_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PeerFeedback[]
}

// ── Get feedback for a session ────────────────────────────────
export async function getSessionFeedback(sessionId: string): Promise<PeerFeedback[]> {
  const { data, error } = await supabase
    .from('peer_feedback')
    .select(`
      *,
      reviewer:profiles!peer_feedback_reviewer_id_fkey(user_id, full_name, profile_image),
      reviewed_user:profiles!peer_feedback_reviewed_user_id_fkey(user_id, full_name, profile_image)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as PeerFeedback[]
}

// ── Report feedback ───────────────────────────────────────────
export async function reportFeedback(
  feedbackId: string,
  reporterId: string,
  reason: string
): Promise<void> {
  await supabase.from('peer_feedback').update({ is_reported: true }).eq('id', feedbackId)

  await supabase.from('reports').insert({
    reporter_id: reporterId,
    content_type: 'feedback',
    content_id: feedbackId,
    reason,
  })
}

// ── Compute average rating for a user ────────────────────────
export function computeAverageRating(feedback: PeerFeedback[]): number {
  if (feedback.length === 0) return 0
  const total = feedback.reduce((sum, f) => sum + f.rating, 0)
  return Math.round((total / feedback.length) * 10) / 10
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
