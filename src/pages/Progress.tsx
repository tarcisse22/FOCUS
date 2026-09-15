import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Flame, Hash, Trophy } from 'lucide-react'
import { format, startOfDay, subDays } from 'date-fns'
import { ProgressBar } from '../components/ProgressBar'
import { useCourses } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { effectiveStreak, fetchStats } from '../lib/stats'
import { formatDuration, levelFromXp } from '../lib/xp'
import type { FocusSession, UserStats } from '../lib/types'

const pluralDays = (n: number) => `${n} day${n === 1 ? '' : 's'}`

export function Progress() {
  const { user } = useAuth()
  const { courses } = useCourses()
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    if (!user) return
    fetchStats(user.id).then(setStats)
    supabase.from('focus_sessions').select('*').order('ended_at').then(({ data }) => setSessions(data ?? []))
  }, [user])

  const total = sessions.reduce((s, x) => s + x.duration_seconds, 0)
  const longest = sessions.reduce((m, x) => Math.max(m, x.duration_seconds), 0)
  const lvl = levelFromXp(stats?.total_xp ?? 0)

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i))
    const next = startOfDay(subDays(new Date(), 5 - i))
    const mins = sessions
      .filter((s) => { const t = new Date(s.ended_at); return t >= day && t < next })
      .reduce((a, s) => a + s.duration_seconds, 0) / 60
    return { day: format(day, 'EEE'), minutes: Math.round(mins) }
  })

  const byCourse = courses
    .map((c) => ({ course: c, seconds: sessions.filter((s) => s.course_id === c.id).reduce((a, s) => a + s.duration_seconds, 0) }))
    .filter((x) => x.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
  const unassigned = sessions.filter((s) => !s.course_id).reduce((a, s) => a + s.duration_seconds, 0)

  const cards = [
    { icon: Clock, label: 'Total focus time', value: formatDuration(total), color: 'text-primary-light' },
    { icon: Hash, label: 'Sessions completed', value: sessions.length.toString(), color: 'text-secondary' },
    { icon: Flame, label: 'Current streak', value: pluralDays(stats ? effectiveStreak(stats) : 0), color: 'text-orange-400' },
    { icon: Trophy, label: 'Longest session', value: formatDuration(longest), color: 'text-yellow-300' },
  ]

  return (
    <div className="fade-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Progress</h1>
        <p className="text-sm text-muted">Track your focus. See your growth.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <c.icon size={18} className={c.color} />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold">This week</h2>
          <p className="text-xs text-muted">Minutes focused per day</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week} barCategoryGap={16}>
                <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip cursor={{ fill: 'rgba(124,58,237,0.1)' }} contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }} formatter={(v) => [`${v} min`, 'Focus']} />
                <Bar dataKey="minutes" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold">Level {lvl.level}</h2>
            <p className="text-xs text-muted">{(stats?.total_xp ?? 0).toLocaleString()} XP total</p>
            <ProgressBar value={lvl.progress} className="mt-3" />
            <p className="mt-1 text-xs text-muted">{(lvl.nextLevelXp - lvl.currentLevelXp).toLocaleString()} XP to next level</p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted">Longest streak</p>
            <p className="text-xl font-bold">{pluralDays(stats?.longest_streak ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold">Focus time by course</h2>
        {byCourse.length === 0 && unassigned === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-muted">Complete a focus session to see your breakdown.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {byCourse.map(({ course, seconds }) => (
              <div key={course.id}>
                <div className="flex justify-between text-sm">
                  <span><span style={{ color: course.color }}>{course.code}</span> <span className="text-muted">{course.name}</span></span>
                  <span className="font-medium">{formatDuration(seconds)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-surface-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(seconds / total) * 100}%`, background: course.color }} />
                </div>
              </div>
            ))}
            {unassigned > 0 && (
              <div>
                <div className="flex justify-between text-sm"><span className="text-muted">Free sessions</span><span className="font-medium">{formatDuration(unassigned)}</span></div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-surface-2"><div className="h-full rounded-full bg-muted" style={{ width: `${(unassigned / total) * 100}%` }} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
