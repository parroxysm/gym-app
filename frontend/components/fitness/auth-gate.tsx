'use client'

import { useState, type FormEvent } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Props = {
  onSuccess: (token: string, user: { id: string; username: string }) => void
}

export function AuthGate({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Eroare la autentificare.')
        setLoading(false)
        return
      }

      localStorage.setItem('fitness_token', data.token)
      localStorage.setItem('fitness_user', JSON.stringify(data.user))
      onSuccess(data.token, data.user)
    } catch {
      setError('Nu se poate conecta la server (verifică backend-ul pe portul 5000).')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Fitness Hub</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === 'login'
              ? 'Autentifică-te pentru a-ți accesa antrenamentele.'
              : 'Creează un cont nou pentru a-ți salva progresul.'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`rounded-md py-1.5 transition ${
              mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`rounded-md py-1.5 transition ${
              mode === 'register' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Cont nou
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: viobosu123"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Parolă</label>
            <input
              type="password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {error && <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Se procesează…' : mode === 'login' ? 'Intră în cont' : 'Creează contul'}
          </button>
        </form>
      </div>
    </div>
  )
}