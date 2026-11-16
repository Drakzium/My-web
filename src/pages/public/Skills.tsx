import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Section } from '../../components/ui'

type Skills = { title: string; groups: { name: string; items: string[] }[] }

export function SkillsPage() {
  const [data, setData] = useState<Skills | null>(null)
  useEffect(() => {
    api.get<Skills>('/api/public/content/skills').then(setData).catch(() => null)
  }, [])

  return (
    <Section title={data?.title || 'Skills'} subtitle="Languages, AI/LLM stack, tools, and platforms.">
      <div className="grid gap-5 md:grid-cols-2">
        {(data?.groups || []).map((g) => (
          <div key={g.name} className="rounded-2xl border border-border bg-surface/60 p-6">
            <h3 className="font-display text-lg font-semibold">{g.name}</h3>
            <ul className="mt-4 space-y-2">
              {g.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
