import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Globe,
  Sparkles,
  X,
} from 'lucide-react'
import {
  getPublicGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
} from '@/services/groups.service'
import { getSubjects } from '@/services/admin.service'
import type { StudyGroup, Subject } from '@/types'

export interface GroupsPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const GroupsPage: React.FC<GroupsPageProps> = ({
  onNavigate,
  user,
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [newStudyLevel, setNewStudyLevel] = useState<
    'beginner' | 'intermediate' | 'advanced' | 'all'
  >('intermediate')
  const [newMaxMembers, setNewMaxMembers] = useState(30)
  const [newDesc, setNewDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load Groups and Subjects from real database services
  const loadData = async () => {
    setLoading(true)

    try {
      const [groupsData, subjectsData] = await Promise.all([
        getPublicGroups({
          search: search || undefined,
          subject_id:
            selectedSubjectId !== 'all'
              ? selectedSubjectId
              : undefined,
          study_level:
            selectedLevel !== 'all'
              ? selectedLevel
              : undefined,
        }).catch(() => []),
        getSubjects().catch(() => []),
      ])

      setGroups(groupsData || [])
      setSubjects(subjectsData || [])

      if (user?.id) {
        const myGroups = await getMyGroups(user.id).catch(() => [])
        setMyGroupIds(myGroups.map((g: any) => g.id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedSubjectId, selectedLevel])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const handleToggleJoin = async (group: StudyGroup) => {
    if (!user?.id) {
      showToast('Please sign in to join study groups.')
      return
    }

    const isMember = myGroupIds.includes(group.id)

    try {
      if (isMember) {
        await leaveGroup(group.id, user.id)
        setMyGroupIds(myGroupIds.filter((id) => id !== group.id))
        showToast(`Left "${group.name}"`)
      } else {
        await joinGroup(group.id, user.id)
        setMyGroupIds([...myGroupIds, group.id])
        showToast(`Successfully joined "${group.name}"!`)
      }

      loadData()
    } catch (err: any) {
      showToast(err.message || 'Operation failed')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      showToast('Please sign in to create a study group.')
      return
    }

    if (!newGroupName.trim()) return

    setIsSubmitting(true)

    try {
      await createGroup(user.id, {
        name: newGroupName.trim(),
        subject_id: newSubjectId || undefined,
        description: newDesc.trim() || undefined,
        study_level: newStudyLevel,
        max_members: Number(newMaxMembers),
        visibility: 'public',
      })

      showToast(`Group "${newGroupName}" created successfully!`)
      setIsCreateModalOpen(false)
      setNewGroupName('')
      setNewSubjectId('')
      setNewDesc('')
      setNewStudyLevel('intermediate')
      setNewMaxMembers(30)

      await loadData()
    } catch (err: any) {
      showToast(err.message || 'Could not create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Campus Study Circles</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Study Groups
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Browse active peer circles, collaborate, and share curriculum
              revision materials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Study Circle</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-8 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by group name or description..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Subjects</option>

                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing{' '}
              <strong className="text-slate-800">
                {groups.length}
              </strong>{' '}
              study groups
            </span>

            <button
              type="submit"
              className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-xs text-slate-500 font-medium mt-3">
              Loading study circles...
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              No Study Groups Found
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              There are currently no active study groups matching your
              criteria. Start the first peer group for your course or subject!
            </p>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/20 transition-all cursor-pointer"
            >
              Create the First Group
            </button>
          </div>
        ) : (
          /* Groups Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const isMember = myGroupIds.includes(group.id)

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-card-hover transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {group.subject ? (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 flex items-center gap-1">
                          <span>{group.subject.icon}</span>
                          <span>{group.subject.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                          Academic
                        </span>
                      )}

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                        {group.study_level}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug">
                      {group.name}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {group.description ||
                        'Collaborative peer study circle for syllabus coursework.'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>Enrollment</span>

                      <span className="font-bold text-slate-800">
                        {group.member_count} / {group.max_members} Members
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleJoin(group)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isMember
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                          : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20'
                      }`}
                    >
                      {isMember ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Joined (Click to Leave)</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          <span>Join Study Circle</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-slide-up">
              <div className="bg-gradient-to-r from-[#3d1f18] to-[#5c3328] p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Create Study Circle
                  </h3>

                  <p className="text-xs text-primary-200">
                    Set up a peer group for your course or unit
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleCreateGroup}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Group Name
                  </label>

                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Linear Algebra & Vector Calculus"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject
                    </label>

                    <select
                      value={newSubjectId}
                      onChange={(e) => setNewSubjectId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Subject</option>

                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Study Level
                    </label>

                    <select
                      value={newStudyLevel}
                      onChange={(e) =>
                        setNewStudyLevel(
                          e.target.value as
                            | 'beginner'
                            | 'intermediate'
                            | 'advanced'
                            | 'all'
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="all">All Levels</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Capacity
                  </label>

                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={newMaxMembers}
                    onChange={(e) =>
                      setNewMaxMembers(Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description & Objectives
                  </label>

                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="State study goals, syllabus topics, and weekly schedule..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}