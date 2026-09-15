import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layers, RotateCcw, Check, X, Trash2, Plus } from 'lucide-react'
import { Empty } from '../components/Empty'
import { Modal } from '../components/Modal'
import { ProgressBar } from '../components/ProgressBar'
import { useCourses } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { Flashcard } from '../lib/types'

export function Flashcards() {
  const { user } = useAuth()
  const { courses } = useCourses()
  const [params, setParams] = useSearchParams()
  const courseId = params.get('course') ?? ''
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'review'>('list')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('flashcards').select('*').order('created_at')
    setCards(data ?? [])
    setLoading(false)
  }
  useEffect(() => { if (user) load() }, [user])

  const shown = useMemo(() => (courseId ? cards.filter((c) => c.course_id === courseId) : cards), [cards, courseId])
  const known = shown.filter((c) => c.known).length

  async function setKnown(card: Flashcard, value: boolean) {
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, known: value } : c)))
    await supabase.from('flashcards').update({ known: value }).eq('id', card.id)
  }
  async function remove(card: Flashcard) {
    setCards((prev) => prev.filter((c) => c.id !== card.id))
    await supabase.from('flashcards').delete().eq('id', card.id)
  }
  async function resetProgress() {
    const ids = shown.map((c) => c.id)
    setCards((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, known: false } : c)))
    await supabase.from('flashcards').update({ known: false }).in('id', ids)
  }

  const courseOf = (id: string) => courses.find((c) => c.id === id)

  if (mode === 'review') {
    return <Review cards={shown.filter((c) => !c.known)} onKnown={(c) => setKnown(c, true)} onExit={() => setMode('list')} />
  }

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-sm text-muted">{known} / {shown.length} known</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setAdding(true)}><Plus size={16} />Add card</button>
          <button className="btn-primary" onClick={() => setMode('review')} disabled={shown.length === known}>
            <Layers size={16} />Review {shown.length - known > 0 && `(${shown.length - known})`}
          </button>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!courseId} onClick={() => setParams({})}>All</FilterChip>
          {courses.map((c) => (
            <FilterChip key={c.id} active={courseId === c.id} onClick={() => setParams({ course: c.id })}>{c.code}</FilterChip>
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <div className="card flex items-center gap-4">
          <ProgressBar value={shown.length ? known / shown.length : 0} className="flex-1" />
          <button className="btn-ghost py-1.5 text-xs" onClick={resetProgress}><RotateCcw size={14} />Reset</button>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <Empty
          icon={<Layers size={22} />}
          title="No flashcards yet"
          hint="Open a course, hover a lecture PDF and hit the sparkle icon to generate flashcards from it."
          action={<Link to="/app/courses" className="btn-primary">Go to courses</Link>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((c) => (
            <div key={c.id} className={`card group space-y-2 ${c.known ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-primary-light">{courseOf(c.course_id)?.code ?? 'Course'}</span>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button className="btn-ghost p-1" onClick={() => setKnown(c, !c.known)} aria-label="Toggle known"><Check size={14} /></button>
                  <button className="btn-ghost p-1 hover:text-red-400" onClick={() => remove(c)} aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="font-medium">{c.question}</p>
              <p className="text-sm text-muted">{c.answer}</p>
            </div>
          ))}
        </div>
      )}

      <Modal title="New flashcard" open={adding} onClose={() => setAdding(false)}>
        <CardForm courses={courses} defaultCourseId={courseId} onDone={() => { setAdding(false); load() }} />
      </Modal>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-primary bg-primary/15 text-fg' : 'border-border text-muted hover:text-fg'}`}>
      {children}
    </button>
  )
}

function Review({ cards, onKnown, onExit }: { cards: Flashcard[]; onKnown: (c: Flashcard) => void; onExit: () => void }) {
  const [queue, setQueue] = useState(() => [...cards].sort(() => Math.random() - 0.5))
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const current = queue[0]

  function answer(gotIt: boolean) {
    if (!current) return
    setFlipped(false)
    setDone((d) => d + 1)
    if (gotIt) {
      onKnown(current)
      setQueue((q) => q.slice(1))
    } else {
      setQueue((q) => [...q.slice(1), current])
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped && e.key === 'ArrowRight') answer(true)
      if (flipped && e.key === 'ArrowLeft') answer(false)
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!current) {
    return (
      <div className="fade-up mx-auto max-w-lg space-y-6 text-center">
        <div className="card py-12">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-3 text-2xl font-bold">All cards known</h1>
          <p className="mt-1 text-muted">{done} answers this round. Nice work.</p>
          <button className="btn-primary mt-6" onClick={onExit}>Back to flashcards</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <button className="btn-ghost py-1.5" onClick={onExit}><X size={16} />Exit</button>
        <span>{queue.length} left</span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="card w-full min-h-[280px] grid place-items-center text-center px-8 transition hover:border-primary/50 cursor-pointer"
      >
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted">{flipped ? 'Answer' : 'Question'}</p>
          <p className={`${flipped ? 'text-lg' : 'text-xl font-semibold'}`}>{flipped ? current.answer : current.question}</p>
          {!flipped && <p className="mt-6 text-xs text-muted">Click or press Space to flip</p>}
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary py-3 hover:border-red-400/60" disabled={!flipped} onClick={() => answer(false)}><X size={16} />Missed it</button>
        <button className="btn-primary py-3" disabled={!flipped} onClick={() => answer(true)}><Check size={16} />Got it</button>
      </div>
    </div>
  )
}

function CardForm({ courses, defaultCourseId, onDone }: { courses: { id: string; code: string; name: string }[]; defaultCourseId: string; onDone: () => void }) {
  const { user } = useAuth()
  const [courseId, setCourseId] = useState(defaultCourseId || courses[0]?.id || '')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !courseId) return setError('Create a course first.')
    const { error } = await supabase.from('flashcards').insert({ user_id: user.id, course_id: courseId, question: question.trim(), answer: answer.trim() })
    if (error) return setError(error.message)
    onDone()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Course</label>
        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Question</label>
        <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} required autoFocus />
      </div>
      <div>
        <label className="label">Answer</label>
        <textarea className="input min-h-[90px]" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn-primary w-full">Add card</button>
    </form>
  )
}
