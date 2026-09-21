import React, { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react'
import { getPublicGroups, joinGroup } from '@/services/groups.service'
import { getAdminStats, getSubjects } from '@/services/admin.service'
import { supabase } from '@/lib/supabase'
import type { StudyGroup, StudySession, Subject, AdminStats } from '@/types'

export interface HomeProps {
  onNavigate: (page: string) => void
  onOpenAuth: () => void
  user: any
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenAuth, user }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load real data from Supabase backend
  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true)
      try {
        const [groupsData, subjectsData, statsData] = await Promise.all([
          getPublicGroups().catch(() => []),
          getSubjects().catch(() => []),
          getAdminStats().catch(() => null),
        ])

        setGroups((groupsData || []).slice(0, 4))
        setSubjects((subjectsData || []).slice(0, 6))
        setStats(statsData)

        // Load upcoming sessions
        const { data: sessionsData } = await supabase
          .from('study_sessions')
          .select(`
            *,
            group:study_groups(id, name)
          `)
          .order('session_date', { ascending: true })
          .limit(3)

        setSessions((sessionsData as StudySession[]) || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNavigate('groups')
  }

  const handleJoinClick = async (group: StudyGroup) => {
    if (!user?.id) {
      showToast('Please sign in to join study groups.')
      onOpenAuth()
      return
    }
    try {
      await joinGroup(group.id, user.id)
      showToast(`Joined "${group.name}"!`)
    } catch {
      showToast(`Request sent to join "${group.name}"`)
    }
  }

  const faqs = [
    {
      q: 'How do virtual study groups work on VSG?',
      a: 'Students form or join academic circles dedicated to specific course units. Within each circle, members share verified revision notes, schedule live video/audio tutorial sessions, post questions, and take collaborative practice quizzes.',
    },
    {
      q: 'Is the Virtual Study Group portal free for university students?',
      a: 'Yes, the core platform is free for students. Simply register with your institutional or personal email to access study groups, live sessions, and downloadable notes.',
    },
    {
      q: 'Can I create and host my own study group or live session?',
      a: 'Yes, any registered student can create a new study circle, designate syllabus objectives, invite peers, and host scheduled study sessions.',
    },
    {
      q: 'How do the practice quizzes help with exam preparation?',
      a: 'Our quiz bank contains multi-choice questions covering core syllabus concepts. You receive instant scoring, explanations for options, and streak rewards.',
    },
  ]

  return (
    <div className="bg-[#faf5f2] text-slate-800">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ── HERO SECTION WITH REALISTIC BACKGROUND IMAGE ── */}
      <section className="relative overflow-hidden min-h-[580px] flex items-center bg-[#1a1a1e]">
        
        {/* Real Background Image with Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 scale-105"
          style={{ backgroundImage: `url('/images/hero_study_background.jpg')` }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1e]/95 via-[#1a1a1e]/85 to-[#3d1f18]/75 backdrop-blur-[1px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
          <div className="max-w-3xl space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3d1f18]/80 border border-primary-400/30 text-primary-200 text-xs font-bold tracking-wide backdrop-blur-md shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>Academic Peer Collaboration Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Empower Your Studies Through{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-coral-300 to-primary-200">
                Collaborative Learning
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
              Form syllabus-focused study circles, participate in scheduled live peer tutorials, access certified lecture notes, and take curriculum quizzes.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-2xl">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-primary-300 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by subject or course title..."
                    className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-300 text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Explore Groups</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Subjects from Database */}
              {subjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400">Subjects:</span>
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onNavigate('groups')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer"
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => onNavigate('groups')}
                className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Browse Study Groups</span>
              </button>

              <button
                onClick={() => onNavigate('sessions')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-2xl text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Live Sessions</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── OVERLAPPING QUICK-ACCESS CARDS ── */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div
            onClick={() => onNavigate('groups')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
              Study Groups
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Join course-specific academic groups with structured agendas and active peer discussions.
            </p>
            <div className="flex items-center text-xs font-bold text-indigo-600">
              <span>View Circles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('sessions')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
              Live Sessions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Attend peer-led interactive video study tutorials with shared whiteboards and agendas.
            </p>
            <div className="flex items-center text-xs font-bold text-blue-600">
              <span>Join Classrooms</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('quizzes')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors mb-1">
              Practice Quizzes
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Test recall with timed multi-choice questions, instant explanations, and scoring.
            </p>
            <div className="flex items-center text-xs font-bold text-amber-600">
              <span>Start Quizzes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('resources')}
            className="group p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors mb-1">
              Resource Hub
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Access verified lecture summaries, past paper solutions, and syllabus guides.
            </p>
            <div className="flex items-center text-xs font-bold text-emerald-600">
              <span>Browse Notes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

        </div>
      </section>

      {/* ── REAL DATABASE METRICS ── */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Platform Activity
            </h2>
            <p className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Real-Time Academic Statistics
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-indigo-900/50">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats?.totalStudents ?? 0}
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium">Registered Students</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats?.totalGroups ?? 0}
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium">Active Study Circles</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats?.totalSessions ?? 0}
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium">Scheduled Study Sessions</p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                {stats?.completedQuizzes ?? 0}
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-medium">Completed Quiz Attempts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL FEATURED GROUPS SECTION ── */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              <span>Campus Study Circles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Study Groups
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Active peer groups open for student enrollment.
            </p>
          </div>
          <button
            onClick={() => onNavigate('groups')}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>View All Groups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            No study groups active currently.{' '}
            <button onClick={() => onNavigate('groups')} className="text-indigo-600 font-bold underline">
              Create one now!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {group.subject && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {group.subject.name}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                      {group.study_level}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug line-clamp-2">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {group.description || 'Collaborative syllabus study group.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>Enrolled</span>
                    <span className="font-semibold text-slate-800">
                      {group.member_count} / {group.max_members}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleJoinClick(group)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all text-center cursor-pointer active:scale-95"
                    >
                      Join
                    </button>
                    <button
                      onClick={() => onNavigate('groups')}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all text-center cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── REAL UPCOMING SESSIONS ── */}
      {sessions.length > 0 && (
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled Rooms</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Upcoming Peer Classrooms
                </h3>
              </div>
              <button
                onClick={() => onNavigate('sessions')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>All Sessions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        {s.session_date} • {s.start_time} - {s.end_time}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{s.title}</h4>
                    {s.group && <p className="text-xs text-slate-500">{s.group.name}</p>}
                  </div>

                  <button
                    onClick={() => onNavigate('sessions')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Enter Session</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CORE ACADEMIC PILLARS ── */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Core Framework
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Peer-Driven University Learning
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Virtual Study Group incorporates structured study groups, live tutorials, and active recall testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Curriculum Units</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Study circles are organized by academic disciplines to guarantee relevance to your semester coursework.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Virtual Rooms</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Schedule study sessions with shared agendas, attendance confirmation, and interactive peer chat.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Practice Quizzes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reinforce syllabus concepts with instant scoring and detailed explanations for every question option.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Study Milestones</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Stay consistent through study streak tracking and collaborative semester milestone goals.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
            Information
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
