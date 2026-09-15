import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Trash2, Upload, ExternalLink, Timer } from 'lucide-react'
import { format } from 'date-fns'
import { Modal } from '../components/Modal'
import { TaskForm } from '../components/TaskForm'
import { TaskItem } from '../components/TaskItem'
import { ProgressBar } from '../components/ProgressBar'
import { useCourses, useTasks } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { formatDuration } from '../lib/xp'
import type { StudyMaterial, Task } from '../lib/types'

export function CourseDetail() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { courses } = useCourses()
  const course = courses.find((c) => c.id === id)
  const { tasks, reload, toggle, remove } = useTasks(id)
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [focusSeconds, setFocusSeconds] = useState(0)
  const [editing, setEditing] = useState<Task | null | 'new'>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadMaterials = async () => {
    const { data } = await supabase.from('study_materials').select('*').eq('course_id', id).order('created_at')
    setMaterials(data ?? [])
  }

  useEffect(() => {
    if (!user) return
    loadMaterials()
    supabase.from('focus_sessions').select('duration_seconds').eq('course_id', id).then(({ data }) =>
      setFocusSeconds((data ?? []).reduce((s, r) => s + r.duration_seconds, 0)),
    )
  }, [user, id])

  async function upload(file: File) {
    if (!user) return
    if (file.type !== 'application/pdf') return setError('Only PDF files are supported.')
    setUploading(true)
    setError(null)
    const path = `${user.id}/${id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('materials').upload(path, file)
    if (upErr) {
      setUploading(false)
      return setError(upErr.message)
    }
    await supabase.from('study_materials').insert({ user_id: user.id, course_id: id, name: file.name, storage_path: path, size_bytes: file.size })
    setUploading(false)
    loadMaterials()
  }

  async function openMaterial(m: StudyMaterial) {
    const { data, error } = await supabase.storage.from('materials').createSignedUrl(m.storage_path, 60 * 60)
    if (error || !data) return setError(error?.message ?? 'Could not open file')
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function deleteMaterial(m: StudyMaterial) {
    setMaterials((prev) => prev.filter((x) => x.id !== m.id))
    await supabase.storage.from('materials').remove([m.storage_path])
    await supabase.from('study_materials').delete().eq('id', m.id)
  }

  async function deleteCourse() {
    if (!confirm('Delete this course, its tasks and materials?')) return
    if (materials.length) await supabase.storage.from('materials').remove(materials.map((m) => m.storage_path))
    await supabase.from('courses').delete().eq('id', id)
    navigate('/app/courses')
  }

  if (!course) return <p className="text-muted">Loading…</p>
  const done = tasks.filter((t) => t.completed).length
  const progress = tasks.length ? done / tasks.length : 0

  return (
    <div className="fade-up space-y-6">
      <Link to="/app/courses" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={16} />Courses</Link>

      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${course.color}, transparent 60%)` }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{course.code}</h1>
            <p className="text-muted">{course.name}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/app/focus?course=${course.id}`} className="btn-primary"><Timer size={16} />Start Focus</Link>
            <button className="btn-ghost hover:text-red-400" onClick={deleteCourse} aria-label="Delete course"><Trash2 size={16} /></button>
          </div>
        </div>
        <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Progress</p>
            <p className="text-xl font-semibold">{Math.round(progress * 100)}%</p>
            <ProgressBar value={progress} className="mt-2" />
          </div>
          <div>
            <p className="text-xs text-muted">Tasks</p>
            <p className="text-xl font-semibold">{done} / {tasks.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Total focus time</p>
            <p className="text-xl font-semibold">{formatDuration(focusSeconds)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Study materials</h2>
            <button className="btn-secondary py-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={14} />{uploading ? 'Uploading…' : 'Upload PDF'}
            </button>
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {materials.length === 0 ? (
            <div
              className="card grid place-items-center border-dashed py-10 text-center text-sm text-muted cursor-pointer hover:border-primary/50"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
            >
              <FileText size={22} className="mb-2 text-primary-light" />
              Drop a lecture PDF here or click to upload
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <div key={m.id} className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-2.5 hover:border-primary/40 transition">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-500/15 text-red-300"><FileText size={18} /></div>
                  <button className="min-w-0 flex-1 text-left" onClick={() => openMaterial(m)}>
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted">{(m.size_bytes / 1024 / 1024).toFixed(1)} MB · {format(new Date(m.created_at), 'MMM d')}</p>
                  </button>
                  <button className="btn-ghost p-1.5" onClick={() => openMaterial(m)} aria-label="Open"><ExternalLink size={15} /></button>
                  <button className="btn-ghost p-1.5 hover:text-red-400" onClick={() => deleteMaterial(m)} aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tasks</h2>
            <button className="btn-secondary py-1.5 text-xs" onClick={() => setEditing('new')}><Plus size={14} />Add Task</button>
          </div>
          {tasks.length === 0 ? (
            <div className="card py-10 text-center text-sm text-muted">No tasks for this course yet.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={() => toggle(t)} onEdit={() => setEditing(t)} onDelete={() => remove(t)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal title={editing === 'new' ? 'New task' : 'Edit task'} open={editing !== null} onClose={() => setEditing(null)}>
        <TaskForm courses={courses} task={editing === 'new' ? null : editing} defaultCourseId={id} onDone={() => { setEditing(null); reload() }} />
      </Modal>
    </div>
  )
}
