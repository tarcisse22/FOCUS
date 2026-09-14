export type Priority = 'low' | 'medium' | 'high'

export interface Course {
  id: string
  user_id: string
  code: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  course_id: string | null
  title: string
  due_date: string | null
  priority: Priority
  estimated_minutes: number | null
  completed: boolean
  created_at: string
}

export interface StudyMaterial {
  id: string
  user_id: string
  course_id: string
  name: string
  storage_path: string
  size_bytes: number
  created_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  course_id: string | null
  duration_seconds: number
  xp_earned: number
  started_at: string
  ended_at: string
}

export interface UserStats {
  user_id: string
  total_xp: number
  current_streak: number
  longest_streak: number
  last_session_date: string | null
  daily_goal_minutes: number
}
