import type { ReactNode } from 'react'

export function Empty({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary-light">{icon}</div>
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
