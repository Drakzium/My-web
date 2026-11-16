import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { Request as ExpressRequest } from 'express'
import { db, uploadsDir, setSetting } from './db.js'
import {
  createSession,
  destroySession,
  getOwnerEmails,
  getSessionEmail,
  isOwnerConfigured,
  requireOwner,
  setOwnerPassword,
  verifyPassword,
} from './auth.js'

const app = express()
const PORT = Number(process.env.PORT || 3001)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(uploadsDir))

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 8 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP'))
      return
    }
    cb(null, true)
  },
})

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || randomUUID().slice(0, 8)
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function projectRow(row: Record<string, unknown>, includeDraft = false) {
  if (!includeDraft && !row.published) return null
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    technologies: parseJson(String(row.technologies), [] as string[]),
    status: row.status,
    thumbnailId: row.thumbnail_id,
    gallery: parseJson(String(row.gallery), [] as string[]),
    displayOrder: row.display_order,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getLinks(projectId: string) {
  return db
    .prepare('SELECT * FROM project_links WHERE project_id = ? ORDER BY display_order ASC, title ASC')
    .all(projectId)
    .map((l: Record<string, unknown>) => ({
      id: l.id,
      projectId: l.project_id,
      title: l.title,
      linkType: l.link_type,
      url: l.url,
      icon: l.icon,
      isPrimary: Boolean(l.is_primary),
      displayOrder: l.display_order,
    }))
}

function getMediaById(id: string | null) {
  if (!id) return null
  const m = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!m) return null
  return {
    id: m.id,
    fileUrl: m.file_url,
    fileName: m.file_name,
    fileType: m.file_type,
    fileSize: m.file_size,
    projectId: m.project_id,
    uploadedAt: m.uploaded_at,
  }
}

function enrichProject(p: ReturnType<typeof projectRow>) {
  if (!p) return null
  const galleryIds = p.gallery as string[]
  return {
    ...p,
    thumbnail: getMediaById(p.thumbnailId as string | null),
    galleryImages: galleryIds.map((id) => getMediaById(id)).filter(Boolean),
    links: getLinks(p.id as string).filter((l) => l.url),
  }
}

const urlSchema = z.string().url().or(z.literal(''))

/* ---------- Auth ---------- */
app.get('/api/auth/status', (req, res) => {
  const sid = req.cookies?.nol_session
  const email = getSessionEmail(sid)
  const owners = getOwnerEmails()
  res.json({
    authenticated: Boolean(email && owners.includes(email)),
    email: email && owners.includes(email) ? email : null,
    ownerConfigured: isOwnerConfigured(),
    ownerPending: !isOwnerConfigured(),
  })
})

app.post('/api/auth/login', async (req, res) => {
  if (!isOwnerConfigured()) {
    return res.status(403).json({ error: 'Owner email is PENDING', code: 'OWNER_PENDING' })
  }
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!getOwnerEmails().includes(email)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const ok = await verifyPassword(password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const sid = createSession(email)
  res.cookie('nol_session', sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({ ok: true, email })
})

app.post('/api/auth/logout', (req, res) => {
  const sid = req.cookies?.nol_session
  if (sid) destroySession(sid)
  res.clearCookie('nol_session')
  res.json({ ok: true })
})

app.post('/api/auth/setup-password', requireOwner, async (req, res) => {
  const password = String(req.body?.password || '')
  if (password.length < 10) return res.status(400).json({ error: 'Password must be at least 10 characters' })
  await setOwnerPassword(password)
  res.json({ ok: true })
})

/* ---------- Public content ---------- */
app.get('/api/public/content/:section', (req, res) => {
  const row = db.prepare('SELECT data, published FROM content WHERE section = ?').get(req.params.section) as
    | { data: string; published: number }
    | undefined
  if (!row || !row.published) return res.status(404).json({ error: 'Not found' })
  res.json(parseJson(row.data, {}))
})

app.get('/api/public/settings', (_req, res) => {
  const row = db.prepare('SELECT data FROM content WHERE section = ? AND published = 1').get('settings') as
    | { data: string }
    | undefined
  res.json(parseJson(row?.data || '{}', {}))
})

app.get('/api/public/projects', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM projects WHERE published = 1 ORDER BY display_order ASC, updated_at DESC')
    .all() as Record<string, unknown>[]
  res.json(rows.map((r) => enrichProject(projectRow(r))).filter(Boolean))
})

app.get('/api/public/projects/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE slug = ? AND published = 1').get(req.params.slug) as
    | Record<string, unknown>
    | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(enrichProject(projectRow(row)))
})

