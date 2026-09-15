import { Link } from 'react-router-dom'
import { BookOpen, Timer, Flame, BarChart3 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../lib/theme'

const features = [
  { icon: BookOpen, title: 'Keep your study materials together', text: 'Upload lecture PDFs per course so everything is one click away.' },
  { icon: Timer, title: 'Start with five minutes', text: 'The hardest part is starting. Commit to five minutes and keep going.' },
  { icon: Flame, title: 'Build consistent habits', text: 'Earn XP and keep your streak alive with one session a day.' },
  { icon: BarChart3, title: 'See your progress', text: 'Weekly focus charts and time by course, built from your real sessions.' },
]

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost">Log In</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="fade-up">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Less Procrastination.
            <br />
            A More{' '}
            <span className="bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">Focused</span>{' '}
            You.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            A simple productivity platform built for students. Organize your work, start with five
            minutes, and build momentum.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary px-6 py-3 text-base">Get Started</Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">Log In</Link>
          </div>
        </div>
        <div className="fade-up relative" style={{ animationDelay: '120ms' }}>
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/20 blur-2xl" />
          <div className="card relative space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted">Focus session</p>
              <span className="badge bg-orange-500/15 text-orange-300">🔥 7 day streak</span>
            </div>
            <p className="text-xl font-bold uppercase">Algorithms Homework</p>
            <div className="grid place-items-center py-2">
              <div className="grid h-44 w-44 place-items-center rounded-full border-[10px] border-primary shadow-[0_0_40px_rgba(124,58,237,0.5)]">
                <div className="text-center">
                  <p className="text-4xl font-bold tabular-nums">05:00</p>
                  <p className="text-xs text-muted">just start</p>
                </div>
              </div>
            </div>
            <div className="btn-primary w-full py-3 pointer-events-none">START</div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Today's focus</span>
              <span className="text-fg">1h 42m / 4h</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2"><div className="h-full w-[42%] rounded-full bg-gradient-to-r from-green-400 to-emerald-500" /></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div key={f.title} className="card fade-up hover:border-primary/50 transition" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary-light">
              <f.icon size={20} />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        FOCUS — free for students. No subscriptions, ever.
      </footer>
    </div>
  )
}
