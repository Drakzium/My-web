import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button, Input, Label, Textarea } from '../../components/ui'
import type { MediaItem, Project, ProjectLink } from '../../types'

const LINK_TYPES = [
  'live',
  'github',
  'roblox',
  'youtube',
  'discord',
  'docs',
  'custom',
] as const

const empty: Partial<Project> = {
  title: '',
  slug: '',
  description: '',
  category: 'Software',
  technologies: [],
  status: 'Draft',
  gallery: [],
  published: false,
}

export function AdminProjectEditorPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const [form, setForm] = useState<Partial<Project>>(empty)
  const [tech, setTech] = useState('')
  const [links, setLinks] = useState<ProjectLink[]>([])
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [linkForm, setLinkForm] = useState({ title: '', url: '', linkType: 'github', isPrimary: false })

  async function load(projectId: string) {
    const p = await api.get<Project>(`/api/admin/projects/${projectId}`)
    setForm(p)
    setTech((p.technologies || []).join(', '))
    setLinks(p.links || [])
  }

  useEffect(() => {
    if (!isNew && id) load(id).catch((e) => setMsg(e.message))
  }, [id, isNew])

  async function save(publish?: boolean) {
    setMsg('')
    const payload = {
      ...form,
      technologies: tech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      published: publish !== undefined ? publish : Boolean(form.published),
    }
    try {
      if (isNew) {
        const created = await api.post<Project>('/api/admin/projects', payload)
        setMsg('Created')
        nav(`/admin/projects/${created.id}`, { replace: true })
      } else {
        await api.put(`/api/admin/projects/${id}`, payload)
        setMsg(publish === true ? 'Published' : publish === false ? 'Unpublished' : 'Saved')
        await load(id!)
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed')
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  async function upload(files: FileList | null) {
    if (!files?.length || isNew || !id) {
      setMsg(isNew ? 'Save the project first, then upload images.' : 'No files')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('files', f))
      fd.append('projectId', id)
      const created = await api.post<MediaItem[]>('/api/admin/media/upload', fd)
      const gallery = [...(form.gallery || []), ...created.map((m) => m.id)]
      const thumbnailId = form.thumbnailId || created[0]?.id
      await api.put(`/api/admin/projects/${id}`, { ...form, gallery, thumbnailId, technologies: form.technologies })
      await load(id)
      setMsg('Images uploaded')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function setThumbnail(mediaId: string) {
    await api.put(`/api/admin/projects/${id}`, { ...form, thumbnailId: mediaId })
    await load(id!)
  }

  async function removeFromGallery(mediaId: string) {
    const gallery = (form.gallery || []).filter((g) => g !== mediaId)
    const thumbnailId = form.thumbnailId === mediaId ? gallery[0] || null : form.thumbnailId
    await api.put(`/api/admin/projects/${id}`, { ...form, gallery, thumbnailId })
    await load(id!)
  }

  async function addLink(e: FormEvent) {
    e.preventDefault()
    if (isNew || !id) return setMsg('Save project first')
    await api.post(`/api/admin/projects/${id}/links`, linkForm)
    setLinkForm({ title: '', url: '', linkType: 'github', isPrimary: false })
    await load(id)
  }

  async function deleteLink(linkId: string) {
    await api.del(`/api/admin/links/${linkId}`)
    await load(id!)
  }

  return (
    <div>
      <Link to="/admin/projects" className="text-sm text-muted hover:text-white">
        ← Projects
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold">{isNew ? 'New project' : 'Edit project'}</h1>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div>
            <Label>Title</Label>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Technologies (comma-separated)</Label>
            <Input value={tech} onChange={(e) => setTech(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Save draft</Button>
            <Button type="button" variant="secondary" onClick={() => void save(true)}>
              Publish
            </Button>
            <Button type="button" variant="ghost" onClick={() => void save(false)}>
              Unpublish
            </Button>
            {!isNew && form.slug ? (
              <a href={`/projects/${form.slug}`} target="_blank" rel="noreferrer">
                <Button type="button" variant="ghost">
                  Preview
                </Button>
              </a>
            ) : null}
          </div>
          {msg ? <p className="text-sm text-cyan">{msg}</p> : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display font-semibold">Images</h2>
            <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP · max 8MB · multiple upload</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-4 block w-full text-sm"
              disabled={uploading || isNew}
              onChange={(e) => upload(e.target.files)}
            />
            {uploading ? <p className="mt-2 text-sm text-muted">Uploading…</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(form.galleryImages || []).map((img) =>
                img ? (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-border">
                    <img src={mediaUrl(img.fileUrl)} alt="" className="aspect-video w-full object-cover" />
                    <div className="flex gap-1 p-2">
                      <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => setThumbnail(img.id)}>
                        {form.thumbnailId === img.id ? 'Thumbnail' : 'Set thumb'}
                      </Button>
                      <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={() => removeFromGallery(img.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-display font-semibold">Links</h2>
            <ul className="mt-3 space-y-2">
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <p>
                      {l.title} <span className="text-muted">({l.linkType})</span>
                      {l.isPrimary ? <span className="ml-2 text-cyan">primary</span> : null}
                    </p>
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-primary">
                      {l.url}
                    </a>
                  </div>
                  <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={() => deleteLink(l.id)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
            <form onSubmit={addLink} className="mt-4 space-y-3 border-t border-border pt-4">
              <Input placeholder="Title" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} required />
              <Input placeholder="https://" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} required />
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={linkForm.linkType}
                onChange={(e) => setLinkForm({ ...linkForm, linkType: e.target.value })}
              >
                {LINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={linkForm.isPrimary}
                  onChange={(e) => setLinkForm({ ...linkForm, isPrimary: e.target.checked })}
                />
                Primary link
              </label>
              <Button type="submit" variant="secondary">
                Add link
              </Button>
            </form>
          </div>
        </div>
      </form>
    </div>
  )
}
