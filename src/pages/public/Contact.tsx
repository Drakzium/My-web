import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { Button, Input, Label, Section, Textarea } from '../../components/ui'

type Contact = {
  title: string
  email: string
  message: string
  socials: { label: string; url: string }[]
}

export function ContactPage() {
  const [data, setData] = useState<Contact | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Contact>('/api/public/content/contact').then(setData).catch(() => null)
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    setStatus('')
    try {
      await api.post('/api/public/contact', {
        name: fd.get('name'),
        email: fd.get('email'),
        message: fd.get('message'),
      })
      setStatus('Message sent.')
      e.currentTarget.reset()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section title={data?.title || 'Contact'} subtitle={data?.message}>
      <div className="grid gap-10 md:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-surface/60 p-6">
          <div>
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea name="message" required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send message'}
          </Button>
          {status ? <p className="text-sm text-cyan">{status}</p> : null}
        </form>
        <div className="space-y-4">
          {data?.email ? (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Email</p>
              <a href={`mailto:${data.email}`} className="mt-1 block text-primary hover:underline">
                {data.email}
              </a>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {(data?.socials || []).map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm hover:border-cyan/40"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
