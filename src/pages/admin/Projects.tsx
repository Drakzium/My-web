import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui'
import type { Project } from '../../types'

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [q, setQ] = useState('')

  async function load() {
    const data = await api.get<Project[]>('/api/admin/projects')
    setProjects(data)
  }

  useEffect(() => {
    load().catch(() => setProjects([]))
  }, [])

  async function togglePublish(p: Project) {
    await api.put(`/api/admin/projects/${p.id}`, { ...p, published: !p.published })
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this project?')) return
    await api.del(`/api/admin/projects/${id}`)
    await load()
  }

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Projects</h1>
        <Link to="/admin/projects/new">
          <Button>Create project</Button>
        </Link>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search projects…"
        className="mt-6 w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      />
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link to={`/admin/projects/${p.id}`} className="hover:text-cyan">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.status}</td>
                <td className="px-4 py-3">{p.published ? 'Yes' : 'Draft'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => togglePublish(p)}>
                      {p.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="danger" onClick={() => remove(p.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <p className="p-4 text-muted">No projects.</p> : null}
      </div>
    </div>
  )
}
