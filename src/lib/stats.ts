import { format, subDays } from 'date-fns'
import { supabase } from './supabase'
import { xpForSeconds } from './xp'
import type { UserStats } from './types'

export async function fetchStats(userId: string): Promise<UserStats> {
  const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
  return (
    data ?? {
      user_id: userId,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_session_date: null,
      daily_goal_minutes: 240,
    }
  )
}

export interface SessionResult {
  durationSeconds: number
  xp: number
  streak: number
  streakExtended: boolean
}

export async function saveFocusSession(params: {
  userId: string
  taskId: string | null
  courseId: string | null
  durationSeconds: number
  startedAt: Date
}): Promise<SessionResult> {
  const xp = xpForSeconds(params.durationSeconds)
  await supabase.from('focus_sessions').insert({
    user_id: params.userId,
    task_id: params.taskId,
    course_id: params.courseId,
    duration_seconds: params.durationSeconds,
    xp_earned: xp,
    started_at: params.startedAt.toISOString(),
    ended_at: new Date().toISOString(),
  })

  const stats = await fetchStats(params.userId)
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  let streak = stats.current_streak
  let streakExtended = false
  if (stats.last_session_date !== today) {
    streak = stats.last_session_date === yesterday ? stats.current_streak + 1 : 1
    streakExtended = true
  }

  await supabase.from('user_stats').upsert({
    user_id: params.userId,
    total_xp: stats.total_xp + xp,
    current_streak: streak,
    longest_streak: Math.max(stats.longest_streak, streak),
    last_session_date: today,
    daily_goal_minutes: stats.daily_goal_minutes,
  })

  return { durationSeconds: params.durationSeconds, xp, streak, streakExtended }
}

/** Streak is only valid if the last session was today or yesterday. */
export function effectiveStreak(stats: UserStats): number {
  if (!stats.last_session_date) return 0
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  return stats.last_session_date === today || stats.last_session_date === yesterday
    ? stats.current_streak
    : 0
}
