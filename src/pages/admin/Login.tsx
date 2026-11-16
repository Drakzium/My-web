import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import { Button, Input, Label } from '../../components/ui'

export function AdminLoginPage() {
  const nav = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ authenticated: boolean; ownerPending: boolean }>('/api/auth/status').then((s) => {
      setPending(s.ownerPending)
      if (s.authenticated) nav('/admin')
    })
  }, [nav])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      await api.post('/api/auth/login', {
        email: fd.get('email'),
        password: fd.get('password'),
      })
      nav('/admin')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OWNER_PENDING') setPending(true)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-5">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <p className="font-display text-sm tracking-[0.18em] text-cyan uppercase">NO ONE LABS</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Admin Login</h1>
        {pending ? (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            Owner email is PENDING. Set <code className="text-cyan">OWNER_EMAIL</code> and{' '}
            <code className="text-cyan">OWNER_BOOTSTRAP_PASSWORD</code> in the environment, then restart the API.
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required disabled={pending} />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" required disabled={pending} minLength={10} />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || pending}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  )
}
