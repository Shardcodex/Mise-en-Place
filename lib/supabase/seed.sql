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
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
  category text default 'Other' check (category in ('Produce','Dairy','Meat & Seafood','Bakery','Pantry','Frozen','Beverages','Other')),
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
-- INDEXES
-- ═══════════════════════════════════════
create index if not exists idx_recipes_user_id on public.recipes(user_id);
create index if not exists idx_ingredients_recipe_id on public.ingredients(recipe_id);
create index if not exists idx_steps_recipe_id on public.steps(recipe_id);
create index if not exists idx_planner_user_id on public.planner_assignments(user_id);
create index if not exists idx_shopping_user_id on public.shopping_checks(user_id);
