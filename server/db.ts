import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
/** Persistent volume path on Railway/Render/Fly (e.g. /data). Defaults to project root. */
const persistRoot = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : root
const dataDir = path.join(persistRoot, 'data')
const uploadsDir = path.join(persistRoot, 'uploads')

fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadsDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'noone.db'))
export { uploadsDir }

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content (
  section TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Software',
  technologies TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'In Progress',
  thumbnail_id TEXT,
  gallery TEXT NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  link_type TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  project_id TEXT,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`)

const defaults: Record<string, unknown> = {
  home: {
    brand: 'NO ONE LABS',
    headline: 'Engineering the future of software, AI, and interactive systems.',
    subheadline: 'Premium development across Python, AI/LLMs, Roblox, Discord bots, and automation.',
    ctaPrimary: { label: 'View Projects', href: '/projects' },
    ctaSecondary: { label: 'Contact', href: '/contact' },
  },
  about: {
    title: 'About',
    biography:
      'NO ONE LABS is a technology studio focused on high-performance software, AI systems, and creative engineering experiments.',
    interests: ['Software Development', 'AI & LLMs', 'Python', 'Roblox', 'Discord Bots', 'Automation'],
    journey:
      'From experimental scripts to production systems — continuously shipping technical work across platforms.',
  },
  skills: {
    title: 'Skills',
    groups: [
      { name: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Lua', 'SQL'] },
      { name: 'AI & LLM', items: ['Prompt Engineering', 'RAG Systems', 'Agent Workflows', 'OpenAI APIs'] },
      { name: 'Tools', items: ['React', 'Node.js', 'Vite', 'Git', 'Docker'] },
      { name: 'Platforms', items: ['Roblox', 'Discord', 'Web Apps', 'Automation'] },
    ],
  },
  services: {
    title: 'Services',
    items: [
      { name: 'Python Development', description: 'Scripts, APIs, data pipelines, and automation.' },
      { name: 'Discord Bot Development', description: 'Custom bots, moderation, and integrations.' },
      { name: 'Roblox Scripting', description: 'Gameplay systems, tools, and experiences.' },
      { name: 'AI Development', description: 'LLM apps, agents, and intelligent workflows.' },
      { name: 'Automation', description: 'Process automation and system orchestration.' },
      { name: 'Website Development', description: 'Modern, performant web applications.' },
    ],
  },
  experience: {
    title: 'Experience',
    education: [{ title: 'Self-Directed Engineering', detail: 'Continuous learning across software, AI, and platforms.' }],
    items: [
      { title: 'Independent Developer', detail: 'Building products, bots, games, and technical experiments.', period: 'Ongoing' },
    ],
  },
  contact: {
    title: 'Contact',
    email: '',
    message: 'Have a project in mind? Reach out.',
    socials: [] as { label: string; url: string }[],
  },
  footer: {
    tagline: 'NO ONE LABS — premium technology engineering.',
    links: [
      { label: 'Projects', href: '/projects' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  settings: {
    websiteTitle: 'NO ONE LABS',
    logoText: 'NO ONE LABS',
    theme: { background: '#07080D', primary: '#2563FF', secondary: '#22D3EE' },
    seo: { title: 'NO ONE LABS — Technology Portfolio', description: 'Software, AI, Python, Roblox, Discord bots, and automation.' },
    socialLinks: [] as { label: string; url: string }[],
    contactDetails: { email: '', location: '' },
  },
}

const insertContent = db.prepare(
  `INSERT OR IGNORE INTO content (section, data, published, updated_at) VALUES (?, ?, 1, ?)`,
)
const now = new Date().toISOString()
for (const [section, data] of Object.entries(defaults)) {
  insertContent.run(section, JSON.stringify(data), now)
}

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value)
}
