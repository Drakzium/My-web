import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { api } from '../../lib/api'
import { ProjectCard } from '../../components/ProjectCard'
import { Button, Section } from '../../components/ui'
import type { Project } from '../../types'

type HomeContent = {
  brand: string
  headline: string
  subheadline: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
}

export function HomePage() {
  const [home, setHome] = useState<HomeContent | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    api.get<HomeContent>('/api/public/content/home').then(setHome).catch(() => null)
    api.get<Project[]>('/api/public/projects').then((p) => setProjects(p.slice(0, 3))).catch(() => null)
  }, [])

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-sm font-semibold tracking-[0.2em] text-cyan uppercase"
          >
            {home?.brand || 'NO ONE LABS'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
          >
            {home?.headline || 'Engineering the future of software, AI, and interactive systems.'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 max-w-xl text-base text-muted md:text-lg"
          >
            {home?.subheadline ||
              'Premium development across Python, AI/LLMs, Roblox, Discord bots, and automation.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to={home?.ctaPrimary.href || '/projects'}>
              <Button>
                {home?.ctaPrimary.label || 'View Projects'} <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to={home?.ctaSecondary.href || '/contact'}>
              <Button variant="secondary">{home?.ctaSecondary.label || 'Contact'}</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Section title="Selected Projects" subtitle="Published work from the NO ONE LABS studio.">
        {projects.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <p className="text-muted">Projects will appear here once published.</p>
        )}
        <div className="mt-8">
          <Link to="/projects" className="text-sm text-primary hover:underline">
            Browse all projects →
          </Link>
        </div>
      </Section>
    </>
  )
}
