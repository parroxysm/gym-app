'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { FitnessProvider, useFitness } from '@/lib/fitness/store'
import { AuthGate } from './auth-gate'
import { DashboardView } from './dashboard/dashboard-view'
import { BottomNav, Sidebar, type Tab } from './navigation'
import { PlannerView } from './planner/planner-view'
import { ProfileView } from './profile/profile-view'
import { WorkoutView } from './workout/workout-view'

const subscribe = () => () => {}

export function AppShell() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [checkedStorage, setCheckedStorage] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('fitness_token')
    const savedUser = localStorage.getItem('fitness_user')
    if (savedToken) setToken(savedToken)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {}
    }
    setCheckedStorage(true)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('fitness_token')
    localStorage.removeItem('fitness_user')
    setToken(null)
    setUser(null)
  }, [])

  if (!mounted || !checkedStorage) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <span className="num text-xs text-muted-foreground">Se încarcă…</span>
      </div>
    )
  }

  if (!token) {
    return (
      <AuthGate
        onSuccess={(newToken, newUser) => {
          setToken(newToken)
          setUser(newUser)
        }}
      />
    )
  }

  return (
    <FitnessProvider token={token}>
      <Shell username={user?.username} onLogout={handleLogout} />
    </FitnessProvider>
  )
}

function Shell({ username, onLogout }: { username?: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { state } = useFitness()
  const sessionActive = state.session.startedAt !== null

  const navigate = useCallback((t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="min-h-dvh">
      <Sidebar tab={tab} onChange={navigate} sessionActive={sessionActive} />
      <main className="pb-28 md:pb-12 md:pl-56">
        <div className="mx-auto w-full max-w-5xl px-4 pt-5 md:px-8 md:pt-8">
          <div className="mb-4 flex items-center justify-end gap-3 text-xs text-muted-foreground">
            {username && <span>Salut, {username}</span>}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-border px-2.5 py-1 text-foreground transition hover:bg-muted"
            >
              Ieșire
            </button>
          </div>
          {tab === 'dashboard' && <DashboardView onNavigate={navigate} />}
          {tab === 'antrenament' && <WorkoutView onNavigate={navigate} />}
          {tab === 'planificare' && <PlannerView />}
          {tab === 'profil' && <ProfileView />}
        </div>
      </main>
      <BottomNav tab={tab} onChange={navigate} sessionActive={sessionActive} />
    </div>
  )
}