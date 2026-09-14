import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Play, Plus, Zap } from 'lucide-react'
import { startOfDay } from 'date-fns'
import { ProgressBar } from '../components/ProgressBar'
import { TaskItem } from '../components/TaskItem'
import { useCourses, useTasks } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { effectiveStreak, fetchStats } from '../lib/stats'
import { formatDuration, levelFromXp } from '../lib/xp'
import type { UserStats } from '../lib/types'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { user } = useAuth()
  const { courses } = useCourses()
  const { tasks, toggle } = useTasks()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [todaySeconds, setTodaySeconds] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchStats(user.id).then(setStats)
    supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .gte('ended_at', startOfDay(new Date()).toISOString())
      .then(({ data }) => setTodaySeconds((data ?? []).reduce((s, r) => s + r.duration_seconds, 0)))
  }, [user])

  const name = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there'
  const goalSeconds = (stats?.daily_goal_minutes ?? 240) * 60
  const lvl = levelFromXp(stats?.total_xp ?? 0)
  const streak = stats ? effectiveStreak(stats) : 0
  const openTasks = tasks.filter((t) => !t.completed).slice(0, 5)

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}, {name} 👋</h1>
          <p className="text-sm text-muted">Let's make progress today.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium">
          <Flame size={16} className="text-orange-400" /> {streak} day streak
        </div>
      </div>

      <Link to="/app/focus" className="card group relative block overflow-hidden border-primary/40 bg-gradient-to-br from-primary/30 via-surface to-secondary/20 p-8 text-center transition hover:border-primary hover:shadow-[0_0_40px_rgba(124,58,237,0.35)]">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition group-hover:scale-110">
          <Play size={28} className="ml-1" />
        </div>
        <p className="text-2xl font-extrabold tracking-wide">START FOCUS</p>
        <p className="mt-1 text-sm text-muted">Just five minutes. That's all it takes to begin.</p>
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <p className="text-sm text-muted">Today's Focus</p>
          <p className="mt-1 text-3xl font-bold">
            {formatDuration(todaySeconds)} <span className="text-lg font-normal text-muted">/ {formatDuration(goalSeconds)}</span>
          </p>
          <ProgressBar value={todaySeconds / goalSeconds} className="mt-3 h-3" gradient="from-green-400 to-emerald-500" />
          <p className="mt-2 text-xs text-muted">{Math.min(100, Math.round((todaySeconds / goalSeconds) * 100))}% of daily goal</p>
        </div>
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Level {lvl.level}</p>
            <Zap size={16} className="text-yellow-300" />
          </div>
          <p className="mt-1 text-3xl font-bold">{(stats?.total_xp ?? 0).toLocaleString()} <span className="text-lg font-normal text-muted">XP</span></p>
          <ProgressBar value={lvl.progress} className="mt-3" />
          <p className="mt-2 text-xs text-muted">{lvl.currentLevelXp.toLocaleString()} / {lvl.nextLevelXp.toLocaleString()} to level {lvl.level + 1}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Today's Tasks</h2>
          <div className="flex items-center gap-3">
            <Link to="/app/tasks" className="text-xs text-primary-light hover:underline">See all</Link>
            <Link to="/app/tasks" className="btn-primary py-1.5 text-xs"><Plus size={14} />Add Task</Link>
          </div>
        </div>
        {openTasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">All clear. Add a task to plan your day.</p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((t) => (
              <TaskItem key={t.id} task={t} course={courses.find((c) => c.id === t.course_id)} onToggle={() => toggle(t)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
