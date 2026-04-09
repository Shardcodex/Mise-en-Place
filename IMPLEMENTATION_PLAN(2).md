# Mise en Place — Implementation Plan

## User Context

- **Developer experience:** Familiar with Supabase + Vercel workflow, has shipped projects on this stack before
- **Goal:** Convert the existing Electron/localStorage recipe planner into a full web app with cloud persistence
- **Platform:** Web app (desktop + mobile responsive), deployed on Vercel
- **Design reference:** Mowgli export with 4 screen mockups (RecipeGridScreen, PlannerScreen, ShoppingScreen, SettingsScreen) using "Sage and Slate" theme with Work Sans font

## Technical Stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS (matching Mowgli mockup classes) |
| **Icons** | Lucide React (matching Mowgli mockup imports) |
| **Font** | Work Sans (via next/font/google) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password login) |
| **Hosting** | Vercel (connected to GitHub repo) |
| **State** | React hooks + Supabase realtime (no Redux needed) |

## Database Schema (Supabase)

### Tables

**profiles**
- `id` UUID PK (references auth.users.id)
- `display_name` TEXT
- `week_start_day` TEXT DEFAULT 'Monday'
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**recipes**
- `id` UUID PK DEFAULT gen_random_uuid()
- `user_id` UUID FK → profiles.id (RLS)
- `name` TEXT NOT NULL
- `emoji` TEXT DEFAULT '🍽️'
- `servings` INTEGER DEFAULT 4
- `time` TEXT
- `tags` TEXT[] (Postgres array)
- `source_url` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

**ingredients**
- `id` UUID PK DEFAULT gen_random_uuid()
- `recipe_id` UUID FK → recipes.id ON DELETE CASCADE
- `name` TEXT NOT NULL
- `amount` TEXT
- `unit` TEXT
- `category` TEXT DEFAULT 'Other'
- `sort_order` INTEGER DEFAULT 0

**steps**
- `id` UUID PK DEFAULT gen_random_uuid()
- `recipe_id` UUID FK → recipes.id ON DELETE CASCADE
- `text` TEXT NOT NULL
- `sort_order` INTEGER DEFAULT 0

**planner_assignments**
- `id` UUID PK DEFAULT gen_random_uuid()
- `user_id` UUID FK → profiles.id (RLS)
- `recipe_id` UUID FK → recipes.id ON DELETE CASCADE
- `day` TEXT NOT NULL (Monday, Tuesday, etc.)
- `meal_type` TEXT NOT NULL (breakfast, lunch, dinner, snack)
- `scale` NUMERIC DEFAULT 1.0
- `created_at` TIMESTAMPTZ

**shopping_checks**
- `id` UUID PK DEFAULT gen_random_uuid()
- `user_id` UUID FK → profiles.id (RLS)
- `ingredient_key` TEXT NOT NULL (unique key for the specific ingredient instance)
- `checked` BOOLEAN DEFAULT false

### Row Level Security (RLS)

All tables enforce `user_id = auth.uid()` for SELECT, INSERT, UPDATE, DELETE. Users can only see and modify their own data.

## File Structure

