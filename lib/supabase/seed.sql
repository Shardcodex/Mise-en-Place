-- Mise en Place — Database Schema
-- Run this in the Supabase SQL Editor

-- ═══════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  week_start_day text default 'Monday' check (week_start_day in ('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════
-- RECIPES
-- ═══════════════════════════════════════
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  emoji text default '🍽️',
  servings integer default 4,
  time text default '',
  tags text[] default '{}',
  meal_types text[] default '{}',
  source_url text,
  photo_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrations (run if the table already exists):
-- alter table public.recipes add column if not exists notes text;
-- alter table public.recipes add column if not exists photo_path text;
-- alter table public.recipes add column if not exists meal_types text[] default '{}';
-- Expand ingredient category constraint (run on existing DB):
-- alter table public.ingredients drop constraint if exists ingredients_category_check;
-- alter table public.ingredients add constraint ingredients_category_check
--   check (category in ('Produce','Dairy','Meat & Seafood','Deli','Bakery','Canned Goods','Pantry','Condiments','Spices & Herbs','Frozen','Beverages','Other'));

alter table public.recipes enable row level security;

create policy "Users can view own recipes"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert own recipes"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recipes"
  on public.recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete own recipes"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- INGREDIENTS
-- ═══════════════════════════════════════
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  amount text default '',
  unit text default '',
  category text default 'Other' check (category in ('Produce','Dairy','Meat & Seafood','Deli','Bakery','Canned Goods','Pantry','Condiments','Spices & Herbs','Frozen','Beverages','Other')),
  sort_order integer default 0
);

alter table public.ingredients enable row level security;

create policy "Users can view own ingredients"
  on public.ingredients for select
  using (exists (
    select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can insert own ingredients"
  on public.ingredients for insert
  with check (exists (
    select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can update own ingredients"
  on public.ingredients for update
  using (exists (
    select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can delete own ingredients"
  on public.ingredients for delete
  using (exists (
    select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════
-- STEPS
-- ═══════════════════════════════════════
create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  text text not null,
  sort_order integer default 0
);

alter table public.steps enable row level security;

create policy "Users can view own steps"
  on public.steps for select
  using (exists (
    select 1 from public.recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can insert own steps"
  on public.steps for insert
  with check (exists (
    select 1 from public.recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can update own steps"
  on public.steps for update
  using (exists (
    select 1 from public.recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid()
  ));

create policy "Users can delete own steps"
  on public.steps for delete
  using (exists (
    select 1 from public.recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid()
  ));

-- ═══════════════════════════════════════
-- PLANNER ASSIGNMENTS
-- ═══════════════════════════════════════
create table if not exists public.planner_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  scale numeric default 1.0,
  created_at timestamptz default now()
);

alter table public.planner_assignments enable row level security;

create policy "Users can view own assignments"
  on public.planner_assignments for select
  using (auth.uid() = user_id);

create policy "Users can insert own assignments"
  on public.planner_assignments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assignments"
  on public.planner_assignments for update
  using (auth.uid() = user_id);

create policy "Users can delete own assignments"
  on public.planner_assignments for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- SHOPPING CHECKS
-- ═══════════════════════════════════════
create table if not exists public.shopping_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ingredient_key text not null,
  checked boolean default false,
  unique(user_id, ingredient_key)
);

alter table public.shopping_checks enable row level security;

create policy "Users can view own checks"
  on public.shopping_checks for select
  using (auth.uid() = user_id);

create policy "Users can insert own checks"
  on public.shopping_checks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checks"
  on public.shopping_checks for update
  using (auth.uid() = user_id);

create policy "Users can delete own checks"
  on public.shopping_checks for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- COOKBOOKS
-- ═══════════════════════════════════════
create table if not exists public.cookbooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cookbooks enable row level security;

create policy "Cookbook visible to owner and accepted members"
  on public.cookbooks for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.cookbook_members m
      where m.cookbook_id = id and m.user_id = auth.uid() and m.status = 'accepted'
    )
  );

create policy "Users can create cookbooks"
  on public.cookbooks for insert
  with check (auth.uid() = owner_id);

create policy "Owner can update cookbook"
  on public.cookbooks for update
  using (auth.uid() = owner_id);

create policy "Owner can delete cookbook"
  on public.cookbooks for delete
  using (auth.uid() = owner_id);

-- ═══════════════════════════════════════
-- COOKBOOK MEMBERS
-- ═══════════════════════════════════════
create table if not exists public.cookbook_members (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references public.cookbooks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  invite_token uuid default gen_random_uuid() unique not null,
  role text not null default 'member' check (role in ('owner','member')),
  status text not null default 'pending' check (status in ('pending','accepted')),
  invited_at timestamptz default now(),
  accepted_at timestamptz
);

alter table public.cookbook_members enable row level security;

create policy "Member visible to self and cookbook owner"
  on public.cookbook_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.cookbooks c where c.id = cookbook_id and c.owner_id = auth.uid()
    )
    -- allow reading own pending invite by token (needed for accept flow)
    or invite_token::text = current_setting('request.jwt.claims', true)::json->>'invite_token'
  );

create policy "Owner can invite members"
  on public.cookbook_members for insert
  with check (
    exists (select 1 from public.cookbooks c where c.id = cookbook_id and c.owner_id = auth.uid())
  );

create policy "Member can accept invite, owner can manage"
  on public.cookbook_members for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.cookbooks c where c.id = cookbook_id and c.owner_id = auth.uid())
  );

create policy "Owner or member can remove"
  on public.cookbook_members for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.cookbooks c where c.id = cookbook_id and c.owner_id = auth.uid())
  );

-- ═══════════════════════════════════════
-- COOKBOOK MIGRATIONS (run after initial schema)
-- ═══════════════════════════════════════
-- Add cookbook_id to recipes:
-- alter table public.recipes add column if not exists cookbook_id uuid references public.cookbooks(id) on delete set null;
--
-- Drop and recreate recipe RLS to allow cookbook member access:
-- drop policy if exists "Users can view own recipes" on public.recipes;
-- create policy "Users can view own recipes"
--   on public.recipes for select
--   using (
--     auth.uid() = user_id
--     or (cookbook_id is not null and exists (
--       select 1 from public.cookbooks c where c.id = cookbook_id and c.owner_id = auth.uid()
--     ))
--     or (cookbook_id is not null and exists (
--       select 1 from public.cookbook_members m
--       where m.cookbook_id = recipes.cookbook_id and m.user_id = auth.uid() and m.status = 'accepted'
--     ))
--   );
--
-- (Repeat similar expansions for insert/update/delete and for ingredients/steps.)
--
-- Migrate existing recipes into a default cookbook per user:
-- insert into public.cookbooks (owner_id, name)
--   select distinct user_id, 'My Cookbook' from public.recipes
--   on conflict do nothing;
-- update public.recipes r
--   set cookbook_id = (select id from public.cookbooks c where c.owner_id = r.user_id limit 1)
--   where cookbook_id is null;

-- ═══════════════════════════════════════
-- STORAGE — recipe-photos bucket
-- ═══════════════════════════════════════

-- Create the private bucket (safe to re-run)
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', false)
on conflict (id) do nothing;

-- Anyone authenticated can upload into their own folder ({user_id}/...)
create policy "Authenticated users can upload recipe photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Any authenticated user can read photos (needed for cookbook sharing + signed URLs)
create policy "Authenticated users can read recipe photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'recipe-photos');

-- Users can replace/update their own photos
create policy "Users can update own recipe photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos
create policy "Users can delete own recipe photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════
create index if not exists idx_recipes_user_id on public.recipes(user_id);
create index if not exists idx_recipes_cookbook_id on public.recipes(cookbook_id);
create index if not exists idx_ingredients_recipe_id on public.ingredients(recipe_id);
create index if not exists idx_steps_recipe_id on public.steps(recipe_id);
create index if not exists idx_planner_user_id on public.planner_assignments(user_id);
create index if not exists idx_shopping_user_id on public.shopping_checks(user_id);
create index if not exists idx_cookbook_members_cookbook on public.cookbook_members(cookbook_id);
create index if not exists idx_cookbook_members_user on public.cookbook_members(user_id);
create index if not exists idx_cookbook_members_token on public.cookbook_members(invite_token);
