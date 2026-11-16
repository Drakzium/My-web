import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui'
import type { Project } from '../../types'

export function ProjectDetailPage() {
  const { slug } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    api
      .get<Project>(`/api/public/projects/${slug}`)
      .then(setProject)
      .catch(() => setError('Project not found'))
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24">
        <p className="text-muted">{error}</p>
        <Link to="/projects" className="mt-4 inline-block text-primary">
          Back to projects
        </Link>
      </div>
    )
  }

  if (!project) return <div className="mx-auto max-w-6xl px-5 py-24 text-muted">Loading…</div>

  const images = [project.thumbnail, ...(project.galleryImages || [])].filter(Boolean)

  return (
    <article className="mx-auto max-w-6xl px-5 py-16">
      <Link to="/projects" className="text-sm text-muted hover:text-white">
        ← Projects
      </Link>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge>{project.category}</Badge>
        <Badge>{project.status}</Badge>
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">{project.title}</h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">{project.description}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.technologies.map((t) => (
          <span key={t} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-muted">
            {t}
          </span>
        ))}
      </div>

      {(project.links || []).length ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {project.links!.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:border-primary/50"
            >
              <ExternalLink size={14} /> {l.title}
            </a>
          ))}
        </div>
      ) : null}

      {images.length ? (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {images.map((img) =>
            img ? (
              <img
                key={img.id}
                src={img.fileUrl}
                alt={project.title}
                loading="lazy"
                className="w-full rounded-2xl border border-border object-cover"
              />
            ) : null,
          )}
        </div>
      ) : null}
    </article>
  )
}
