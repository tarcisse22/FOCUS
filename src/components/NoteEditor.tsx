import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Course, Note } from '../lib/types'

interface Props {
  note: Note
  courses: Course[]
  onChange: (note: Note) => void
  compact?: boolean
}

export function NoteEditor({ note, courses, onChange, compact }: Props) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const timer = useRef<number | null>(null)
  const pending = useRef<Partial<Note>>({})

  const flush = async (id: string) => {
    const patch = pending.current
    pending.current = {}
    if (Object.keys(patch).length === 0) return
    setStatus('saving')
    await supabase.from('notes').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    setStatus('saved')
  }

  function edit(patch: Partial<Note>) {
    onChange({ ...note, ...patch })
    pending.current = { ...pending.current, ...patch }
    setStatus('unsaved')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => flush(note.id), 800)
  }

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); flush(note.id) }, [note.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 font-semibold"
          placeholder="Untitled note"
          value={note.title}
          onChange={(e) => edit({ title: e.target.value })}
        />
        {!compact && (
          <select className="input w-40" value={note.course_id ?? ''} onChange={(e) => edit({ course_id: e.target.value || null })}>
            <option value="">No course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        )}
      </div>
      <textarea
        className={`input flex-1 resize-none leading-relaxed ${compact ? 'min-h-40' : 'min-h-[50vh]'}`}
        placeholder="Write while you study — key ideas, questions, things to review…"
        value={note.body}
        onChange={(e) => edit({ body: e.target.value })}
      />
      <p className="text-right text-xs text-muted">
        {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Unsaved changes'}
      </p>
    </div>
  )
}