app.post('/api/public/contact', (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 120)
  const email = String(req.body?.email || '').trim().slice(0, 200)
  const message = String(req.body?.message || '').trim().slice(0, 5000)
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' })
  const id = randomUUID()
  const key = `contact_message_${id}`
  setSetting(key, JSON.stringify({ id, name, email, message, createdAt: new Date().toISOString() }))
  res.json({ ok: true })
})

/* ---------- Admin dashboard stats ---------- */
app.get('/api/admin/stats', requireOwner, (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c
  const published = (db.prepare('SELECT COUNT(*) as c FROM projects WHERE published = 1').get() as { c: number }).c
  const drafts = total - published
  const images = (db.prepare('SELECT COUNT(*) as c FROM media').get() as { c: number }).c
  const recent = db
    .prepare('SELECT id, title, updated_at, published FROM projects ORDER BY updated_at DESC LIMIT 8')
    .all()
  res.json({ total, published, drafts, images, recent })
})

/* ---------- Content CMS ---------- */
app.get('/api/admin/content/:section', requireOwner, (req, res) => {
  const row = db.prepare('SELECT data, published, updated_at FROM content WHERE section = ?').get(req.params.section) as
    | { data: string; published: number; updated_at: string }
    | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ data: parseJson(row.data, {}), published: Boolean(row.published), updatedAt: row.updated_at })
})

