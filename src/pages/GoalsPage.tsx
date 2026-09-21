import React, { useState, useEffect } from 'react'
import {
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Award,
  X,
} from 'lucide-react'
import {
  getUserGoals,
  createGoal,
  updateGoalProgress,
} from '@/services/goals.service'
import type { LearningGoal } from '@/types'

export interface GoalsPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onNavigate, user }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false)

  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [goalPriority, setGoalPriority] =
    useState<'low' | 'medium' | 'high'>('medium')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadGoals = async () => {
    if (!user?.id) {
      setLoading(false)
      setGoals([])
      return
    }

    setLoading(true)

    try {
      const data = await getUserGoals(user.id)
      setGoals(data || [])
    } catch (err) {
      console.error(err)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [user?.id])

  const toggleGoal = async (goal: LearningGoal) => {
    if (!user?.id) return

    const nextCompleted = goal.status !== 'completed'
    const nextStatus = nextCompleted ? 'completed' : 'in_progress'
    const nextProgress = nextCompleted ? 100 : 0

    try {
      await updateGoalProgress(
        goal.id,
        user.id,
        nextProgress,
        nextStatus
      )

      setGoals(
        goals.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                status: nextStatus,
              }
            : g
        )
      )

      if (nextCompleted) {
        showToast('Milestone completed! Great progress.')
      }
    } catch {
      showToast('Could not update milestone')
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      showToast('Please sign in to add learning goals.')
      return
    }

    if (!goalTitle.trim()) return

    setIsSubmitting(true)

    try {
      await createGoal(user.id, {
        title: goalTitle.trim(),
        description: goalDesc.trim() || undefined,
        priority: goalPriority,
        target_date: goalTargetDate || undefined,
      })

      showToast('Learning goal created!')
      setIsNewGoalModalOpen(false)
      setGoalTitle('')
      setGoalDesc('')
      setGoalPriority('medium')
      setGoalTargetDate('')

      await loadGoals()
    } catch (err: any) {
      showToast(err.message || 'Could not save goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const completedCount = goals.filter(
    (g) => g.status === 'completed'
  ).length

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Target className="w-4 h-4" />
              <span>Goal Tracking & Accountability</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Study Goals & Milestones
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Set curriculum goals, track weekly progress, and maintain
              consistent study habits.
            </p>
          </div>

          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Completed Goals
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="text-3xl font-extrabold text-slate-900">
              {completedCount} / {goals.length}
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Personal academic targets
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                In Progress
              </span>
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="text-3xl font-extrabold text-slate-900">
              {goals.length - completedCount} Active
            </div>

            <p className="text-xs text-indigo-600 font-semibold mt-2">
              Active revision milestones
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Accountability
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            <div className="text-3xl font-extrabold text-slate-900">
              {goals.length > 0
                ? Math.round((completedCount / goals.length) * 100)
                : 0}
              %
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Goal completion rate
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Target className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Sign In to Track Goals
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Create an account or sign in to establish personal revision
              targets and maintain daily accountability.
            </p>
          </div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">
              Loading goals...
            </p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Target className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              No Learning Goals Set Yet
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Setting specific milestones keeps your study sessions on
              schedule. Create your first goal below!
            </p>

            <button
              onClick={() => setIsNewGoalModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Add First Goal
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                Your Goals
              </h3>

              <span className="text-xs text-slate-500">
                Click to toggle status
              </span>
            </div>

            <div className="space-y-4">
              {goals.map((goal) => {
                const isCompleted = goal.status === 'completed'

                return (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 hover:bg-indigo-50/40 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-600'
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <h4
                          className={`text-sm font-bold transition-all ${
                            isCompleted
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {goal.title}
                        </h4>

                        {goal.description && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {goal.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-medium text-[11px] capitalize">
                            Priority: {goal.priority}
                          </span>

                          {goal.target_date && (
                            <span>Target: {goal.target_date}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden inline-block align-middle mr-3">
                        <div
                          className={`h-full ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{
                            width: isCompleted ? '100%' : '0%',
                          }}
                        />
                      </div>

                      <span className="text-xs font-bold text-slate-700">
                        {isCompleted ? 100 : 0}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isNewGoalModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsNewGoalModalOpen(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-slide-up">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      Add Learning Goal
                    </h3>

                    <p className="text-xs text-indigo-300">
                      Define a clear milestone for your study schedule
                    </p>
                  </div>

                  <button
                    onClick={() => setIsNewGoalModalOpen(false)}
                    className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleAddGoal}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Milestone Title
                    </label>

                    <input
                      type="text"
                      required
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="e.g. Master Differential Equations Chapter"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Description (Optional)
                    </label>

                    <textarea
                      rows={2}
                      value={goalDesc}
                      onChange={(e) => setGoalDesc(e.target.value)}
                      placeholder="Specific topics or problems to solve..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Priority
                      </label>

                      <select
                        value={goalPriority}
                        onChange={(e) =>
                          setGoalPriority(
                            e.target.value as 'low' | 'medium' | 'high'
                          )
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Date
                      </label>

                      <input
                        type="date"
                        value={goalTargetDate}
                        onChange={(e) =>
                          setGoalTargetDate(e.target.value)
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIsNewGoalModalOpen(false)
                      }
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Goal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}