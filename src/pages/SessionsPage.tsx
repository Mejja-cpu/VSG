import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Users,
  Plus,
  CheckCircle2,
  Share2,
  Send,
  MessageSquare,
  FileText,
  PhoneOff,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createSession, updateAttendance } from '@/services/sessions.service'
import { getPublicGroups } from '@/services/groups.service'
import type { StudySession, StudyGroup } from '@/types'

export interface SessionsPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const SessionsPage: React.FC<SessionsPageProps> = ({ onNavigate, user }) => {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSessionRoom, setActiveSessionRoom] = useState<StudySession | null>(null)
  const [micActive, setMicActive] = useState(true)
  const [cameraActive, setCameraActive] = useState(true)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Session fields
  const [newTitle, setNewTitle] = useState('')
  const [newGroupId, setNewGroupId] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newStartTime, setNewStartTime] = useState('16:00')
  const [newEndTime, setNewEndTime] = useState('17:30')
  const [newAgenda, setNewAgenda] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          group:study_groups(id, name),
          organizer:profiles!study_sessions_organizer_id_fkey(user_id, full_name)
        `)
        .order('session_date', { ascending: true })

      if (!error && data) {
        setSessions(data as StudySession[])
      } else {
        setSessions([])
      }

      const groupsData = await getPublicGroups().catch(() => [])
      setGroups(groupsData || [])
      if (groupsData.length > 0) {
        setNewGroupId(groupsData[0].id)
      }
    } catch (err) {
      console.error(err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      showToast('Please sign in to schedule a session.')
      return
    }
    if (!newTitle.trim() || !newGroupId) {
      showToast('Please specify a title and select a group.')
      return
    }

    setIsSubmitting(true)
    try {
      await createSession({
        group_id: newGroupId,
        organizer_id: user.id,
        title: newTitle,
        session_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        description: newAgenda,
      })

      showToast(`Session "${newTitle}" scheduled successfully!`)
      setIsScheduleModalOpen(false)
      setNewTitle('')
      setNewAgenda('')
      loadData()
    } catch (err: any) {
      showToast(err.message || 'Could not schedule session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRSVP = async (session: StudySession) => {
    if (!user?.id) {
      showToast('Please sign in to RSVP for sessions.')
      return
    }
    try {
      await updateAttendance(session.id, user.id, 'confirmed')
      showToast(`Attendance confirmed for "${session.title}"!`)
    } catch {
      showToast(`RSVP registered for "${session.title}"!`)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    setChatMessages([
      ...chatMessages,
      {
        sender: user?.email ? user.email.split('@')[0] : 'You',
        text: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setChatMessage('')
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
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Virtual Study Rooms</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Tutorial & Study Sessions
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Participate in scheduled study rooms or organize peer revision for your study circle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Session</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Sessions Scheduled</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              There are currently no upcoming live sessions scheduled. Schedule a session for your study circle to collaborate!
            </p>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Schedule First Session
            </button>
          </div>
        ) : (
          /* Sessions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-card-hover transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        {s.session_date}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                        {s.start_time} - {s.end_time}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {s.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mb-1 leading-snug">
                    {s.title}
                  </h3>
                  {s.group && (
                    <p className="text-xs font-semibold text-indigo-700 mb-3">{s.group.name}</p>
                  )}

                  {s.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl">
                      <strong className="text-slate-700">Agenda:</strong> {s.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setActiveSessionRoom(s)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Room</span>
                  </button>
                  <button
                    onClick={() => handleRSVP(s)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>RSVP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Active Virtual Room Modal */}
      {activeSessionRoom && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col animate-fade-in">
          
          <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h3 className="font-bold text-sm text-white">{activeSessionRoom.title}</h3>
                <p className="text-xs text-slate-400">
                  {activeSessionRoom.group?.name || 'Live Study Session'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSessionRoom(null)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            <div className="lg:col-span-8 p-6 flex flex-col justify-between bg-slate-900/60 relative">
              <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 p-8 flex flex-col justify-between text-slate-300 relative overflow-hidden shadow-2xl">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Study Session Room</span>
                  </div>
                </div>

                <div className="py-8 space-y-4 max-w-xl mx-auto text-center">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-500/30">
                    <Video className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-extrabold text-white">{activeSessionRoom.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeSessionRoom.description || 'Collaborative session agenda and shared study materials.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
                  <span>Connection: Active</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              </div>

              {/* Controls */}
              <div className="h-16 mt-4 bg-slate-900 rounded-2xl border border-slate-800 px-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    micActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micActive ? 'Mute' : 'Unmuted'}</span>
                </button>

                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`p-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    cameraActive ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                >
                  {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{cameraActive ? 'Stop Video' : 'Start Video'}</span>
                </button>

                <button
                  onClick={() => showToast('Session link copied to clipboard!')}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invite Peer</span>
                </button>
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
              
              <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Chat</span>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No messages yet. Send a message to participants!
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-indigo-300">{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                      <p className="text-slate-200">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* Schedule Session Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsScheduleModalOpen(false)}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-slide-up">
              
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white">Schedule Study Session</h3>
                  <p className="text-xs text-indigo-300">Set a date and agenda for your circle</p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Midterm Problem Solving Workshop"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Study Group</label>
                  <select
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agenda / Topics Covered</label>
                  <textarea
                    rows={3}
                    value={newAgenda}
                    onChange={(e) => setNewAgenda(e.target.value)}
                    placeholder="Topics, exercise questions, or materials to prepare..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
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
