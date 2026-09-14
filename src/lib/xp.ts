export const XP_PER_MINUTE = 10

export function xpForSeconds(seconds: number): number {
  return Math.floor(seconds / 60) * XP_PER_MINUTE
}

// Level n requires 500 * n * (n - 1) / 2 ... simplified: each level needs 500 more XP than the last.
export function levelFromXp(xp: number) {
  let level = 1
  let needed = 500
  let remaining = xp
  while (remaining >= needed) {
    remaining -= needed
    level += 1
    needed += 250
  }
  return { level, currentLevelXp: remaining, nextLevelXp: needed, progress: remaining / needed }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
