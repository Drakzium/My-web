import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button, Input } from '../../components/ui'
import type { MediaItem } from '../../types'

export function AdminMediaPage() {
  const [items, setItems] = useState<(MediaItem & { inUse?: boolean })[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)

  async function load(query = q) {
    const data = await api.get<(MediaItem & { inUse?: boolean })[]>(`/api/admin/media?q=${encodeURIComponent(query)}`)
    setItems(data)
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message))
  }, [])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setMsg('')
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('files', f))
      await api.post('/api/admin/media/upload', fd)
      setMsg('Upload complete')
      await load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function remove(id: string, force = false) {
    try {
      await api.del(`/api/admin/media/${id}${force ? '?force=1' : ''}`)
      await load()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'IN_USE_PUBLISHED') {
        if (confirm('Image is used by a published project. Delete anyway?')) await remove(id, true)
      } else setMsg(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Media Library</h1>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search images…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <Button variant="secondary" onClick={() => load()}>
          Search
        </Button>
        <label className="cursor-pointer">
          <span className="inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium">
            {uploading ? 'Uploading…' : 'Upload images'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>
      {msg ? <p className="mt-3 text-sm text-cyan">{msg}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <img src={mediaUrl(m.fileUrl)} alt={m.fileName} loading="lazy" className="aspect-video w-full object-cover" />
            <div className="space-y-1 p-3 text-xs text-muted">
              <p className="truncate text-white">{m.fileName}</p>
              <p>{(m.fileSize / 1024).toFixed(1)} KB · {m.fileType}</p>
              <p>{m.inUse ? 'In use' : 'Unused'}</p>
              <Button variant="danger" className="mt-2 w-full py-1.5 text-xs" onClick={() => remove(m.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      {!items.length ? <p className="mt-6 text-muted">No images yet.</p> : null}
    </div>
  )
}
