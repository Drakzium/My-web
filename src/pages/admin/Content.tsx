import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Button, Textarea } from '../../components/ui'

const SECTIONS = ['home', 'about', 'skills', 'services', 'experience', 'contact', 'footer'] as const

export function AdminContentPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('home')
  const [json, setJson] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api
      .get<{ data: unknown }>(`/api/admin/content/${section}`)
      .then((r) => setJson(JSON.stringify(r.data, null, 2)))
      .catch((e) => setMsg(e.message))
  }, [section])

  async function save(publish = true) {
    try {
      const data = JSON.parse(json)
      await api.put(`/api/admin/content/${section}`, { data, publish })
      setMsg(publish ? 'Published' : 'Saved draft')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Invalid JSON / save failed')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Content</h1>
      <p className="mt-1 text-sm text-muted">Edit website sections as structured JSON, then publish.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Button key={s} variant={section === s ? 'primary' : 'secondary'} onClick={() => setSection(s)}>
            {s}
          </Button>
        ))}
      </div>
      <Textarea className="mt-6 min-h-[420px] font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
      <div className="mt-4 flex gap-2">
        <Button onClick={() => save(true)}>Save & publish</Button>
        <Button variant="secondary" onClick={() => save(false)}>
          Save draft
        </Button>
      </div>
      {msg ? <p className="mt-3 text-sm text-cyan">{msg}</p> : null}
    </div>
  )
}
