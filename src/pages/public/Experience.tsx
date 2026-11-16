import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Section } from '../../components/ui'

type Experience = {
  title: string
  education: { title: string; detail: string }[]
  items: { title: string; detail: string; period?: string }[]
}

export function ExperiencePage() {
  const [data, setData] = useState<Experience | null>(null)
  useEffect(() => {
    api.get<Experience>('/api/public/content/experience').then(setData).catch(() => null)
  }, [])

  return (
    <Section title={data?.title || 'Experience'} subtitle="Education, development work, and learning journey.">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-4 font-display text-lg font-semibold text-cyan">Education</h3>
          <div className="space-y-4">
            {(data?.education || []).map((e) => (
              <div key={e.title} className="rounded-xl border border-border bg-surface/50 p-4">
                <p className="font-medium">{e.title}</p>
                <p className="mt-1 text-sm text-muted">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-display text-lg font-semibold text-cyan">Development</h3>
          <div className="space-y-4">
            {(data?.items || []).map((e) => (
              <div key={e.title} className="rounded-xl border border-border bg-surface/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{e.title}</p>
                  {e.period ? <span className="text-xs text-muted">{e.period}</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
