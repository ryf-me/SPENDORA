create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_firebase_uid text unique,
  name text not null,
  email text,
  bio text not null default '',
  photo_url text,
  currency text not null default 'LKR' check (currency in ('LKR', 'USD', 'EUR', 'GBP')),
  notifications jsonb not null default '{"email": true, "push": false, "inApp": true, "earlyWarning": "3", "paymentDay": "due"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    photo_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1), 'User'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  category text not null default '',
  description text not null default '',
  date date not null,
  receipt_url text,
  split_with text not null default '',
  subject text not null,
  merchant text not null,
  currency text not null default 'LKR' check (currency in ('LKR', 'USD', 'EUR', 'GBP')),
  reimbursable boolean not null default false,
  employee text not null default '',
  add_to_report boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  is_recurring boolean not null default false,
  frequency text not null default '' check (frequency in ('', 'Weekly', 'Monthly', 'Yearly')),
  end_date date,
  recurring_status text not null default 'active' check (recurring_status in ('active', 'paused')),
  recurring_notifications boolean not null default true,
  icon text,
  payment_method text not null default '' check (payment_method in ('', 'credit_card', 'debit_card', 'bank_transfer', 'cash', 'cheque')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.debtors (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  debtor_name text not null,
  phone_number text not null default '',
  email text not null default '',
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  expense_id text references public.expenses(id) on delete set null,
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'paid')),
  date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz
);

create table if not exists public.payments (
  id text primary key,
  debtor_id text not null references public.debtors(id) on delete cascade,
  debtor_name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null,
  method text not null default 'cash',
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedback (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  type text not null default 'Spendora Feeds',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.debtors enable row level security;
alter table public.payments enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage their own categories"
on public.categories
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own expenses" on public.expenses;
create policy "Users can manage their own expenses"
on public.expenses
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own debtors" on public.debtors;
create policy "Users can manage their own debtors"
on public.debtors
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own payments" on public.payments;
create policy "Users can manage their own payments"
on public.payments
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own feedback" on public.feedback;
create policy "Users can manage their own feedback"
on public.feedback
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.initialize_default_categories()
returns void
language plpgsql
as $$
begin
  insert into public.categories (id, user_id, name)
  select gen_random_uuid()::text, auth.uid(), category_name
  from unnest(array['Marketing', 'Sales', 'Operations', 'Finance', 'Travel', 'Meals']) as category_name
  where auth.uid() is not null
  on conflict (user_id, name) do nothing;
end;
$$;

create or replace function public.record_debtor_payment(
  p_debtor_id text,
  p_payment_amount numeric,
  p_method text default 'cash',
  p_date date default current_date
)
returns void
language plpgsql
as $$
declare
  v_debtor public.debtors%rowtype;
  v_new_paid_amount numeric;
  v_is_fully_paid boolean;
begin
  select *
  into v_debtor
  from public.debtors
  where id = p_debtor_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Unauthorized debtor payment attempt.';
  end if;

  if p_payment_amount is null or p_payment_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  v_new_paid_amount := coalesce(v_debtor.paid_amount, 0) + p_payment_amount;
  if v_new_paid_amount > v_debtor.amount then
    raise exception 'Payment amount exceeds remaining balance.';
  end if;

  v_is_fully_paid := v_new_paid_amount >= v_debtor.amount;

  update public.debtors
  set
    paid_amount = v_new_paid_amount,
    status = case when v_is_fully_paid then 'paid' else 'pending' end,
    paid_at = case when v_is_fully_paid then timezone('utc', now()) else null end
  where id = p_debtor_id
    and user_id = auth.uid();

  insert into public.payments (
    id,
    debtor_id,
    debtor_name,
    amount,
    date,
    method,
    user_id
  )
  values (
    gen_random_uuid()::text,
    v_debtor.id,
    v_debtor.debtor_name,
    p_payment_amount,
    coalesce(p_date, current_date),
    coalesce(nullif(p_method, ''), 'cash'),
    auth.uid()
  );
end;
$$;

create or replace function public.mark_debtor_paid(p_debtor_id text)
returns void
language plpgsql
as $$
declare
  v_debtor public.debtors%rowtype;
  v_remaining_to_pay numeric;
begin
  select *
  into v_debtor
  from public.debtors
  where id = p_debtor_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Unauthorized debtor settlement attempt.';
  end if;

  v_remaining_to_pay := v_debtor.amount - coalesce(v_debtor.paid_amount, 0);
  if v_remaining_to_pay <= 0 then
    return;
  end if;

  update public.debtors
  set
    paid_amount = v_debtor.amount,
    status = 'paid',
    paid_at = timezone('utc', now())
  where id = p_debtor_id
    and user_id = auth.uid();

  insert into public.payments (
    id,
    debtor_id,
    debtor_name,
    amount,
    date,
    method,
    user_id
  )
  values (
    gen_random_uuid()::text,
    v_debtor.id,
    v_debtor.debtor_name,
    v_remaining_to_pay,
    current_date,
    'Full Settlement',
    auth.uid()
  );
end;
$$;

create or replace function public.delete_debtor_with_payments(p_debtor_id text)
returns void
language plpgsql
as $$
begin
  delete from public.debtors
  where id = p_debtor_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Unauthorized debtor deletion attempt.';
  end if;
end;
$$;

grant execute on function public.initialize_default_categories() to authenticated;
grant execute on function public.record_debtor_payment(text, numeric, text, date) to authenticated;
grant execute on function public.mark_debtor_paid(text) to authenticated;
grant execute on function public.delete_debtor_with_payments(text) to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public avatars are viewable" on storage.objects;
create policy "Public avatars are viewable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.categories;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.expenses;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.debtors;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.payments;
  exception
    when duplicate_object then null;
  end;
end
$$;
