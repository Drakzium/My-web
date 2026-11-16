import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui'

type Stats = {
  total: number
  published: number
  drafts: number
  images: number
  recent: { id: string; title: string; updated_at: string; published: number }[]
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<Stats>('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [])

  const cards = [
    { label: 'Total projects', value: stats?.total ?? '—' },
    { label: 'Published', value: stats?.published ?? '—' },
    { label: 'Drafts', value: stats?.drafts ?? '—' },
    { label: 'Images', value: stats?.images ?? '—' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Website overview and quick actions</p>
        </div>
        <Link to="/admin/projects/new">
          <Button>New project</Button>
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-muted">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Recent updates</h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border">
          {(stats?.recent || []).map((r) => (
            <Link
              key={r.id}
              to={`/admin/projects/${r.id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5"
            >
              <span>{r.title}</span>
              <span className="text-muted">{r.published ? 'Published' : 'Draft'}</span>
            </Link>
          ))}
          {!stats?.recent?.length ? <p className="p-4 text-sm text-muted">No projects yet.</p> : null}
        </div>
      </div>
    </div>
  )
}
