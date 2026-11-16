import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'
import { db, getSetting, setSetting } from './db.js'

/** Owner email allowlist. Empty / PENDING = admin writes blocked until configured. */
export function getOwnerEmails(): string[] {
  const raw = (process.env.OWNER_EMAIL || getSetting('owner_email') || '').trim()
  if (!raw || raw.toUpperCase() === 'PENDING') return []
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

export function isOwnerConfigured(): boolean {
  return getOwnerEmails().length > 0
}

export function getSessionSecret(): string {
  let secret = process.env.SESSION_SECRET || getSetting('session_secret')
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex')
    setSetting('session_secret', secret)
  }
  return secret
}

export function createSession(email: string): string {
  const id = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO sessions (id, email, expires_at) VALUES (?, ?, ?)').run(id, email.toLowerCase(), expires)
  return id
}

export function destroySession(id: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

export function getSessionEmail(id?: string): string | null {
  if (!id) return null
  const row = db.prepare('SELECT email, expires_at FROM sessions WHERE id = ?').get(id) as
    | { email: string; expires_at: string }
    | undefined
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    destroySession(id)
    return null
  }
  return row.email
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = getSetting('owner_password_hash')
  if (!hash) {
    const bootstrap = process.env.OWNER_BOOTSTRAP_PASSWORD
    if (bootstrap && password === bootstrap) {
      const newHash = await bcrypt.hash(password, 12)
      setSetting('owner_password_hash', newHash)
      return true
    }
    return false
  }
  return bcrypt.compare(password, hash)
}

export async function setOwnerPassword(password: string) {
  const hash = await bcrypt.hash(password, 12)
  setSetting('owner_password_hash', hash)
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!isOwnerConfigured()) {
    return res.status(403).json({
      error: 'Owner email is PENDING. Set OWNER_EMAIL or configure owner email in settings before admin access.',
      code: 'OWNER_PENDING',
    })
  }
  const sid = req.cookies?.nol_session as string | undefined
  const email = getSessionEmail(sid)
  if (!email || !getOwnerEmails().includes(email)) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' })
  }
  ;(req as Request & { ownerEmail?: string }).ownerEmail = email
  next()
}