app.put('/api/admin/content/:section', requireOwner, (req, res) => {
  const section = req.params.section
  const allowed = ['home', 'about', 'skills', 'services', 'experience', 'contact', 'footer', 'settings']
  if (!allowed.includes(section)) return res.status(400).json({ error: 'Invalid section' })
  const publish = req.body?.publish !== false
  const data = req.body?.data ?? req.body
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO content (section, data, published, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(section) DO UPDATE SET data = excluded.data, published = excluded.published, updated_at = excluded.updated_at`,
  ).run(section, JSON.stringify(data), publish ? 1 : 0, now)
  res.json({ ok: true, updatedAt: now })
})

/* ---------- Projects ---------- */
app.get('/api/admin/projects', requireOwner, (_req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY display_order ASC, updated_at DESC').all() as Record<
    string,
    unknown
  >[]
  res.json(rows.map((r) => enrichProject(projectRow(r, true))))
})

app.get('/api/admin/projects/:id', requireOwner, (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(enrichProject(projectRow(row, true)))
})

app.post('/api/admin/projects', requireOwner, (req, res) => {
  const title = String(req.body?.title || 'Untitled Project').trim()
  const id = randomUUID()
  let slug = slugify(String(req.body?.slug || title))
  const existing = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug)
  if (existing) slug = `${slug}-${id.slice(0, 6)}`
  const now = new Date().toISOString()
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(display_order), 0) as m FROM projects').get() as { m: number }).m
  db.prepare(
    `INSERT INTO projects (id, title, slug, description, category, technologies, status, thumbnail_id, gallery, display_order, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    title,
    slug,
    String(req.body?.description || ''),
    String(req.body?.category || 'Software'),
    JSON.stringify(req.body?.technologies || []),
    String(req.body?.status || 'Draft'),
    req.body?.thumbnailId || null,
    JSON.stringify(req.body?.gallery || []),
    Number(req.body?.displayOrder ?? maxOrder + 1),
    req.body?.published ? 1 : 0,
    now,
    now,
  )
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json(enrichProject(projectRow(row, true)))
})

app.put('/api/admin/projects/:id', requireOwner, (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const title = req.body.title !== undefined ? String(req.body.title).trim() : String(row.title)
  let slug = req.body.slug !== undefined ? slugify(String(req.body.slug)) : String(row.slug)
  const clash = db.prepare('SELECT id FROM projects WHERE slug = ? AND id != ?').get(slug, req.params.id)
  if (clash) slug = `${slug}-${String(req.params.id).slice(0, 6)}`
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE projects SET title=?, slug=?, description=?, category=?, technologies=?, status=?, thumbnail_id=?, gallery=?, display_order=?, published=?, updated_at=? WHERE id=?`,
  ).run(
    title,
    slug,
    req.body.description !== undefined ? String(req.body.description) : row.description,
    req.body.category !== undefined ? String(req.body.category) : row.category,
    JSON.stringify(req.body.technologies !== undefined ? req.body.technologies : parseJson(String(row.technologies), [])),
    req.body.status !== undefined ? String(req.body.status) : row.status,
    req.body.thumbnailId !== undefined ? req.body.thumbnailId : row.thumbnail_id,
    JSON.stringify(req.body.gallery !== undefined ? req.body.gallery : parseJson(String(row.gallery), [])),
    req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : row.display_order,
    req.body.published !== undefined ? (req.body.published ? 1 : 0) : row.published,
    now,
    req.params.id,
  )
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json(enrichProject(projectRow(updated, true)))
})

app.delete('/api/admin/projects/:id', requireOwner, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.post('/api/admin/projects/reorder', requireOwner, (req, res) => {
  const ids = req.body?.ids as string[]
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' })
  const stmt = db.prepare('UPDATE projects SET display_order = ?, updated_at = ? WHERE id = ?')
  const now = new Date().toISOString()
  const tx = db.transaction(() => {
    ids.forEach((id, i) => stmt.run(i, now, id))
  })
  tx()
  res.json({ ok: true })
})

/* ---------- Project links ---------- */
app.get('/api/admin/projects/:id/links', requireOwner, (req, res) => {
  res.json(getLinks(req.params.id))
})

app.post('/api/admin/projects/:id/links', requireOwner, (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const url = String(req.body?.url || '').trim()
  const parsed = urlSchema.safeParse(url)
  if (!parsed.success || !url) return res.status(400).json({ error: 'Valid URL required' })
  const id = randomUUID()
  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(display_order), 0) as m FROM project_links WHERE project_id = ?').get(req.params.id) as {
      m: number
    }
  ).m
  db.prepare(
    `INSERT INTO project_links (id, project_id, title, link_type, url, icon, is_primary, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    req.params.id,
    String(req.body?.title || 'Link').trim(),
    String(req.body?.linkType || 'custom'),
    url,
    req.body?.icon || null,
    req.body?.isPrimary ? 1 : 0,
    Number(req.body?.displayOrder ?? maxOrder + 1),
  )
  if (req.body?.isPrimary) {
    db.prepare('UPDATE project_links SET is_primary = 0 WHERE project_id = ? AND id != ?').run(req.params.id, id)
  }
  res.status(201).json(getLinks(req.params.id).find((l) => l.id === id))
})

app.put('/api/admin/links/:linkId', requireOwner, (req, res) => {
  const link = db.prepare('SELECT * FROM project_links WHERE id = ?').get(req.params.linkId) as
    | Record<string, unknown>
    | undefined
  if (!link) return res.status(404).json({ error: 'Not found' })
  const url = req.body.url !== undefined ? String(req.body.url).trim() : String(link.url)
  if (!urlSchema.safeParse(url).success || !url) return res.status(400).json({ error: 'Valid URL required' })
  db.prepare(
    `UPDATE project_links SET title=?, link_type=?, url=?, icon=?, is_primary=?, display_order=? WHERE id=?`,
  ).run(
    req.body.title !== undefined ? String(req.body.title).trim() : link.title,
    req.body.linkType !== undefined ? String(req.body.linkType) : link.link_type,
    url,
    req.body.icon !== undefined ? req.body.icon : link.icon,
    req.body.isPrimary !== undefined ? (req.body.isPrimary ? 1 : 0) : link.is_primary,
    req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : link.display_order,
    req.params.linkId,
  )
  if (req.body?.isPrimary) {
    db.prepare('UPDATE project_links SET is_primary = 0 WHERE project_id = ? AND id != ?').run(link.project_id, req.params.linkId)
  }
  res.json(getLinks(String(link.project_id)).find((l) => l.id === req.params.linkId))
})

app.delete('/api/admin/links/:linkId', requireOwner, (req, res) => {
  db.prepare('DELETE FROM project_links WHERE id = ?').run(req.params.linkId)
  res.json({ ok: true })
})

/* ---------- Media ---------- */
app.get('/api/admin/media', requireOwner, (req, res) => {
  const q = String(req.query.q || '').toLowerCase()
  let rows = db.prepare('SELECT * FROM media ORDER BY uploaded_at DESC').all() as Record<string, unknown>[]
  if (q) rows = rows.filter((m) => String(m.file_name).toLowerCase().includes(q))
  const usedThumb = new Set(
    (db.prepare('SELECT thumbnail_id FROM projects WHERE thumbnail_id IS NOT NULL').all() as { thumbnail_id: string }[]).map(
      (r) => r.thumbnail_id,
    ),
  )
  const usedGallery = new Set<string>()
  for (const p of db.prepare('SELECT gallery FROM projects').all() as { gallery: string }[]) {
    for (const id of parseJson(p.gallery, [] as string[])) usedGallery.add(id)
  }
  res.json(
    rows.map((m) => ({
      id: m.id,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileType: m.file_type,
      fileSize: m.file_size,
      projectId: m.project_id,
      uploadedAt: m.uploaded_at,
      inUse: usedThumb.has(String(m.id)) || usedGallery.has(String(m.id)) || Boolean(m.project_id),
    })),
  )
})

app.post('/api/admin/media/upload', requireOwner, (req, res) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' })
    const files = (req as ExpressRequest & { files?: Express.Multer.File[] }).files
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' })
    const projectId = (req.body as { projectId?: string })?.projectId || null
    const created = files.map((f) => {
      const id = randomUUID()
      const fileUrl = `/uploads/${f.filename}`
      db.prepare(
        `INSERT INTO media (id, file_url, file_name, file_type, file_size, project_id, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(id, fileUrl, f.originalname, f.mimetype, f.size, projectId, new Date().toISOString())
      return { id, fileUrl, fileName: f.originalname, fileType: f.mimetype, fileSize: f.size, projectId, uploadedAt: new Date().toISOString() }
    })
    res.status(201).json(created)
  })
})

app.delete('/api/admin/media/:id', requireOwner, (req, res) => {
  const force = req.query.force === '1'
  const m = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!m) return res.status(404).json({ error: 'Not found' })
  const asThumb = db.prepare('SELECT id, published FROM projects WHERE thumbnail_id = ?').get(req.params.id) as
    | { id: string; published: number }
    | undefined
  const inGallery = (
    db.prepare('SELECT id, published, gallery FROM projects').all() as { id: string; published: number; gallery: string }[]
  ).filter((p) => parseJson(p.gallery, [] as string[]).includes(req.params.id))
  const usedPublished =
    (asThumb && asThumb.published === 1) || inGallery.some((p) => p.published === 1)
  if (usedPublished && !force) {
    return res.status(409).json({
      error: 'Image is used by a published project. Confirm deletion.',
      code: 'IN_USE_PUBLISHED',
    })
  }
  if (asThumb) db.prepare('UPDATE projects SET thumbnail_id = NULL WHERE thumbnail_id = ?').run(req.params.id)
  for (const p of inGallery) {
    const g = parseJson(p.gallery, [] as string[]).filter((id) => id !== req.params.id)
    db.prepare('UPDATE projects SET gallery = ? WHERE id = ?').run(JSON.stringify(g), p.id)
  }
  const filename = path.basename(String(m.file_url))
  const fp = path.join(uploadsDir, filename)
  if (fs.existsSync(fp)) fs.unlinkSync(fp)
  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

/* ---------- Owner email config (admin only once authenticated OR bootstrap via env) ---------- */
app.post('/api/admin/owner-email', requireOwner, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' })
  setSetting('owner_email', email)
  res.json({ ok: true, email })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Server error' })
})

app.listen(PORT, () => {
  console.log(`NO ONE LABS API on http://localhost:${PORT}`)
  console.log(`Owner configured: ${isOwnerConfigured()} (OWNER_EMAIL=${process.env.OWNER_EMAIL || 'PENDING'})`)
})
