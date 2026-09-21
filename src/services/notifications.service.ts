import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Get notifications for a user ──────────────────────────────
export async function getNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Notification[]
}

// ── Get unread count ──────────────────────────────────────────
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}

// ── Mark a single notification as read ────────────────────────
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

// ── Mark all notifications as read ───────────────────────────
export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

// ── Delete a notification ─────────────────────────────────────
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
}

// ── Subscribe to new notifications ───────────────────────────
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: Notification) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as Notification)
      }
    )
    .subscribe()

  return channel
}

// ── Send notification ─────────────────────────────────────────
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  relatedId?: string,
  relatedType?: string
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    related_id: relatedId,
    related_type: relatedType,
  })
}
