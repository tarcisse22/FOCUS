import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Course, Task } from './types'

export function useCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('courses').select('*').order('created_at')
    setCourses(data ?? [])
    setLoading(false)
  }, [user])
  useEffect(() => { reload() }, [reload])
  return { courses, loading, reload }
}

export function useTasks(courseId?: string) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    if (!user) return
    let q = supabase.from('tasks').select('*').order('completed').order('due_date', { nullsFirst: false }).order('created_at')
    if (courseId) q = q.eq('course_id', courseId)
    const { data } = await q
    setTasks(data ?? [])
    setLoading(false)
  }, [user, courseId])
  useEffect(() => { reload() }, [reload])

  const toggle = async (t: Task) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)))
    await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id)
    reload()
  }
  const remove = async (t: Task) => {
    setTasks((prev) => prev.filter((x) => x.id !== t.id))
    await supabase.from('tasks').delete().eq('id', t.id)
  }
  return { tasks, loading, reload, toggle, remove }
}
