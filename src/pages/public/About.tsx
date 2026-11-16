import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Badge, Section } from '../../components/ui'

type About = {
  title: string
  biography: string
  interests: string[]
  journey: string
}

export function AboutPage() {
  const [data, setData] = useState<About | null>(null)
  useEffect(() => {
    api.get<About>('/api/public/content/about').then(setData).catch(() => null)
  }, [])

  return (
    <Section title={data?.title || 'About'} subtitle="Biography, interests, and development journey.">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/60 p-6">
          <h3 className="font-display text-lg font-semibold">Biography</h3>
          <p className="mt-3 whitespace-pre-wrap text-muted">{data?.biography}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 p-6">
          <h3 className="font-display text-lg font-semibold">Journey</h3>
          <p className="mt-3 text-muted">{data?.journey}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(data?.interests || []).map((i) => (
              <Badge key={i}>{i}</Badge>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
