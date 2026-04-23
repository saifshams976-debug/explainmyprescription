-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Saved medications
create table public.saved_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  explanation jsonb not null,
  original_input text,
  created_at timestamptz not null default now()
);

alter table public.saved_medications enable row level security;

create policy "Users view own saved meds" on public.saved_medications for select using (auth.uid() = user_id);
create policy "Users insert own saved meds" on public.saved_medications for insert with check (auth.uid() = user_id);
create policy "Users update own saved meds" on public.saved_medications for update using (auth.uid() = user_id);
create policy "Users delete own saved meds" on public.saved_medications for delete using (auth.uid() = user_id);

create index saved_medications_user_id_created_at_idx on public.saved_medications(user_id, created_at desc);

-- Reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_medication_id uuid references public.saved_medications(id) on delete cascade,
  medication_name text not null,
  time_of_day text not null, -- 'HH:MM' 24h
  label text, -- 'Morning' | 'Evening' | 'Custom'
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "Users view own reminders" on public.reminders for select using (auth.uid() = user_id);
create policy "Users insert own reminders" on public.reminders for insert with check (auth.uid() = user_id);
create policy "Users update own reminders" on public.reminders for update using (auth.uid() = user_id);
create policy "Users delete own reminders" on public.reminders for delete using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();