import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Search,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  incrementDownloadCount,
  addLinkResource
} from '@/services/resources.service'
import { getPublicGroups } from '@/services/groups.service'
import type { Resource, StudyGroup } from '@/types'

export interface ResourcesPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  onNavigate,
  user
}) => {
  const [resources, setResources] = useState<Resource[]>([])
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [newType, setNewType] = useState<any>('pdf')
  const [newUrl, setNewUrl] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)

    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const loadResources = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('resources')
        .select(`
          *,
          uploader:profiles!resources_uploaded_by_fkey(user_id, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      const { data, error } = await query

      if (!error && data) {
        setResources(data as Resource[])
      } else {
        console.error('Error loading resources:', error)
        setResources([])
      }

      const grps = await getPublicGroups().catch(() => [])

      setGroups(grps || [])

      if (grps && grps.length > 0 && !newGroupId) {
        setNewGroupId(grps[0].id)
      }
    } catch (err) {
      console.error(err)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [typeFilter])

  const handleDownload = async (res: Resource) => {
    try {
      await incrementDownloadCount(res.id)

      setResources(
        resources.map((r) =>
          r.id === res.id
            ? {
                ...r,
                download_count: r.download_count + 1
              }
            : r
        )
      )

      showToast(`Downloading "${res.title}"...`)

      if (res.file_url) {
        window.open(res.file_url, '_blank')
      }
    } catch {
      showToast(`Downloading "${res.title}"...`)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      showToast('Please sign in to share study resources.')
      return
    }

    if (!newTitle.trim() || !newGroupId) {
      showToast('Please provide a title and select a group.')
      return
    }

    setIsSubmitting(true)

    try {
      await addLinkResource(user.id, {
        group_id: newGroupId,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        external_url: newUrl.trim() || '#',
        topic: undefined,
      })

      showToast(
        `Resource "${newTitle}" added to group repository!`
      )

      setIsUploadModalOpen(false)
      setNewTitle('')
      setNewUrl('')
      setNewDesc('')

      await loadResources()
    } catch (err: any) {
      showToast(err.message || 'Could not add resource')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.description &&
      r.description.toLowerCase().includes(search.toLowerCase()))
  )

  const getGroupName = (groupId?: string) => {
    if (!groupId) return null

    const group = groups.find((g) => g.id === groupId)

    return group?.name || null
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-600" />
                </div>

                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    Study Notes & Resources
                  </h1>

                  <p className="text-slate-500 mt-1">
                    Find and share useful study materials with your groups.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Share Resource
            </button>

          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Search and filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8">

          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'pdf', 'document', 'link', 'video'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold capitalize transition-colors ${
                    typeFilter === type
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-slate-500">
                Loading resources...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">

            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              No resources found
            </h2>

            <p className="text-slate-500 mb-6">
              Try another search or share a new study resource.
            </p>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700"
            >
              <Upload className="w-5 h-5" />
              Share Resource
            </button>

          </div>
        )}

        {/* Resource grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filtered.map((res) => {
              const groupName = getGroupName(res.group_id)

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >

                  {/* Card top */}
                  <div className="p-6">

                    <div className="flex items-start justify-between gap-4 mb-4">

                      <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>

                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        Resource
                      </span>

                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 mb-2 line-clamp-2">
                      {res.title}
                    </h3>

                    {res.description && (
                      <p className="text-sm text-slate-500 line-clamp-3 mb-4">
                        {res.description}
                      </p>
                    )}

                    {groupName && (
                      <div className="text-xs font-semibold text-teal-600 mb-4">
                        Group: {groupName}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {res.download_count || 0} downloads
                      </span>

                      {res.created_at && (
                        <span>
                          {new Date(res.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Card bottom */}
                  <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      Shared resource
                    </div>

                    <button
                      onClick={() => handleDownload(res)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 text-teal-700 font-bold text-sm hover:bg-teal-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Open
                    </button>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">

          <div className="bg-slate-900 text-white px-5 py-4 rounded-xl shadow-xl flex items-center gap-3">

            <CheckCircle2 className="w-5 h-5 text-teal-400" />

            <span className="text-sm font-semibold">
              {toastMessage}
            </span>

          </div>

        </div>
      )}

      {/* Upload modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">

          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Share a Resource
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Add a useful study resource for your group.
                </p>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

            </div>

            {/* Form */}
            <form onSubmit={handleUpload} className="p-6 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Resource Title
                </label>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction to Database Systems"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Group */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Study Group
                </label>

                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">
                    Select a study group
                  </option>

                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Resource Type
                </label>

                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="document">Document</option>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  URL / File Link
                </label>

                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Briefly describe this resource..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add Resource
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default ResourcesPage
