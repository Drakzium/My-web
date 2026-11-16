export type MediaItem = {
  id: string
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  projectId?: string | null
  uploadedAt: string
  inUse?: boolean
}

export type ProjectLink = {
  id: string
  projectId: string
  title: string
  linkType: string
  url: string
  icon?: string | null
  isPrimary: boolean
  displayOrder: number
}

export type Project = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  technologies: string[]
  status: string
  thumbnailId?: string | null
  gallery: string[]
  displayOrder: number
  published: boolean
  createdAt: string
  updatedAt: string
  thumbnail?: MediaItem | null
  galleryImages?: (MediaItem | null)[]
  links?: ProjectLink[]
}

export type SiteSettings = {
  websiteTitle: string
  logoText: string
  theme: { background: string; primary: string; secondary: string }
  seo: { title: string; description: string }
  socialLinks: { label: string; url: string }[]
  contactDetails: { email: string; location: string }
}
