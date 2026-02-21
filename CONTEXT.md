# PIANKY OS — Context Document

> Paste this at the start of any Claude session working on this project.
> Last updated: 2026-02-21

## What This Is

A personal life operating system for Sami — a gamified task/goal management dashboard built with vanilla JS + Supabase, deployed on GitHub Pages. Designed for someone with ADHD who needs visible progress, limited daily choices, and emotional engagement.

## The PIANKY Hierarchy (5 Tiers)

| Tier | Codename | Category | Color | XP Weight |
|------|----------|----------|-------|-----------|
| 1 | The Crystal Flask of Aman | Health | #D4AF37 (Gold) | 1.50 |
| 2 | The Father's Legacy | Sacred/Urgent | #CD7F32 (Bronze) | 1.35 |
| 3 | Sovereign Self | Growth/Freedom | #4169E1 (Blue) | 1.15 |
| 4 | PIANKY PICTURES | Film/Creative | #9B59B6 (Purple) | 1.00 |
| 5 | PIANKY OS | Tech/System | #00CED1 (Cyan) | 0.85 |

**Health multiplier:** If a Tier 1 task is completed today, ALL XP earned that day is 2x. No blocking, just incentive.

## Tech Stack

- **Frontend:** Vanilla JS with ES modules (`<script type="module">`), no build step
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** GitHub Pages
- **Supabase JS:** Loaded from jsDelivr CDN (`/+esm` suffix)
- **Offline:** localStorage as primary store, sync queue for Supabase
- **Routing:** Hash-based SPA (`/#/tasks`, `/#/groceries`, etc.)
- **Auth:** Email/password via Supabase Auth

## XP Formula

```
earned_xp = base_xp × tier_weight × health_multiplier × streak_bonus
```
- base_xp: per tier (6.75, 5.80, 5.25, 4.80, 3.75)
- health_multiplier: 2.0 if health done today, else 1.0
- streak_bonus: 1.0 + (0.05 × streak_days), caps at 1.50

## File Structure

```
life-os/
├── index.html              # App shell
├── CONTEXT.md              # This file
├── .gitignore
├── src/
│   ├── app.js              # Entry point
│   ├── config.js           # All config (Supabase keys, tiers, XP formulas)
│   ├── router.js           # Hash-based SPA router
│   ├── services/
│   │   ├── supabase.js     # Supabase client init
│   │   ├── auth.js         # Auth (sign in/up/out)
│   │   ├── db.js           # Offline-first CRUD
│   │   ├── sync.js         # Sync engine (localStorage ↔ Supabase)
│   │   └── xp.js           # XP calculation engine
│   ├── views/
│   │   ├── dashboard.js    # Home (focus, stats, health check)
│   │   ├── tasks.js        # Task list (add, highlight top 3, complete)
│   │   ├── groceries.js    # Grocery list (priority, bought toggle)
│   │   ├── deadlines.js    # Deadlines (countdown, color coding)
│   │   ├── settings.js     # Profile, sync, export, setup guide
│   │   └── login.js        # Auth screen
│   ├── components/
│   │   ├── nav.js          # Sidebar/bottom nav
│   │   ├── toast.js        # Notifications
│   │   ├── modal.js        # Dialog
│   │   ├── task-card.js    # Task item
│   │   ├── daily-focus.js  # Focus widget
│   │   ├── deadline-card.js
│   │   ├── grocery-item.js
│   │   ├── progress-bar.js
│   │   └── loading-screen.js
│   └── utils/
│       ├── dom.js          # $(), el(), uuid()
│       ├── storage.js      # localStorage wrapper
│       ├── date.js         # Date formatting, countdown
│       └── animations.js   # XP popup, fade in/out
├── css/
│   ├── main.css            # Dark theme, variables, layout
│   ├── components.css      # Component styles
│   ├── views.css           # View styles
│   └── animations.css      # Keyframes
├── supabase/
│   ├── schema.sql          # All tables
│   ├── rls-policies.sql    # Row-level security
│   └── seed.sql            # Initial goals, key results, quotes
└── assets/
    ├── visionboard/
    └── icons/
```

## Database Tables

Phase 1: `profiles`, `goals`, `key_results`, `tasks`, `xp_logs`, `deadlines`, `groceries`, `weight_logs`, `daily_health_checks`, `quotes`
Phase 2: `books`, `reading_logs`, `skill_points`
Phase 3: `projects`

All tables have `user_id` + RLS policies. `updated_at` triggers for conflict resolution.

## Data Flow

```
User action → localStorage write → sync queue → Supabase push (debounced 2s)
App load → localStorage read (instant) → Supabase pull (background) → merge by updated_at
```

## Current State

- **Phase 1: COMPLETE** — All foundation files created
- Tasks, groceries, deadlines, dashboard, auth, XP engine, offline sync — all implemented
- Supabase needs to be configured (replace placeholders in `src/config.js`)
- No vision board images yet (Phase 2)
- No Telegram integration yet (Phase 3)

## What's Next (Phase 2)

- Vision board grid with images on dashboard
- Goals → Key Results detail view
- Kushite flask visualization (SVG/CSS animated liquid fill)
- Book logging with covers and reading stats
- Skill radar chart
- Weight graph
- Advanced gamification (levels, milestones, confetti)
- Micro-interactions and animation polish

## Important Notes for Claude Sessions

- **Don't change `src/config.js` structure** without updating all consumers
- **Supabase keys are placeholders** — app works in offline mode without them
- **Each view exports `render(container)`** that populates the `#app` div
- **All data operations go through `src/services/db.js`** — never read/write localStorage directly from views
- **XP is always calculated, never manually assigned** — see `src/services/xp.js`
