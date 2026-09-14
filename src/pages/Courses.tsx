import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Plus } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Empty } from '../components/Empty'
import { ProgressBar } from '../components/ProgressBar'
import { useCourses } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/types'

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4']

export function Courses() {
  const { user } = useAuth()
  const { courses, loading, reload } = useCourses()
  const [tasks, setTasks] = useState<Pick<Task, 'course_id' | 'completed'>[]>([])
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({})
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('tasks').select('course_id, completed').then(({ data }) => setTasks(data ?? []))
    supabase.from('study_materials').select('course_id').then(({ data }) => {
      const counts: Record<string, number> = {}
      for (const m of data ?? []) counts[m.course_id] = (counts[m.course_id] ?? 0) + 1
      setMaterialCounts(counts)
    })
  }, [user, courses])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    await supabase.from('courses').insert({ user_id: user.id, code: code.trim(), name: name.trim(), color })
    setBusy(false)
    setOpen(false)
    setCode('')
    setName('')
    reload()
  }

  const progressOf = (id: string) => {
    const ts = tasks.filter((t) => t.course_id === id)
    return ts.length ? ts.filter((t) => t.completed).length / ts.length : 0
  }

  return (
    <div className="fade-up space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-sm text-muted">Keep all your study materials in one place.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Add Course</button>
      </div>

      {!loading && courses.length === 0 ? (
        <Empty icon={<BookOpen size={22} />} title="No courses yet" hint="Add a course like CSC 4520 — Algorithms." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Add Course</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => {
            const p = progressOf(c.id)
            return (
              <Link key={c.id} to={`/app/courses/${c.id}`} className="card group flex items-center gap-4 transition hover:border-primary/50">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white font-bold" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }}>
                  {c.code.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.code}</p>
                  <p className="truncate text-sm text-muted">{c.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={p} className="flex-1" />
                    <span className="text-xs text-muted">{Math.round(p * 100)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{materialCounts[c.id] ?? 0} materials</p>
                </div>
                <ChevronRight size={18} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            )
          })}
        </div>
      )}

      <Modal title="New course" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Course code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CSC 4520" required autoFocus />
          </div>
          <div>
            <label className="label">Course name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Algorithms" required />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : ''}`} style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={busy}>Create course</button>
        </form>
      </Modal>
    </div>
  )
}
