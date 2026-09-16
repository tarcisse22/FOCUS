import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { NotebookPen, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Empty } from '../components/Empty'
import { NoteEditor } from '../components/NoteEditor'
import { useCourses } from '../lib/hooks'
import { useNotes } from '../lib/notes'

export function Notes() {
  const { courses } = useCourses()
  const { notes, loading, create, update, remove } = useNotes()
  const [params, setParams] = useSearchParams()
  const courseId = params.get('course') ?? ''
  const [activeId, setActiveId] = useState<string | null>(params.get('note'))

  const shown = useMemo(() => (courseId ? notes.filter((n) => n.course_id === courseId) : notes), [notes, courseId])
  const active = notes.find((n) => n.id === activeId) ?? null

  useEffect(() => {
    if (activeId && !loading && !active) setActiveId(null)
  }, [activeId, active, loading])

  async function add() {
    const n = await create(courseId || null)
    if (n) setActiveId(n.id)
  }

  if (active) {
    return (
      <div className="fade-up mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <button className="btn-ghost -ml-3" onClick={() => setActiveId(null)}><ArrowLeft size={16} />All notes</button>
          <button className="btn-ghost text-red-400" onClick={() => { if (confirm('Delete this note?')) { remove(active); setActiveId(null) } }}><Trash2 size={16} />Delete</button>
        </div>
        <NoteEditor note={active} courses={courses} onChange={update} />
      </div>
    )
  }

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-muted">{notes.length} note{notes.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-44" value={courseId} onChange={(e) => setParams(e.target.value ? { course: e.target.value } : {})}>
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <button className="btn-primary" onClick={add}><Plus size={16} />New note</button>
        </div>
      </div>

      {!loading && shown.length === 0 ? (
        <Empty icon={<NotebookPen size={22} />} title="No notes yet" hint="Jot down key ideas while you study. Notes autosave." action={<button className="btn-primary" onClick={add}><Plus size={16} />New note</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((n) => {
            const c = courses.find((x) => x.id === n.course_id)
            return (
              <button key={n.id} onClick={() => setActiveId(n.id)} className="card flex flex-col text-left transition hover:border-primary/60 hover:bg-surface-2">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  {c && <><span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.code} ·</>}
                  <span>{formatDistanceToNow(new Date(n.updated_at), { addSuffix: true })}</span>
                </div>
                <p className="truncate font-semibold">{n.title || 'Untitled note'}</p>
                <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-muted">{n.body || 'Empty note'}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
