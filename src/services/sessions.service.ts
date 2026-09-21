import { supabase } from '@/lib/supabase'
import type { StudySession, SessionParticipant } from '@/types'

// ── Create a study session ────────────────────────────────────
export async function createSession(
  data: {
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
  }
): Promise<StudySession> {
  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert(data)
    .select(`
      *,
      group:study_groups(id, name),
      subject:subjects(id, name, icon),
      organizer:profiles!study_sessions_organizer_id_fkey(user_id, full_name, profile_image)
    `)
    .single()

  if (error) throw error

  // Add organizer as participant
  await supabase.from('session_participants').insert({
    session_id: session.id,
    user_id: data.organizer_id,
    attendance_status: 'confirmed',
  })

  // Notify group members
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', data.group_id)
    .neq('user_id', data.organizer_id)

  if (members && members.length > 0) {
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      title: 'New Study Session Scheduled',
      message: `"${data.title}" has been scheduled for ${new Date(data.session_date).toLocaleDateString()} at ${data.start_time}.`,
      type: 'info' as const,
      related_id: session.id,
      related_type: 'session',
    }))

    await supabase.from('notifications').insert(notifications)

    // Also add them as invited participants
    const participantInvites = members.map((m) => ({
      session_id: session.id,
      user_id: m.user_id,
      attendance_status: 'invited' as const,
    }))
    await supabase.from('session_participants').insert(participantInvites)
  }

  return session as StudySession
}

// ── Get sessions for a group ──────────────────────────────────
export async function getGroupSessions(groupId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(`
      *,
      subject:subjects(id, name, icon),
      organizer:profiles!study_sessions_organizer_id_fkey(user_id, full_name, profile_image)
    `)
    .eq('group_id', groupId)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data as StudySession[]
}

// ── Get all upcoming sessions for a user ──────────────────────
export async function getUserUpcomingSessions(userId: string): Promise<StudySession[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      attendance_status,
      session:study_sessions(
        *,
        group:study_groups(id, name),
        subject:subjects(id, name, icon),
        organizer:profiles!study_sessions_organizer_id_fkey(user_id, full_name, profile_image)
      )
    `)
    .eq('user_id', userId)
    .gte('session.session_date', today)
    .order('session.session_date', { ascending: true })
    .limit(10)

  if (error) throw error

  return data
    ?.filter((sp) => sp.session)
    .map((sp) => ({
      ...(sp.session as unknown as StudySession),
      user_attendance: sp.attendance_status,
    })) ?? []
}

// ── Get all sessions for a user (past + upcoming) ────────────
export async function getAllUserSessions(userId: string): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      attendance_status,
      session:study_sessions(
        *,
        group:study_groups(id, name),
        subject:subjects(id, name, icon),
        organizer:profiles!study_sessions_organizer_id_fkey(user_id, full_name, profile_image)
      )
    `)
    .eq('user_id', userId)
    .order('session.session_date', { ascending: false })

  if (error) throw error

  return data
    ?.filter((sp) => sp.session)
    .map((sp) => ({
      ...(sp.session as unknown as StudySession),
      user_attendance: sp.attendance_status,
    })) ?? []
}

// ── Update session attendance ─────────────────────────────────
export async function updateAttendance(
  sessionId: string,
  userId: string,
  status: 'confirmed' | 'absent'
): Promise<void> {
  const { error } = await supabase
    .from('session_participants')
    .upsert(
      { session_id: sessionId, user_id: userId, attendance_status: status },
      { onConflict: 'session_id,user_id' }
    )

  if (error) throw error
}

// ── Get session participants ───────────────────────────────────
export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      *,
      profile:profiles!session_participants_user_id_fkey(user_id, full_name, profile_image, course)
    `)
    .eq('session_id', sessionId)

  if (error) throw error
  return data as SessionParticipant[]
}

// ── Cancel a session ──────────────────────────────────────────
export async function cancelSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (error) throw error
}

// ── Send session reminders (called periodically) ──────────────
export async function sendSessionReminders(): Promise<void> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)

  // Fetch upcoming sessions
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select(`
      id, title, session_date, start_time, reminder_sent_24h, reminder_sent_1h
    `)
    .eq('status', 'scheduled')
    .gte('session_date', now.toISOString().split('T')[0])

  if (!sessions) return

  for (const session of sessions) {
    const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`)

    // 24h reminder
    if (!session.reminder_sent_24h && sessionDateTime <= in24h && sessionDateTime > now) {
      const { data: participants } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', session.id)

      if (participants) {
        await supabase.from('notifications').insert(
          participants.map((p) => ({
            user_id: p.user_id,
            title: 'Study Session Tomorrow',
            message: `Reminder: "${session.title}" is scheduled for tomorrow at ${session.start_time}.`,
            type: 'session_reminder',
            related_id: session.id,
            related_type: 'session',
          }))
        )
      }
      await supabase
        .from('study_sessions')
        .update({ reminder_sent_24h: true })
        .eq('id', session.id)
    }

    // 1h reminder
    if (!session.reminder_sent_1h && sessionDateTime <= in1h && sessionDateTime > now) {
      const { data: participants } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', session.id)

      if (participants) {
        await supabase.from('notifications').insert(
          participants.map((p) => ({
            user_id: p.user_id,
            title: 'Study Session in 1 Hour',
            message: `Your study session "${session.title}" starts in 1 hour!`,
            type: 'session_reminder',
            related_id: session.id,
            related_type: 'session',
          }))
        )
      }
      await supabase
        .from('study_sessions')
        .update({ reminder_sent_1h: true })
        .eq('id', session.id)
    }
  }
}
