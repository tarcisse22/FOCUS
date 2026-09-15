import { useState } from 'react'
import { CheckSquare, Plus } from 'lucide-react'
import { Modal } from '../components/Modal'
import { TaskForm } from '../components/TaskForm'
import { TaskItem } from '../components/TaskItem'
import { Empty } from '../components/Empty'
import { useCourses, useTasks } from '../lib/hooks'
import type { Task } from '../lib/types'

export function Tasks() {
  const { courses } = useCourses()
  const { tasks, loading, reload, toggle, remove } = useTasks()
  const [editing, setEditing] = useState<Task | null | 'new'>(null)
  const [filter, setFilter] = useState<'open' | 'done'>('open')

  const shown = tasks.filter((t) => (filter === 'open' ? !t.completed : t.completed))
  const courseOf = (id: string | null) => courses.find((c) => c.id === id)

  return (
    <div className="fade-up space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted">{tasks.filter((t) => !t.completed).length} open</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Add Task</button>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface p-1 w-fit border border-border">
        {(['open', 'done'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${filter === f ? 'bg-primary text-white' : 'text-muted hover:text-fg'}`}>
            {f === 'open' ? 'To do' : 'Completed'}
          </button>
        ))}
      </div>

      {!loading && shown.length === 0 ? (
        <Empty
          icon={<CheckSquare size={22} />}
          title={filter === 'open' ? 'No tasks yet' : 'Nothing completed yet'}
          hint={filter === 'open' ? 'Add your first assignment to get started.' : 'Complete a task and it will show up here.'}
          action={filter === 'open' && <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Add Task</button>}
        />
      ) : (
        <div className="space-y-2">
          {shown.map((t) => (
            <TaskItem key={t.id} task={t} course={courseOf(t.course_id)} onToggle={() => toggle(t)} onEdit={() => setEditing(t)} onDelete={() => remove(t)} />
          ))}
        </div>
      )}

      <Modal title={editing === 'new' ? 'New task' : 'Edit task'} open={editing !== null} onClose={() => setEditing(null)}>
        <TaskForm courses={courses} task={editing === 'new' ? null : editing} onDone={() => { setEditing(null); reload() }} />
      </Modal>
    </div>
  )
}
