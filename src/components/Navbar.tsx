import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Search,
  Bell,
  LogIn,
  LogOut,
  ChevronDown,
  Target,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { getNotifications, getUnreadCount } from '@/services/notifications.service'
import type { Notification } from '@/types'

export interface NavbarProps {
  onOpenDrawer: () => void
  currentPage: string
  onNavigate: (page: string) => void
  onOpenAuth: () => void
  onOpenSearch: () => void
  user: any
  profile: any
  signOut: () => Promise<void>
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDrawer,
  currentPage,
  onNavigate,
  onOpenAuth,
  onOpenSearch,
  user,
  profile,
  signOut,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user?.id) {
      getNotifications(user.id, 5)
        .then((data) => setNotifications(data))
        .catch(() => setNotifications([]))

      getUnreadCount(user.id)
        .then((count) => setUnreadCount(count))
        .catch(() => setUnreadCount(0))
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user?.id])

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'groups', label: 'Study Groups' },
    { id: 'sessions', label: 'Live Sessions' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'resources', label: 'Resources' },
    { id: 'goals', label: 'Goals & Streaks' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-[#1a1a1e] text-slate-300 text-[11px] font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Virtual Study Group Portal</span>
              <span className="hidden sm:inline text-slate-400">| Academic Peer Collaboration</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {profile?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="text-amber-300 hover:text-amber-200 transition-colors font-semibold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Console
              </button>
            )}
            <button
              onClick={() => onNavigate('sessions')}
              className="text-primary-300 hover:text-primary-100 font-semibold"
            >
              Today's Live Sessions
            </button>
          </div>

        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-4">
          
          {/* Left: 3-lines Drawer Button + Institutional Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* The 3 Small Lines / Hamburger Button */}
            <button
              onClick={onOpenDrawer}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              aria-label="Open all pages menu"
              title="Click 3 small lines to display all pages and services"
            >
              <div className="flex flex-col gap-1 w-5 justify-center items-center">
                <span className="block w-5 h-0.5 bg-slate-700 group-hover:bg-primary-600 rounded-full transition-all duration-200"></span>
                <span className="block w-4 h-0.5 bg-slate-700 group-hover:bg-primary-600 rounded-full transition-all duration-200 self-start"></span>
                <span className="block w-5 h-0.5 bg-slate-700 group-hover:bg-primary-600 rounded-full transition-all duration-200"></span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-primary-600 hidden sm:inline">
                All Pages
              </span>
            </button>

            {/* Logo and Name */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-600/30 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-primary-600 transition-colors">
                    VIRTUAL STUDY GROUP
                  </span>
                </div>
                <p className="text-[11px] font-medium text-primary-600 tracking-wide mt-0.5 hidden xs:block">
                  Academic Peer Collaboration Portal
                </p>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              )
            })}
          </nav>

          {/* Right: Quick Tools, Notifications, Auth / Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              title="Search groups, subjects, notes..."
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors relative focus:outline-none cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-slide-up">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[11px] bg-primary-50 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Join / Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {profile?.full_name ? profile.full_name.charAt(0) : 'S'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[100px]">
                      {profile?.full_name || 'Student'}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold capitalize">
                      {profile?.role || 'Active'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-slide-up">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{profile?.full_name || 'Student'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        onNavigate('goals')
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      My Study Milestones
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        onNavigate('groups')
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-indigo-600" />
                      My Study Groups
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        signOut()
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('groups')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Join A Group
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  )
}
