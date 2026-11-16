/** Prefix relative upload paths with API origin in production. */
export function mediaUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}
