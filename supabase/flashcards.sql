-- Flashcards generated from lecture PDFs. Run after schema.sql.
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete set null,
  question text not null,
  answer text not null,
  known boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists flashcards_course_idx on public.flashcards (course_id);

alter table public.flashcards enable row level security;

create policy "own flashcards" on public.flashcards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
