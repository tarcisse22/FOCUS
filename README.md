# FOCUS

**Less Procrastination. A More Focused You.**

FOCUS is a free productivity app for high school and college students who struggle with
procrastination. Organize schoolwork, keep lecture PDFs together, start a five-minute focus
session, and build momentum with XP and streaks.

No AI, no payments, no paid services. Just React + Supabase.

## Features

- **Courses** — create courses (e.g. `CSC 4520 — Algorithms`), see progress, tasks, materials and total focus time per course
- **Study materials** — upload lecture PDFs to a course (Supabase Storage), open them in the browser, delete them
- **Tasks** — title, course, due date, priority, estimated time, completed status
- **Focus timer** — pick a task, "just start for 5 minutes", keep going as long as you like; pause / resume / end
- **XP & levels** — 1 focused minute = 10 XP; levels need 500, 750, 1000, … XP each
- **Streaks** — consecutive days with at least one focus session
- **Progress** — total focus time, sessions, streak, longest session, weekly chart, focus time by course (all from real data)
- **Flashcards** — generate flashcards from a lecture PDF with Google Gemini (free tier), or write your own; review with flip / got it / missed
- **Dark & light mode** — toggle in the sidebar; remembered per device

## Tech stack

React · TypeScript · Vite · Tailwind CSS v4 · Supabase (Auth, Postgres, Storage) · React Router · Recharts

## Getting started

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables
   (`courses`, `tasks`, `study_materials`, `focus_sessions`, `user_stats`), row-level security policies,
   and the private `materials` storage bucket.
3. (Optional, for local dev) In **Authentication → Providers → Email**, disable "Confirm email" so
   sign-up logs you in immediately.

### 1b. Flashcards (optional, free)

1. Run [`supabase/flashcards.sql`](supabase/flashcards.sql) in the SQL Editor.
2. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
3. Deploy the edge function and set the key:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set GEMINI_API_KEY=<your-key>
npx supabase functions deploy generate-flashcards
```

The key never reaches the browser; the function runs with the user's JWT so RLS still applies.
Override the model with `GEMINI_MODEL` (default `gemini-flash-latest`).

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**.
Never commit `.env`.

### 3. Run

```bash
npm install
npm run dev
```

Requires Node 20.19+ or 22+.

## Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `npm run dev`     | Start dev server          |
| `npm run build`   | Type-check and build      |
| `npm run preview` | Preview production build  |
| `npm run lint`    | Lint with oxlint          |

## Project structure

```
src/
  components/   AppLayout (sidebar), Modal, TaskForm, TaskItem, ProgressBar, …
  lib/          supabase client, auth context, data hooks, XP/level math, stats & streak logic
  pages/        Landing, AuthPage, Dashboard, Tasks, Courses, CourseDetail, Focus, Progress, Flashcards
supabase/
  schema.sql        database schema, RLS policies, storage bucket
  flashcards.sql    flashcards table + RLS
  functions/generate-flashcards   Gemini edge function
```

## Deployment

Works on any static host. `vercel.json` includes the SPA rewrite for client-side routes.
Set the two `VITE_SUPABASE_*` environment variables in your host's dashboard.
