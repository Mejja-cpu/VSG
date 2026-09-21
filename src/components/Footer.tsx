import React, { useState } from 'react'
import {
  GraduationCap,
  Send,
  CheckCircle2,
  ShieldCheck,
  Award,
  Mail,
  Phone
} from 'lucide-react'

export interface FooterProps {
  onNavigate: (page: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    }
  }

  return (
    <footer className="bg-[#1a1a1e] text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-slate-800">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/40">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base tracking-tight">VIRTUAL STUDY GROUP</h3>
                <p className="text-xs text-primary-400 font-medium">Academic Peer Platform</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              An interactive academic collaboration environment enabling students to form curriculum-focused study groups, attend scheduled live sessions, complete practice quizzes, and share verified notes.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Platform
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-950 text-primary-300 border border-primary-800 text-[11px] font-semibold">
                <Award className="w-3.5 h-3.5" />
                Peer Learning
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Core Features
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('groups')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Study Circles & Groups
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sessions')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Live Virtual Sessions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('quizzes')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Practice Quizzes & Tests
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('resources')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Curriculum Resources
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('goals')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Study Streaks & Goals
                </button>
              </li>
            </ul>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Academic Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Code of Conduct
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Academic Integrity Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Peer Tutoring Ethics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-primary-400 transition-colors cursor-pointer">
                  Privacy & Data Safety
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Admin */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Contact Admin
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:mejjanzuki10@gmail.com?subject=Virtual Study Group - Inquiry"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>mejjanzuki10@gmail.com</span>
              </a>
              <a
                href="tel:+254745237285"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>+254 745237285</span>
              </a>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Reach out for support, technical issues, or academic guidance.
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
              Study Notifications
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe for weekly exam review schedules and study group announcements.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Subscribe
              </button>
            </form>

            {subscribed && (
              <div className="mt-2.5 p-2 bg-emerald-950 border border-emerald-800 text-emerald-300 text-[11px] rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Subscribed successfully!</span>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Virtual Study Group (VSG). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="hover:text-slate-400 transition-colors cursor-pointer">
              Terms
            </button>
            <button onClick={() => onNavigate('home')} className="hover:text-slate-400 transition-colors cursor-pointer">
              Privacy
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
