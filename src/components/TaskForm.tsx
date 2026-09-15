import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Course, Priority, Task } from '../lib/types'

export function TaskForm({
  courses,
  task,
  defaultCourseId,
  onDone,
}: {
  courses: Course[]
  task?: Task | null
  defaultCourseId?: string | null
  onDone: () => void
}) {
  const { user } = useAuth()
  const [title, setTitle] = useState(task?.title ?? '')
  const [courseId, setCourseId] = useState(task?.course_id ?? defaultCourseId ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [estimate, setEstimate] = useState(task?.estimated_minutes?.toString() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    const payload = {
      user_id: user.id,
      title: title.trim(),
      course_id: courseId || null,
      due_date: dueDate || null,
      priority,
      estimated_minutes: estimate ? Number(estimate) : null,
    }
    const { error } = task
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert(payload)
    setBusy(false)
    if (error) return setError(error.message)
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Algorithms Homework" required autoFocus />
      </div>
      <div>
        <label className="label">Course</label>
        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">No course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>
        {courses.length === 0 && (
          <p className="mt-1.5 text-xs text-muted">
            No courses yet. <Link to="/app/courses" className="text-primary-light hover:underline">Create one</Link> to organize tasks by class.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Due date</label>
          <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Estimated time (minutes)</label>
        <input className="input" type="number" min={5} step={5} value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="60" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{task ? 'Save changes' : 'Create task'}</button>
    </form>
  )
}
