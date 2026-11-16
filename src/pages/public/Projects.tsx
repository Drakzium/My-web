import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { ProjectCard } from '../../components/ProjectCard'
import { Section } from '../../components/ui'
import type { Project } from '../../types'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Project[]>('/api/public/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Section title="Projects" subtitle="Software, AI, Roblox, bots, and technical experiments.">
      {loading ? <p className="text-muted">Loading…</p> : null}
      {!loading && !projects.length ? <p className="text-muted">No published projects yet.</p> : null}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </Section>
  )
}
