import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Pause, Play, Square, Flame, Zap, Timer, NotebookPen } from 'lucide-react'
import { useCourses, useTasks } from '../lib/hooks'
import { useNotes } from '../lib/notes'
import { NoteEditor } from '../components/NoteEditor'
import { useAuth } from '../lib/auth'
import { saveFocusSession, type SessionResult } from '../lib/stats'
import { formatClock, XP_PER_MINUTE } from '../lib/xp'

const FIVE_MIN = 5 * 60
type Phase = 'select' | 'ready' | 'running' | 'paused' | 'done'

export function Focus() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { courses } = useCourses()
  const { tasks, toggle } = useTasks()
  const open = tasks.filter((t) => !t.completed)

  const [taskId, setTaskId] = useState<string | null>(params.get('task'))
  const courseId = params.get('course')
  const [phase, setPhase] = useState<Phase>(params.get('task') ? 'ready' : 'select')
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<SessionResult | null>(null)
  const startedAt = useRef<Date | null>(null)
  const tick = useRef<number | null>(null)
  const { notes, create: createNote, update: updateNote } = useNotes()
  const [noteId, setNoteId] = useState<string | null>(null)
  const [showNote, setShowNote] = useState(false)
  const note = notes.find((n) => n.id === noteId) ?? null

  const task = tasks.find((t) => t.id === taskId)
  const course = courses.find((c) => c.id === (task?.course_id ?? courseId))

  async function openNote() {
    if (!noteId) {
      const n = await createNote(task?.course_id ?? courseId ?? null, task ? `Notes: ${task.title}` : `Focus notes · ${new Date().toLocaleDateString()}`)
      if (n) setNoteId(n.id)
    }
    setShowNote(true)
  }

  useEffect(() => {
    if (phase === 'running') {
      const base = elapsed
      const startMs = Date.now()
      tick.current = window.setInterval(() => setElapsed(base + Math.floor((Date.now() - startMs) / 1000)), 250)
    }
    return () => { if (tick.current) window.clearInterval(tick.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'running') return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  useEffect(() => {
    document.title = phase === 'running' || phase === 'paused' ? `${formatClock(elapsed)} · FOCUS` : 'FOCUS'
    return () => { document.title = 'FOCUS' }
  }, [elapsed, phase])

  function start() {
    startedAt.current = new Date()
    setElapsed(0)
    setPhase('running')
  }

  async function end() {
    if (!user || !startedAt.current) return
    setPhase('done')
    const r = await saveFocusSession({
      userId: user.id,
      taskId: task?.id ?? null,
      courseId: task?.course_id ?? courseId ?? null,
      durationSeconds: elapsed,
      startedAt: startedAt.current,
    })
    setResult(r)
  }

  const remaining = Math.max(FIVE_MIN - elapsed, 0)
  const pastFive = elapsed >= FIVE_MIN
  const ringProgress = pastFive ? 1 : elapsed / FIVE_MIN
  const R = 120
  const C = 2 * Math.PI * R

  if (phase === 'select') {
    return (
      <div className="fade-up mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">What are you working on?</h1>
          <p className="text-sm text-muted">Pick a task, or just start a free session.</p>
        </div>
        <div className="space-y-2">
          {open.map((t) => {
            const c = courses.find((x) => x.id === t.course_id)
            return (
              <button key={t.id} onClick={() => { setTaskId(t.id); setPhase('ready') }} className="card flex w-full items-center gap-3 text-left transition hover:border-primary/60 hover:bg-surface-2">
                <div className="h-9 w-1 rounded-full" style={{ background: c?.color ?? '#7c3aed' }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  {c && <p className="text-xs text-muted">{c.code} · {c.name}</p>}
                </div>
                <Play size={18} className="text-primary-light" />
              </button>
            )
          })}
          {open.length === 0 && (
            <div className="card text-center text-sm text-muted">
              No open tasks. <Link to="/app/tasks" className="text-primary-light hover:underline">Create one</Link> or start a free session below.
            </div>
          )}
        </div>
        <button onClick={() => { setTaskId(null); setPhase('ready') }} className="btn-secondary w-full py-3"><Timer size={16} />Free focus session</button>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="fade-up mx-auto max-w-md space-y-6 pt-10 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-extrabold tracking-tight">SESSION COMPLETE</h1>
        {result ? (
          <>
            <p className="text-2xl font-semibold text-primary-light">{Math.floor(result.durationSeconds / 60)} minutes focused</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="card"><Zap className="mx-auto mb-1 text-yellow-300" size={22} /><p className="text-2xl font-bold">+{result.xp.toLocaleString()} XP</p></div>
              <div className="card"><Flame className="mx-auto mb-1 text-orange-400" size={22} /><p className="text-2xl font-bold">{result.streak} day{result.streak === 1 ? '' : 's'}</p><p className="text-xs text-muted">{result.streakExtended ? 'Streak extended!' : 'Streak maintained'}</p></div>
            </div>
            {result.durationSeconds < 60 && <p className="text-xs text-muted">Sessions under a minute don't earn XP — next time, push for five!</p>}
          </>
        ) : (
          <p className="text-muted">Saving your session…</p>
        )}
        {task && !task.completed && (
          <button className="btn-secondary w-full" onClick={() => { toggle(task); navigate('/app') }}>Mark "{task.title}" complete</button>
        )}
        {note && (note.body || note.title) && (
          <Link to={`/app/notes?note=${note.id}`} className="btn-secondary w-full"><NotebookPen size={16} />Open your session notes</Link>
        )}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => { setPhase('select'); setElapsed(0); setResult(null); setNoteId(null); setShowNote(false) }}>Another session</button>
          <Link to="/app" className="btn-primary flex-1">Back to dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up mx-auto flex max-w-md flex-col items-center gap-8 pt-6 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{course ? `${course.code} · ${course.name}` : 'Focus session'}</p>
        <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-tight">{task?.title ?? 'Free session'}</h1>
        <p className="mt-2 text-muted">
          {phase === 'ready' && 'Just start for 5 minutes.'}
          {phase === 'running' && !pastFive && 'Keep going — five minutes is all it takes.'}
          {phase === 'running' && pastFive && "You're in the zone. Keep going as long as you like."}
          {phase === 'paused' && 'Paused. Ready when you are.'}
        </p>
      </div>

      <div className="relative grid place-items-center">
        <svg width={280} height={280} className="-rotate-90">
          <circle cx={140} cy={140} r={R} stroke="var(--border)" strokeWidth={12} fill="none" />
          <circle
            cx={140} cy={140} r={R} strokeWidth={12} fill="none" strokeLinecap="round"
            stroke="url(#grad)"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - ringProgress)}
            className="transition-[stroke-dashoffset] duration-300"
            style={{ filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.6))' }}
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute">
          <p className="text-6xl font-bold tabular-nums tracking-tight">{formatClock(phase === 'ready' ? FIVE_MIN : pastFive ? elapsed : remaining)}</p>
          <p className="mt-1 text-sm text-muted">{phase === 'ready' ? 'to start' : pastFive ? 'focused' : 'until 5 min'}</p>
        </div>
      </div>

      {phase === 'ready' ? (
        <button onClick={start} className="btn-primary w-full py-4 text-lg tracking-wide"><Play size={20} />START</button>
      ) : (
        <div className="flex w-full gap-3">
          {phase === 'running' ? (
            <button onClick={() => setPhase('paused')} className="btn-secondary flex-1 py-3"><Pause size={18} />Pause</button>
          ) : (
            <button onClick={() => setPhase('running')} className="btn-primary flex-1 py-3"><Play size={18} />Resume</button>
          )}
          <button onClick={end} className="btn-danger flex-1 py-3"><Square size={18} />End Session</button>
        </div>
      )}

      {phase !== 'ready' && (
        <p className="text-xs text-muted">{Math.floor(elapsed / 60) * XP_PER_MINUTE} XP earned so far</p>
      )}
      {phase !== 'ready' && !showNote && (
        <button onClick={openNote} className="btn-ghost text-sm"><NotebookPen size={16} />Take notes</button>
      )}
      {phase !== 'ready' && showNote && (
        <div className="card w-full text-left">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Session notes</p>
            <button onClick={() => setShowNote(false)} className="text-xs text-muted hover:text-fg">Hide</button>
          </div>
          {note ? <NoteEditor note={note} courses={courses} onChange={updateNote} compact /> : <p className="text-sm text-muted">Creating note…</p>}
        </div>
      )}
      {phase === 'ready' && (
        <button onClick={() => setPhase('select')} className="text-sm text-muted hover:text-fg">Choose a different task</button>
      )}
    </div>
  )
}
