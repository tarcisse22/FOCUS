import { Link } from 'react-router-dom'
import { Check, Clock, Pencil, Play, Trash2 } from 'lucide-react'
import { format, isPast, isToday, parseISO } from 'date-fns'
import type { Course, Task } from '../lib/types'

const priorityStyle: Record<Task['priority'], string> = {
  high: 'bg-red-500/15 text-red-300',
  medium: 'bg-yellow-500/15 text-yellow-300',
  low: 'bg-green-500/15 text-green-300',
}

export function TaskItem({
  task,
  course,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  course?: Course
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const due = task.due_date ? parseISO(task.due_date) : null
  const overdue = due && !task.completed && isPast(due) && !isToday(due)

  return (
    <div className={`group flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-3 transition hover:border-primary/40 ${task.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${task.completed ? 'border-primary bg-primary text-white' : 'border-muted/60 hover:border-primary'}`}
      >
        {task.completed && <Check size={14} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          {course && <span style={{ color: course.color }}>{course.code}</span>}
          {due && <span className={overdue ? 'text-red-400' : ''}>{isToday(due) ? 'Today' : format(due, 'MMM d')}</span>}
          {task.estimated_minutes && (
            <span className="inline-flex items-center gap-1"><Clock size={11} />{task.estimated_minutes}m</span>
          )}
        </div>
      </div>
      <span className={`badge ${priorityStyle[task.priority]} hidden sm:inline-flex`}>{task.priority}</span>
      {!task.completed && (
        <Link to={`/app/focus?task=${task.id}`} className="btn-ghost p-1.5 text-primary-light" title="Start focus">
          <Play size={16} />
        </Link>
      )}
      {onEdit && (
        <button className="btn-ghost p-1.5" onClick={onEdit} aria-label="Edit"><Pencil size={15} /></button>
      )}
      {onDelete && (
        <button className="btn-ghost p-1.5 hover:text-red-400" onClick={onDelete} aria-label="Delete"><Trash2 size={15} /></button>
      )}
    </div>
  )
}
