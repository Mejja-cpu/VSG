import React, { useState, useEffect } from 'react'
import { Search, X, Users, Award, ArrowRight } from 'lucide-react'
import { getPublicGroups } from '@/services/groups.service'
import { getQuizzes } from '@/services/quizzes.service'

export interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ title: string; type: string; page: string; tag: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [groups, quizzes] = await Promise.all([
          getPublicGroups({ search: query }).catch(() => []),
          getQuizzes({ search: query }).catch(() => []),
        ])

        const groupItems = (groups || []).slice(0, 5).map((g) => ({
          title: g.name,
          type: 'group',
          page: 'groups',
          tag: g.subject?.name || 'Study Circle',
        }))

        const quizItems = (quizzes || []).slice(0, 5).map((q) => ({
          title: q.title,
          type: 'quiz',
          page: 'quizzes',
          tag: `${q.difficulty} • ${q.time_limit}m`,
        }))

        setResults([...groupItems, ...quizItems])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  if (!isOpen) return null

  const handleSelect = (page: string) => {
    onNavigate(page)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up z-10">
          
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search study groups and quizzes..."
              className="w-full text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Searching...</div>
            ) : !query.trim() ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Type above to search study circles and practice quizzes.
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching results found.
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.page)}
                  className="w-full p-3 rounded-xl hover:bg-indigo-50/70 flex items-center justify-between text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                      {item.type === 'group' ? <Users className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-900 truncate">
                        {item.title}
                      </p>
                      <span className="text-[11px] text-slate-500 capitalize">{item.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium group-hover:bg-indigo-100 group-hover:text-indigo-800">
                      {item.tag}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
