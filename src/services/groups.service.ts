import { supabase } from '@/lib/supabase'
import type { StudyGroup, GroupMember, GroupJoinRequest, MemberRole } from '@/types'

// ── Fetch groups with optional subject filter ────────────────
export async function getPublicGroups(filters?: {
  search?: string
  subject_id?: string
  study_level?: string
  visibility?: string
  sort?: 'newest' | 'popular' | 'active'
}) {
  let query = supabase
    .from('study_groups')
    .select(`
      *,
      subject:subjects(id, name, icon, color),
      owner:profiles!study_groups_owner_id_fkey(full_name, profile_image)
    `)
    .eq('is_active', true)
    .eq('visibility', 'public')

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.subject_id) {
    query = query.eq('subject_id', filters.subject_id)
  }
  if (filters?.study_level && filters.study_level !== 'all') {
    query = query.eq('study_level', filters.study_level)
  }

  const sort = filters?.sort || 'newest'
  if (sort === 'popular') {
    query = query.order('member_count', { ascending: false })
  } else if (sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('updated_at', { ascending: false })
  }

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data as StudyGroup[]
}

// ── Get groups the current user belongs to ───────────────────
export async function getMyGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      role,
      joined_at,
      group:study_groups(
        *,
        subject:subjects(id, name, icon, color)
      )
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data?.map((gm) => ({
    ...(gm.group as unknown as StudyGroup),
    member_role: gm.role as MemberRole,
  })) ?? []
}

// ── Get a single group by ID ─────────────────────────────────
export async function getGroupById(groupId: string, userId?: string) {
  const { data, error } = await supabase
    .from('study_groups')
    .select(`
      *,
      subject:subjects(id, name, icon, color),
      owner:profiles!study_groups_owner_id_fkey(user_id, full_name, profile_image, course)
    `)
    .eq('id', groupId)
    .single()

  if (error) throw error

  let is_member = false
  let member_role: MemberRole | undefined

  if (userId) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (membership) {
      is_member = true
      member_role = membership.role as MemberRole
    }
  }

  return { ...data, is_member, member_role } as StudyGroup
}

// ── Create a group ───────────────────────────────────────────
export async function createGroup(
  userId: string,
  groupData: {
    name: string
    subject_id?: string
    description?: string
    study_level?: string
    course?: string
    max_members?: number
    visibility?: string
    study_objectives?: string
  }
) {
  const { data: group, error } = await supabase
    .from('study_groups')
    .insert({
      ...groupData,
      owner_id: userId,
      member_count: 1,
    })
    .select()
    .single()

  if (error) throw error

  // Add owner as member
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'owner',
  })

  // Create notification activity log
  await supabase.from('activity_logs').insert({
    action: 'group_created',
    description: `Study group "${group.name}" was created`,
    metadata: { group_id: group.id },
  })

  return group as StudyGroup
}

// ── Join a public group directly ─────────────────────────────
export async function joinGroup(groupId: string, userId: string) {
  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (existing) throw new Error('You are already a member of this group.')

  // Check capacity
  const { data: group } = await supabase
    .from('study_groups')
    .select('member_count, max_members, name')
    .eq('id', groupId)
    .single()

  if (group && group.member_count >= group.max_members) {
    throw new Error('This study group is full.')
  }

  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
  })

  if (error) throw error
}

// ── Request to join a private group ──────────────────────────
export async function requestToJoinGroup(groupId: string, userId: string, message?: string) {
  const { data: existing } = await supabase
    .from('group_join_requests')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    if (existing.status === 'pending') throw new Error('You already have a pending request for this group.')
    if (existing.status === 'approved') throw new Error('You are already a member of this group.')
  }

  const { error } = await supabase.from('group_join_requests').upsert({
    group_id: groupId,
    user_id: userId,
    message,
    status: 'pending',
  }, { onConflict: 'group_id,user_id' })

  if (error) throw error
}

// ── Get join requests for a group ────────────────────────────
export async function getGroupJoinRequests(groupId: string) {
  const { data, error } = await supabase
    .from('group_join_requests')
    .select(`
      *,
      profile:profiles!group_join_requests_user_id_fkey(user_id, full_name, profile_image, course)
    `)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as GroupJoinRequest[]
}

// ── Approve/reject join request ───────────────────────────────
export async function handleJoinRequest(
  requestId: string,
  action: 'approved' | 'rejected',
  groupId: string,
  userId: string
) {
  await supabase
    .from('group_join_requests')
    .update({ status: action })
    .eq('id', requestId)

  if (action === 'approved') {
    await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    })

    // Notify the user
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Join Request Approved',
      message: 'Your request to join the study group has been approved. Welcome!',
      type: 'join_approved',
      related_id: groupId,
      related_type: 'group',
    })
  }
}

// ── Leave a group ────────────────────────────────────────────
export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Get group members ────────────────────────────────────────
export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      profile:profiles!group_members_user_id_fkey(user_id, full_name, profile_image, course, year_of_study, study_streak)
    `)
    .eq('group_id', groupId)
    .order('role', { ascending: true })

  if (error) throw error
  return data as GroupMember[]
}

// ── Update group ────────────────────────────────────────────
export async function updateGroup(groupId: string, updates: Partial<StudyGroup>) {
  const { error } = await supabase
    .from('study_groups')
    .update(updates)
    .eq('id', groupId)

  if (error) throw error
}

// ── Remove member from group ─────────────────────────────────
export async function removeMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// ── Get recommended groups based on user subjects ────────────
export async function getRecommendedGroups(userId: string) {
  // Get user's subjects
  const { data: userSubjects } = await supabase
    .from('user_subjects')
    .select('subject_id')
    .eq('user_id', userId)

  const subjectIds = userSubjects?.map((us) => us.subject_id) ?? []

  if (subjectIds.length === 0) {
    return getPublicGroups({ sort: 'popular' })
  }

  const { data, error } = await supabase
    .from('study_groups')
    .select(`
      *,
      subject:subjects(id, name, icon, color),
      owner:profiles!study_groups_owner_id_fkey(full_name, profile_image)
    `)
    .in('subject_id', subjectIds)
    .eq('visibility', 'public')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
    .limit(6)

  if (error) throw error
  return data as StudyGroup[]
}
