-- Golden List Schema

-- Profiles table (mirrors auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text default '#D4AF37',
  sort_order int default 0,
  created_at timestamptz default now() not null
);

alter table public.categories enable row level security;

create policy "Users can view own categories" on public.categories
  for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories
  for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Contacts table
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  category_id uuid references public.categories(id) on delete set null,
  reminder_frequency_days int not null default 14,
  last_contacted_at timestamptz,
  next_reminder_at timestamptz,
  last_skipped boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.contacts enable row level security;

create policy "Users can view own contacts" on public.contacts
  for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on public.contacts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on public.contacts
  for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on public.contacts
  for delete using (auth.uid() = user_id);

-- Auto-set next_reminder_at on insert
create or replace function public.set_initial_reminder()
returns trigger as $$
begin
  if new.next_reminder_at is null then
    new.next_reminder_at := now() + (new.reminder_frequency_days || ' days')::interval;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_initial_reminder_trigger
  before insert on public.contacts
  for each row execute function public.set_initial_reminder();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger update_contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at();

-- Interactions table
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('contact', 'skip')),
  notes text,
  created_at timestamptz default now() not null
);

alter table public.interactions enable row level security;

create policy "Users can view own interactions" on public.interactions
  for select using (auth.uid() = user_id);
create policy "Users can insert own interactions" on public.interactions
  for insert with check (auth.uid() = user_id);

-- Push subscriptions table
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz default now() not null
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subs" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "Users can insert own push subs" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own push subs" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- RPC: Record a contact interaction
create or replace function public.record_contact(p_contact_id uuid, p_notes text default null)
returns void as $$
declare
  v_user_id uuid := auth.uid();
  v_freq int;
begin
  select reminder_frequency_days into v_freq
    from public.contacts
    where id = p_contact_id and user_id = v_user_id;

  if not found then
    raise exception 'Contact not found';
  end if;

  insert into public.interactions (contact_id, user_id, type, notes)
    values (p_contact_id, v_user_id, 'contact', p_notes);

  update public.contacts set
    last_contacted_at = now(),
    next_reminder_at = now() + (v_freq || ' days')::interval,
    last_skipped = false
  where id = p_contact_id and user_id = v_user_id;
end;
$$ language plpgsql security definer;

-- RPC: Skip a contact
create or replace function public.skip_contact(p_contact_id uuid)
returns void as $$
declare
  v_user_id uuid := auth.uid();
  v_freq int;
  v_last_skipped boolean;
begin
  select reminder_frequency_days, last_skipped into v_freq, v_last_skipped
    from public.contacts
    where id = p_contact_id and user_id = v_user_id;

  if not found then
    raise exception 'Contact not found';
  end if;

  if v_last_skipped then
    raise exception 'Cannot skip twice in a row';
  end if;

  insert into public.interactions (contact_id, user_id, type)
    values (p_contact_id, v_user_id, 'skip');

  update public.contacts set
    next_reminder_at = now() + (v_freq || ' days')::interval,
    last_skipped = true
  where id = p_contact_id and user_id = v_user_id;
end;
$$ language plpgsql security definer;

-- Trigger: Create profile and default categories on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url'
    );

  insert into public.categories (user_id, name, color, sort_order) values
    (new.id, 'Family', '#D4AF37', 0),
    (new.id, 'Friends', '#F5C542', 1),
    (new.id, 'Work', '#B8860B', 2),
    (new.id, 'Other', '#8B7355', 3);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
