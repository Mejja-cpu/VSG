import React, { useState, useEffect } from 'react'
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  BookOpen
} from 'lucide-react'
import { getQuizzes, getQuizWithQuestions, submitQuizAttempt, getQuizAttempts } from '@/services/quizzes.service'
import type { Quiz, QuizQuestion } from '@/types'

export interface QuizzesPageProps {
  onNavigate: (page: string) => void
  user: any
}

export const QuizzesPage: React.FC<QuizzesPageProps> = ({ onNavigate, user }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [startedAt, setStartedAt] = useState<string>('')

  // Load Quizzes from database
  const loadQuizzes = async () => {
    setLoading(true)
    try {
      const data = await getQuizzes().catch(() => [])
      setQuizzes(data || [])
    } catch (err) {
      console.error(err)
      setQuizzes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
  }, [])

  const handleStartQuiz = async (quiz: Quiz) => {
    setActiveQuizId(quiz.id)
    setActiveQuiz(quiz)
    setLoadingQuestions(true)
    setCurrentQuestionIdx(0)
    setSelectedAnswers({})
    setIsSubmitted(false)
    setScore(0)
    setStartedAt(new Date().toISOString())

    try {
      const res = await getQuizWithQuestions(quiz.id)
      setQuestions(res.questions || [])
    } catch {
      setQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleSelectOption = (optKey: string) => {
    if (isSubmitted || !questions[currentQuestionIdx]) return
    setSelectedAnswers({
      ...selectedAnswers,
      [questions[currentQuestionIdx].id]: optKey,
    })
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || questions.length === 0) return

    let correctCount = 0
    const answersList = questions.map((q) => {
      const selected = selectedAnswers[q.id] || ''
      const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase()
      if (isCorrect) correctCount += 1
      return {
        question_id: q.id,
        selected_answer: selected,
        is_correct: isCorrect,
      }
    })

    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setIsSubmitted(true)

    if (user?.id) {
      try {
        await submitQuizAttempt({
          quiz_id: activeQuiz.id,
          user_id: user.id,
          score: finalScore,
          total_questions: questions.length,
          correct_answers: correctCount,
          started_at: startedAt,
          answers: answersList,
        })
      } catch (err) {
        console.error('Error saving quiz attempt:', err)
      }
    }
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setCurrentQuestionIdx(0)
    setIsSubmitted(false)
    setScore(0)
    setStartedAt(new Date().toISOString())
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Assessment & Revision</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Curriculum Practice Quizzes
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Test retention against syllabus examination questions with instant scoring.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">Loading quizzes...</p>
          </div>
        ) : !activeQuiz ? (
          /* Quizzes Catalog View */
          quizzes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Quizzes Available</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                There are currently no active quizzes published in the system. Practice quizzes added by faculty or admins will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-card-hover transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {q.subject ? (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                          {q.subject.name}
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                          General
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
                        {q.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 mb-2 leading-snug">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{q.description}</p>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs text-slate-600 mb-4">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Time Limit</span>
                        <strong className="text-slate-800 text-sm">{q.time_limit} Mins</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pass Mark</span>
                        <strong className="text-slate-800 text-sm">{q.passing_score}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Difficulty</span>
                        <strong className="text-slate-800 text-sm capitalize">{q.difficulty}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(q)}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    <span>Start Practice Quiz</span>
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Active Quiz Player */
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-10 animate-fade-in">
            
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div>
                <button
                  onClick={() => {
                    setActiveQuiz(null)
                    setActiveQuizId(null)
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold mb-1 cursor-pointer"
                >
                  ← Return to Quizzes
                </button>
                <h3 className="font-bold text-lg text-slate-900">{activeQuiz.title}</h3>
              </div>

              {questions.length > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                    Question {currentQuestionIdx + 1} of {questions.length}
                  </span>
                </div>
              )}
            </div>

            {loadingQuestions ? (
              <div className="py-16 text-center text-xs text-slate-500">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No questions have been configured for this quiz yet.
              </div>
            ) : (
              (() => {
                const q = questions[currentQuestionIdx]
                const userChoice = selectedAnswers[q.id]

                const optionsList = [
                  { key: 'a', text: q.option_a },
                  { key: 'b', text: q.option_b },
                  { key: 'c', text: q.option_c },
                  { key: 'd', text: q.option_d },
                ]

                return (
                  <div className="space-y-6">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {q.question}
                    </h4>

                    <div className="space-y-3">
                      {optionsList.map((opt) => {
                        const isChosen = userChoice === opt.key
                        const isCorrect = isSubmitted && opt.key.toLowerCase() === q.correct_answer.toLowerCase()
                        const isWrong = isSubmitted && isChosen && !isCorrect

                        let cardStyle = 'border-slate-200 hover:bg-indigo-50/50 text-slate-700'
                        if (isChosen && !isSubmitted) {
                          cardStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                        }
                        if (isCorrect) {
                          cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                        }
                        if (isWrong) {
                          cardStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-semibold'
                        }

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleSelectOption(opt.key)}
                            className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </div>

                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            {isWrong && <XCircle className="w-5 h-5 text-rose-600" />}
                          </button>
                        )
                      })}
                    </div>

                    {isSubmitted && q.explanation && (
                      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs sm:text-sm text-indigo-950 space-y-1">
                        <strong className="text-indigo-900 block font-bold">Explanation:</strong>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    )}

                    {/* Stepper Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <button
                        disabled={currentQuestionIdx === 0}
                        onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 disabled:opacity-40 cursor-pointer"
                      >
                        Previous
                      </button>

                      {currentQuestionIdx < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
                        >
                          Next Question
                        </button>
                      ) : !isSubmitted ? (
                        <button
                          onClick={handleSubmitQuiz}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md cursor-pointer"
                        >
                          Submit Examination
                        </button>
                      ) : (
                        <button
                          onClick={handleReset}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Quiz</span>
                        </button>
                      )}
                    </div>

                    {isSubmitted && (
                      <div className="mt-6 p-6 rounded-3xl bg-slate-900 text-white text-center space-y-2">
                        <h4 className="text-xl font-extrabold">Final Score: {score}%</h4>
                        <p className="text-xs text-slate-300">
                          {score >= activeQuiz.passing_score
                            ? 'Passed! Congratulations on meeting the required pass mark.'
                            : 'Score below passing grade. Review the explanations above and retake when ready.'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()
            )}

          </div>
        )}

      </div>
    </div>
  )
}
