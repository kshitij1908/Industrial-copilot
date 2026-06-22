import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names with clsx support.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a byte count into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format an ISO date string to a localized human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

/**
 * Format an ISO date string to a relative time string (e.g. "2 hours ago").
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
  } catch {
    return '-'
  }
}

/**
 * Return a Tailwind text color class based on confidence score (0–100).
 */
export function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

/**
 * Return Tailwind badge classes (bg + border + text) based on confidence score.
 */
export function getConfidenceBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
  if (score >= 60) return 'bg-amber-500/20 border-amber-500/30 text-amber-400'
  return 'bg-red-500/20 border-red-500/30 text-red-400'
}

/**
 * Truncate a string to n characters, appending '...' if truncated.
 */
export function truncate(str: string, n: number): string {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '...' : str
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Generate a deterministic hue value from a string (for avatar colors, etc.)
 */
export function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/**
 * Debounce a function call by delay ms.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Return a color class for document type badges.
 */
export function getDocumentTypeColor(docType: string): string {
  const map: Record<string, string> = {
    manual: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    datasheet: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    procedure: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
    report: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    specification: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    drawing: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
    other: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
  }
  return map[docType?.toLowerCase()] ?? map['other']
}

/**
 * Return status badge classes for document processing status.
 */
export function getStatusClasses(status: string): string {
  const map: Record<string, string> = {
    ready: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    processing: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    pending: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
    failed: 'bg-red-500/20 border-red-500/30 text-red-400',
  }
  return map[status?.toLowerCase()] ?? map['pending']
}
