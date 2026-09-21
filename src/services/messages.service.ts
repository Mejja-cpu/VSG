import { supabase } from '@/lib/supabase'
import type { Message } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Fetch messages for a group ───────────────────────────────
export async function getMessages(groupId: string, limit = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(user_id, full_name, profile_image)
    `)
    .eq('group_id', groupId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data as Message[]
}

// ── Send a message ───────────────────────────────────────────
export async function sendMessage(
  groupId: string,
  senderId: string,
  message: string,
  replyTo?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      group_id: groupId,
      sender_id: senderId,
      message: message.trim(),
      reply_to: replyTo || null,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(user_id, full_name, profile_image)
    `)
    .single()

  if (error) throw error
  return data as Message
}

// ── Soft-delete own message ──────────────────────────────────
export async function deleteMessage(messageId: string, senderId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId)
    .eq('sender_id', senderId) // RLS also enforces this

  if (error) throw error
}

// ── Subscribe to real-time messages in a group ───────────────
export function subscribeToMessages(
  groupId: string,
  onInsert: (message: Message) => void,
  onDelete: (messageId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      async (payload) => {
        // Fetch full message with sender profile
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(user_id, full_name, profile_image)
          `)
          .eq('id', payload.new.id)
          .single()

        if (data) onInsert(data as Message)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        if (payload.new.is_deleted) {
          onDelete(payload.new.id)
        }
      }
    )
    .subscribe()

  return channel
}

// ── Unsubscribe from realtime channel ────────────────────────
export async function unsubscribeFromMessages(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel)
}

// ── Report a message ─────────────────────────────────────────
export async function reportMessage(
  reporterId: string,
  messageId: string,
  reason: string,
  description?: string
): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    content_type: 'message',
    content_id: messageId,
    reason,
    description,
  })

  if (error) throw error
}