```
mise-en-place/
├── app/
│   ├── layout.tsx              # Root layout (font, providers)
│   ├── page.tsx                # Redirect: authed → /recipes, unauthed → /login
│   ├── login/
│   │   └── page.tsx            # Login / signup page
│   ├── (app)/                  # Authenticated app group layout
│   │   ├── layout.tsx          # App shell (sidebar + mobile nav + auth guard)
│   │   ├── recipes/
│   │   │   └── page.tsx        # Recipe grid screen
│   │   ├── planner/
│   │   │   └── page.tsx        # Weekly planner screen
│   │   ├── shopping/
│   │   │   └── page.tsx        # Shopping list screen
│   │   └── settings/
│   │       └── page.tsx        # Settings screen
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Desktop sidebar nav
│   │   ├── MobileHeader.tsx    # Mobile header bar
│   │   ├── MobileTabBar.tsx    # Mobile bottom tab bar
│   │   └── Toast.tsx           # Toast notification system
│   ├── recipes/
│   │   ├── RecipeCard.tsx      # Single recipe card in grid
│   │   ├── RecipeGrid.tsx      # Grid container
│   │   ├── RecipeDetailModal.tsx
│   │   ├── RecipeFormModal.tsx
│   │   └── PasteImportModal.tsx
│   ├── planner/
│   │   ├── DayCard.tsx         # Single day with meal slots
│   │   ├── MealSlot.tsx        # Individual meal slot
│   │   ├── RecipeChip.tsx      # Assigned recipe pill
│   │   └── RecipePicker.tsx    # Floating picker (add/edit mode)
│   ├── shopping/
│   │   ├── CategoryGroup.tsx   # Category with items
│   │   └── ShoppingItem.tsx    # Single checkable item
│   └── ui/
│       ├── Button.tsx          # Primary, secondary, danger variants
│       ├── Input.tsx           # Form input with label
│       ├── Modal.tsx           # Reusable modal wrapper
│       └── Tag.tsx             # Color-coded tag pill
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server-side Supabase client
│   │   ├── middleware.ts        # Auth session refresh
│   │   └── seed.sql            # SQL: table creation + RLS policies
│   ├── types.ts                # TypeScript types matching DB schema
│   ├── constants.ts            # Categories, meals, days, tag color map
│   ├── parser.ts               # smartParseRecipe logic (from current app)
│   └── utils.ts                # Helpers (tag colors, emoji picker, etc.)
├── hooks/
│   ├── useRecipes.ts           # CRUD operations for recipes
│   ├── usePlanner.ts           # Planner assignment operations
│   ├── useShopping.ts          # Shopping list aggregation + checks
│   └── useToast.ts             # Toast state management
├── middleware.ts                # Next.js middleware (auth redirect)
├── tailwind.config.ts
├── next.config.js
├── package.json
└── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Implementation Tasks

### Phase 0: Project Setup
- [ ] 0.1 Initialize Next.js project with App Router, Tailwind CSS, TypeScript
- [ ] 0.2 Install dependencies: @supabase/supabase-js, @supabase/ssr, lucide-react
- [ ] 0.3 Configure Work Sans font via next/font/google
- [ ] 0.4 Set up Tailwind config with Sage and Slate color tokens as CSS variables
- [ ] 0.5 Create `lib/supabase/client.ts` and `lib/supabase/server.ts` (browser + server clients)
- [ ] 0.6 Create `middleware.ts` for auth session refresh
- [ ] 0.7 Create `.env.local.example` with required env vars
- [ ] 0.8 Create `lib/types.ts` with TypeScript types for Recipe, Ingredient, Step, PlannerAssignment, etc.
- [ ] 0.9 Create `lib/constants.ts` with categories, meals, days, tag color map (from Mowgli mockup)

### Phase 1: Database & Auth
- [ ] 1.1 Write `lib/supabase/seed.sql` with full schema: profiles, recipes, ingredients, steps, planner_assignments, shopping_checks
- [ ] 1.2 Write RLS policies for all tables (user_id = auth.uid())
- [ ] 1.3 Write trigger: auto-create profile row on auth.users insert
- [ ] 1.4 Build login page (`app/login/page.tsx`) — email/password sign up and sign in
- [ ] 1.5 Build root page redirect logic (`app/page.tsx`)
- [ ] 1.6 Test auth flow end-to-end: sign up → redirect to /recipes → sign out → redirect to /login

### Phase 2: App Shell & Layout
- [ ] 2.1 Build root layout (`app/layout.tsx`) with font, metadata, providers
- [ ] 2.2 Build app group layout (`app/(app)/layout.tsx`) with auth guard
- [ ] 2.3 Build `Sidebar.tsx` — matching Mowgli mockup exactly (Work Sans, nav items with Lucide icons, active state, bottom "Local Kitchen" section)
- [ ] 2.4 Build `MobileHeader.tsx` — matching Mowgli mobile header
- [ ] 2.5 Build `MobileTabBar.tsx` — matching Mowgli mobile tab bar (icon-only, fixed bottom)
- [ ] 2.6 Build `Toast.tsx` — pill-shaped notification system with slide-up animation
- [ ] 2.7 Build shared UI components: Button (primary/secondary/danger), Input, Modal, Tag
- [ ] 2.8 Verify responsive layout: sidebar on ≥768px, tab bar on mobile

### Phase 3: Recipe Collection (Journey 2)
- [ ] 3.1 Build `useRecipes.ts` hook — fetch all recipes (with ingredients + steps), create, update, delete
- [ ] 3.2 Build `RecipeCard.tsx` — matching Mowgli mockup (emoji circle, name, metadata row, color-coded tags, hover animation with colored top border)
- [ ] 3.3 Build `RecipeGrid.tsx` — responsive grid (1/2/3/4 columns), search filter
- [ ] 3.4 Build `recipes/page.tsx` — wire up grid with header, search, Add and Paste buttons
- [ ] 3.5 Build `RecipeDetailModal.tsx` — matching Mowgli mockup (sticky header with emoji + metadata, ingredients grouped by category with icons, numbered steps with @ingredient chips, footer actions)
- [ ] 3.6 Implement @ingredient chip rendering — valid chips as clickable pills with tooltip, broken refs with warning icon
- [ ] 3.7 Build `RecipeFormModal.tsx` — create/edit mode, dynamic ingredient rows, dynamic step textareas, @mention validation warning
- [ ] 3.8 Build `PasteImportModal.tsx` — textarea, source URL input, parse button, preview card with detected data, confirm/edit actions
- [ ] 3.9 Port `smartParseRecipe` logic to `lib/parser.ts` (with the improved ingredient/step detection fixes)
- [ ] 3.10 Wire up recipe CRUD: create (manual + paste), edit, delete with confirmation
- [ ] 3.11 Implement print recipe functionality (browser print dialog with clean CSS)

### Phase 4: Seed Data Migration
- [ ] 4.1 Create `lib/seed-recipes.ts` with the 37 Notion recipes as a typed array
- [ ] 4.2 Build seed function: on first login, check if user has 0 recipes → bulk insert 37 seed recipes with ingredients and steps
- [ ] 4.3 Wire seed into the app: trigger on first authenticated page load, show toast "37 recipes loaded"

### Phase 5: Weekly Planner (Journey 3)
- [ ] 5.1 Build `usePlanner.ts` hook — fetch assignments for current week, add, update (move/scale), remove
- [ ] 5.2 Build `DayCard.tsx` — matching Mowgli mockup (day name + date header, 4 meal slots with icons)
- [ ] 5.3 Build `MealSlot.tsx` — slot label, "+" add button, recipe chips
- [ ] 5.4 Build `RecipeChip.tsx` — emoji + name + scale badge + delete icon
- [ ] 5.5 Build `RecipePicker.tsx` — Add mode (searchable recipe list → scale selector → confirm) and Edit mode (current recipe display, day/slot dropdowns, scale selector → confirm)
- [ ] 5.6 Build `planner/page.tsx` — 2-column day grid (1 column mobile), week navigation, wire up picker
- [ ] 5.7 Implement scale selector with presets (0.5x, 1x, 1.5x, 2x) and custom input
- [ ] 5.8 Implement move meal: change day/slot from edit picker, remove from old slot
- [ ] 5.9 Wire planner to respect `week_start_day` setting from profile

### Phase 6: Shopping List (Journey 4)
- [ ] 6.1 Build `useShopping.ts` hook — aggregate ingredients from planner (with scale multiplication), group by category, manage check state
- [ ] 6.2 Build `CategoryGroup.tsx` — matching Mowgli mockup (colored header with icon, item list)
- [ ] 6.3 Build `ShoppingItem.tsx` — circular checkbox, name, amounts, recipe source tags, strikethrough on check
- [ ] 6.4 Build `shopping/page.tsx` — 2-column category grid (1 column mobile), "Clear checked" and "Print" buttons
- [ ] 6.5 Implement check/uncheck persistence to shopping_checks table
- [ ] 6.6 Implement "Clear checked" with confirmation dialog
- [ ] 6.7 Implement print with formatted CSS (clean layout, page breaks, checkboxes)

### Phase 7: Settings (Journey 5)
- [ ] 7.1 Build `settings/page.tsx` — matching Mowgli mockup (week start day dropdown, data management section)
- [ ] 7.2 Implement week start day selector — save to profile, immediate planner reorder
- [ ] 7.3 Implement export backup — download JSON of all user data (recipes, planner, checks)
- [ ] 7.4 Implement import backup — upload JSON, validate, upsert into Supabase
- [ ] 7.5 Implement reset all data — confirmation modal, delete all user rows, re-seed 37 recipes
- [ ] 7.6 Add sign out button

### Phase 8: Polish & Deploy
- [ ] 8.1 Add loading states (skeleton screens for recipe grid, planner)
- [ ] 8.2 Add empty states matching Mowgli mockup patterns
- [ ] 8.3 Add error handling with user-friendly messages
- [ ] 8.4 Test responsive layout: desktop (1100+), tablet (768-1100), mobile (<768)
- [ ] 8.5 Add page metadata (title, description, favicon)
- [ ] 8.6 Deploy to Vercel, connect GitHub repo, set env vars
- [ ] 8.7 Test full flow: sign up → seed → browse → add recipe → plan week → generate shopping list → check items → export → sign out
