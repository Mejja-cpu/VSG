import React, { useState, useEffect } from 'react'
import {
  X,
  Home,
  Users,
  Calendar,
  Award,
  BookOpen,
  Target,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Flame,
  HelpCircle
} from 'lucide-react'
import { getSubjects } from '@/services/admin.service'
import type { Subject } from '@/types'

export interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  onNavigate: (page: string) => void
  onOpenAuth: () => void
  user: any
  profile: any
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  onOpenAuth,
  user,
  profile,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([])

  useEffect(() => {
    if (isOpen) {
      getSubjects()
        .then((data) => setSubjects(data.slice(0, 8)))
        .catch(() => setSubjects([]))
    }
  }, [isOpen])

  if (!isOpen) return null

  const mainPages = [
    {
      id: 'home',
      label: 'Home Portal',
      description: 'Platform overview & quick actions',
      icon: Home,
    },
    {
      id: 'groups',
      label: 'Study Groups',
      description: 'Find and join peer study circles',
      icon: Users,
    },
    {
      id: 'sessions',
      label: 'Live Sessions',
      description: 'Scheduled virtual study rooms',
      icon: Calendar,
    },
    {
      id: 'quizzes',
      label: 'Quizzes & Tests',
      description: 'Practice questions & self-assessment',
      icon: Award,
    },
    {
      id: 'resources',
      label: 'Resource Hub',
      description: 'Lecture notes, past papers & summaries',
      icon: BookOpen,
    },
    {
      id: 'goals',
      label: 'Goals & Streaks',
      description: 'Track milestones & daily study habits',
      icon: Target,
    },
    ...(profile?.role === 'admin'
      ? [
          {
            id: 'admin',
            label: 'Administration',
            description: 'Platform oversight & management',
            icon: ShieldCheck,
          },
        ]
      : []),
  ]

  const handleLinkClick = (pageId: string) => {
    onNavigate(pageId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-r border-slate-200 transform transition-transform duration-300 ease-in-out">
          
          {/* Drawer Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-wide text-white">VIRTUAL STUDY GROUP</h2>
                <p className="text-xs text-indigo-300 font-medium">All Pages & Academic Services</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Bar */}
          {user && (
            <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Streak: {profile?.study_streak || 0} Days</span>
              </div>
              <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-medium">
                {profile?.full_name || user.email}
              </span>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Main Navigation Pages */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
                Navigation
              </div>
              <nav className="space-y-1">
                {mainPages.map((page) => {
                  const Icon = page.icon
                  const isActive = currentPage === page.id
                  return (
                    <button
                      key={page.id}
                      onClick={() => handleLinkClick(page.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {page.label}
                          </div>
                          <div className={`text-xs truncate ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {page.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Academic Subjects (Dynamic from Database) */}
            {subjects.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
                  Subjects
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleLinkClick('groups')}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl text-left transition-colors text-xs text-slate-700 hover:text-indigo-700 cursor-pointer"
                    >
                      <span className="text-base mr-1">{sub.icon}</span>
                      <span className="font-medium truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
            {!user ? (
              <button
                onClick={() => {
                  onClose()
                  onOpenAuth()
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all text-center cursor-pointer"
              >
                Sign In to Account
              </button>
            ) : (
              <button
                onClick={() => handleLinkClick('goals')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all text-center cursor-pointer"
              >
                My Dashboard
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
