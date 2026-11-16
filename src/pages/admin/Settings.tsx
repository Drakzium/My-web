import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Button, Textarea } from '../../components/ui'

export function AdminSettingsPage() {
  const [json, setJson] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api
      .get<{ data: unknown }>('/api/admin/content/settings')
      .then((r) => setJson(JSON.stringify(r.data, null, 2)))
      .catch((e) => setMsg(e.message))
  }, [])

  async function save() {
    try {
      const data = JSON.parse(json)
      await api.put('/api/admin/content/settings', { data, publish: true })
      setMsg('Settings published')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Website settings</h1>
      <p className="mt-1 text-sm text-muted">Title, SEO, theme, social links, contact details.</p>
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
        Owner email remains PENDING until you set <code>OWNER_EMAIL</code> (and optional{' '}
        <code>OWNER_BOOTSTRAP_PASSWORD</code>) in the server environment.
      </p>
      <Textarea className="mt-6 min-h-[420px] font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
      <Button className="mt-4" onClick={save}>
        Save settings
      </Button>
      {msg ? <p className="mt-3 text-sm text-cyan">{msg}</p> : null}
    </div>
  )
}
