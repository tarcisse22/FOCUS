import { Target } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold tracking-tight text-lg">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary">
        <Target size={18} />
      </span>
      FOCUS
    </Link>
  )
}
