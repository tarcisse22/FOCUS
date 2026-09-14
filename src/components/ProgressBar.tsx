export function ProgressBar({
  value,
  className = '',
  gradient = 'from-primary to-secondary',
}: {
  value: number
  className?: string
  gradient?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
