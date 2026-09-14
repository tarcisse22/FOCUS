-- FOCUS database schema. Run this in the Supabase SQL editor.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null default '#7c3aed',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  estimated_minutes int,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  duration_seconds int not null,
  xp_earned int not null,
  started_at timestamptz not null,
  ended_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_session_date date,
  daily_goal_minutes int not null default 240
);

-- Row level security: each user only sees their own rows.
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.study_materials enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.user_stats enable row level security;

create policy "own courses" on public.courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own materials" on public.study_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stats" on public.user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for lecture PDFs (private; files live under <user_id>/<course_id>/...).
insert into storage.buckets (id, name, public) values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "own materials read" on storage.objects for select
  using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own materials insert" on storage.objects for insert
  with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own materials delete" on storage.objects for delete
  using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
