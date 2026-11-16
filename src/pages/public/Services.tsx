import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Section } from '../../components/ui'

type Services = { title: string; items: { name: string; description: string }[] }

export function ServicesPage() {
  const [data, setData] = useState<Services | null>(null)
  useEffect(() => {
    api.get<Services>('/api/public/content/services').then(setData).catch(() => null)
  }, [])

  return (
    <Section title={data?.title || 'Services'} subtitle="What NO ONE LABS builds.">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(data?.items || []).map((s) => (
          <div key={s.name} className="rounded-2xl border border-border bg-gradient-to-b from-surface to-bg p-6">
            <h3 className="font-display text-lg font-semibold">{s.name}</h3>
            <p className="mt-3 text-sm text-muted">{s.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
