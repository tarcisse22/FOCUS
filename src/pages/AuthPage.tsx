import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = mode === 'login' ? await signIn(email, password) : await signUp(email, password, name)
    setBusy(false)
    if (err) return setError(err)
    if (mode === 'signup') {
      const loginErr = await signIn(email, password)
      if (loginErr) return setInfo('Account created. Check your email to confirm, then log in.')
    }
    navigate('/app')
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm fade-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === 'login' ? 'Log in to continue your streak.' : 'Free forever. Start with five minutes.'}
          </p>

          {!supabaseConfigured && (
            <p className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
              Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and add your keys.
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarcisse" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-green-400">{info}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {mode === 'login' ? (
            <>No account? <Link to="/signup" className="text-primary-light hover:underline">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-primary-light hover:underline">Log in</Link></>
          )}
        </p>
      </div>
    </div>
  )
}
