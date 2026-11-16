import { cn } from '../lib/cn'
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, PropsWithChildren } from 'react'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'secondary' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-white hover:brightness-110',
        variant === 'secondary' && 'bg-surface-2 text-white border border-border hover:border-primary/40',
        variant === 'ghost' && 'bg-transparent text-muted hover:text-white hover:bg-white/5',
        variant === 'danger' && 'bg-red-600/90 text-white hover:bg-red-500',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60 min-h-28',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <label className={cn('mb-1.5 block text-xs uppercase tracking-wider text-muted', className)}>{children}</label>
}

export function Section({
  title,
  subtitle,
  children,
  id,
}: PropsWithChildren<{ title: string; subtitle?: string; id?: string }>) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Badge({ children }: PropsWithChildren) {
  return (
    <span className="rounded-md border border-border bg-white/5 px-2 py-0.5 text-xs text-cyan/90">{children}</span>
  )
}
