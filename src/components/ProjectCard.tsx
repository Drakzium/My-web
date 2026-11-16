import { Link } from 'react-router-dom'
import { ExternalLink, FolderGit2 } from 'lucide-react'
import { Badge } from './ui'
import type { Project } from '../types'

export function ProjectCard({ project }: { project: Project }) {
  const primary = project.links?.find((l) => l.isPrimary) || project.links?.[0]
  const github = project.links?.find((l) => l.linkType === 'github')

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface/80 transition hover:border-primary/40">
      <Link to={`/projects/${project.slug}`} className="block aspect-[16/10] overflow-hidden bg-surface-2">
        {project.thumbnail?.fileUrl ? (
          <img
            src={project.thumbnail.fileUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-primary/20 to-cyan/10 font-display text-2xl text-white/30">
            {project.title.slice(0, 1)}
          </div>
        )}
      </Link>
      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge>{project.category}</Badge>
          <Badge>{project.status}</Badge>
        </div>
        <Link to={`/projects/${project.slug}`}>
          <h3 className="font-display text-xl font-semibold hover:text-cyan">{project.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 5).map((t) => (
            <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-muted">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          {primary ? (
            <a href={primary.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ExternalLink size={14} /> {primary.title}
            </a>
          ) : null}
          {github && github.id !== primary?.id ? (
            <a href={github.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted hover:text-white">
              <FolderGit2 size={14} /> GitHub
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
