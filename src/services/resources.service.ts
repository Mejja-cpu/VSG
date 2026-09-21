import { supabase } from '@/lib/supabase'
import type { Resource } from '@/types'

// ── Upload a resource (file) ──────────────────────────────────
export async function uploadResource(
  file: File,
  uploadedBy: string,
  data: {
    title: string
    description?: string
    group_id?: string
    subject_id?: string
    topic?: string
    resource_type: Resource['resource_type']
  }
): Promise<Resource> {
  // Upload to Supabase Storage
  const ext = file.name.split('.').pop()
  const fileName = `${uploadedBy}/${Date.now()}.${ext}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resources')
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(uploadData.path)

  // Create resource record
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      ...data,
      uploaded_by: uploadedBy,
      file_url: publicUrl,
    })
    .select(`
      *,
      uploader:profiles!resources_uploaded_by_fkey(user_id, full_name, profile_image),
      subject:subjects(id, name, icon)
    `)
    .single()

  if (error) throw error

  // Award resource sharer achievement
  await checkResourceAchievement(uploadedBy)

  return resource as Resource
}

// ── Add a link resource (no file upload) ─────────────────────
export async function addLinkResource(
  uploadedBy: string,
  data: {
    title: string
    description?: string
    external_url: string
    group_id?: string
    subject_id?: string
    topic?: string
  }
): Promise<Resource> {
  const { data: resource, error } = await supabase
    .from('resources')
    .insert({
      ...data,
      uploaded_by: uploadedBy,
      resource_type: 'link',
    })
    .select(`
      *,
      uploader:profiles!resources_uploaded_by_fkey(user_id, full_name, profile_image),
      subject:subjects(id, name, icon)
    `)
    .single()

  if (error) throw error
  await checkResourceAchievement(uploadedBy)
  return resource as Resource
}

// ── Get resources for a group ─────────────────────────────────
export async function getGroupResources(groupId: string): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      uploader:profiles!resources_uploaded_by_fkey(user_id, full_name, profile_image),
      subject:subjects(id, name, icon)
    `)
    .eq('group_id', groupId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Resource[]
}

// ── Get all resources for a user ──────────────────────────────
export async function getUserResources(userId: string): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      uploader:profiles!resources_uploaded_by_fkey(user_id, full_name, profile_image),
      subject:subjects(id, name, icon)
    `)
    .eq('uploaded_by', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Resource[]
}

// ── Increment download count ──────────────────────────────────
export async function incrementDownloadCount(resourceId: string): Promise<void> {
  try {
    await supabase.rpc('increment_download_count', { resource_id: resourceId })
  } catch {
    // Fallback if RPC doesn't exist
    const { data } = await supabase
      .from('resources')
      .select('download_count')
      .eq('id', resourceId)
      .single()

    if (data) {
      await supabase.from('resources').update({ download_count: data.download_count + 1 }).eq('id', resourceId)
    }
  }
}

// ── Delete a resource ─────────────────────────────────────────
export async function deleteResource(resourceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('resources')
    .update({ is_active: false })
    .eq('id', resourceId)
    .eq('uploaded_by', userId)

  if (error) throw error
}

// ── Check resource achievement ────────────────────────────────
async function checkResourceAchievement(userId: string) {
  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('uploaded_by', userId)

  if ((count ?? 0) >= 5) {
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('name', 'Resource Sharer')
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
