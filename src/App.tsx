import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import { NavigationDrawer } from './components/NavigationDrawer'
import { Footer } from './components/Footer'
import { AuthModal } from './components/AuthModal'
import { SearchModal } from './components/SearchModal'
import { Home } from './pages/Home'
import { GroupsPage } from './pages/GroupsPage'
import { SessionsPage } from './pages/SessionsPage'
import { QuizzesPage } from './pages/QuizzesPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { GoalsPage } from './pages/GoalsPage'
import { AdminPage } from './pages/AdminPage'

function MainApp() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth()
  const [currentPage, setCurrentPage] = useState<string>('home')
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false)

  // Scroll to top when page changes
  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Keyboard shortcut: '/' opens search, 'Escape' closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isSearchModalOpen && !isAuthModalOpen) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsSearchModalOpen(true)
        }
      }
      if (e.key === 'Escape') {
        setIsDrawerOpen(false)
        setIsAuthModalOpen(false)
        setIsSearchModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchModalOpen, isAuthModalOpen])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1e] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 font-semibold text-sm">
            Initializing Virtual Study Group Portal...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf5f2] text-slate-900 selection:bg-primary-500 selection:text-white">
      
      {/* ── Slide-over Navigation Drawer (Triggered by 3 lines on top-left) ── */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        user={user}
        profile={profile}
      />

      {/* ── Institutional Top Bar & Navbar ── */}
      <Navbar
        onOpenDrawer={() => setIsDrawerOpen(true)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        user={user}
        profile={profile}
        signOut={signOut}
      />

      {/* ── Page Content Views ── */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <Home
            onNavigate={handleNavigate}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            user={user}
          />
        )}
        {currentPage === 'groups' && (
          <GroupsPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        {currentPage === 'sessions' && (
          <SessionsPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        {currentPage === 'quizzes' && (
          <QuizzesPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        {currentPage === 'resources' && (
          <ResourcesPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        {currentPage === 'goals' && (
          <GoalsPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            onNavigate={handleNavigate}
            user={user}
          />
        )}
      </main>

      {/* ── Multi-Column Institutional Footer ── */}
      <Footer onNavigate={handleNavigate} />

      {/* ── Auth Modal ── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* ── Global Search Modal ── */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
