# PIANKY OS — Life Operating System

A gamified personal dashboard that creates causality between daily actions and long-term vision. Built for ADHD minds that need visible progress, limited choices, and emotional engagement.

## The PIANKY Hierarchy

1. **The Crystal Flask of Aman** — Health (controls 2X XP multiplier)
2. **The Father's Legacy** — Sacred/time-sensitive heritage projects
3. **Sovereign Self** — Growth, freedom, self-improvement
4. **PIANKY PICTURES** — Film production empire
5. **PIANKY OS** — This system and AI tools

## Tech Stack

- Vanilla JavaScript (ES modules, no framework, no build step)
- Supabase (PostgreSQL + Auth + Row Level Security)
- GitHub Pages (static hosting)
- Offline-first (localStorage + sync queue)

## Setup

1. Clone this repo
2. Create a free Supabase project at [supabase.com](https://supabase.com)
3. Run `supabase/schema.sql`, then `rls-policies.sql` in the SQL Editor
4. Copy your Project URL and anon key into `src/config.js`
5. Sign up in the app, then run `supabase/seed.sql` (replace `YOUR_USER_ID`)
6. Deploy to GitHub Pages

## Development

No build tools needed. Open `index.html` in a browser or serve with any static file server:

```bash
npx serve .
```

See `CONTEXT.md` for the full architecture guide.
