import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Server,
  Award
} from 'lucide-react'
import { getAdminStats, getReports, updateReportStatus, getSubjects } from '@/services/admin.service'
import type { AdminStats, Report, Subject } from '@/types'

export interface AdminPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, user }) => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsData, reportsData, subjectsData] = await Promise.all([
        getAdminStats().catch(() => null),
        getReports('pending').catch(() => []),
        getSubjects().catch(() => []),
      ])

      setStats(statsData)
      setReports(reportsData || [])
      setSubjects(subjectsData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleResolveReport = async (reportId: string) => {
    if (!user?.id) return
    try {
      await updateReportStatus(reportId, 'resolved', 'Resolved by administrator', user.id)
      setReports(reports.filter((r) => r.id !== reportId))
      showToast('Report marked resolved.')
    } catch {
      showToast('Could not resolve report')
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
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Platform Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrative Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Real-time platform metrics, user moderation, and curriculum subject management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
          </div>
        </div>

        {/* System Vitals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.totalStudents ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats?.activeStudents ?? 0} active recently</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Groups</span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.totalGroups ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">{subjects.length} academic subjects</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Sessions</span>
              <Server className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.totalSessions ?? 0}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Scheduled across groups</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quizzes & Resources</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {(stats?.totalQuizzes ?? 0) + (stats?.totalResources ?? 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats?.totalQuizzes ?? 0} quizzes, {stats?.totalResources ?? 0} notes</p>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Subjects List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Academic Subjects</h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                {subjects.length} Active
              </span>
            </div>

            {subjects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No subjects found in database.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {subjects.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                    <span className="text-lg">{s.icon}</span>
                    <span className="font-semibold text-slate-800 truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reported Content */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Pending Reports & Moderation</h3>
              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold">
                {reports.length} Open
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No pending moderation reports! Community status clean.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {r.reason}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">Type: {r.content_type}</p>
                    {r.description && <p className="text-xs text-slate-500 italic">"{r.description}"</p>}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleResolveReport(r.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Dismiss / Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
