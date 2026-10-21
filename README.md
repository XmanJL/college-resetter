# Reset Room

Reset Room is a private-first web app for college overwhelm. Its core loop is **Unload -> Relieve -> Reset**: put down the messy thought, make a little room, and leave with one bounded next action.

## Tech Stack

- Next.js 16.3.8 with the App Router
- React 19 and TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, and row-level security

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

Create a Supabase project, copy `.env.example` to `.env.local`, fill in the project URL and anon key, and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. Email/password auth must be enabled in Supabase Auth. The schema enables RLS so sessions are only readable, exportable, or deletable by their owner.

### Database migrations

A migration is a versioned database change, such as adding columns or changing a table. Run each migration once for the Supabase project it belongs to. Keep migration files in `supabase/migrations/` so future environments can reproduce the same database structure.

To apply migrations with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The project reference is available in Supabase under **Project Settings → General**. If the CLI does not detect a migration, copy the SQL file into the Supabase **SQL Editor** and run it there. Do not run the same migration repeatedly after it has been applied.

The app uses the U.S. as its launch region for verified support links: 988, 911, SAMHSA's treatment locator, and Crisis Text Line. Campus contacts are intentionally routed through each school's official `.edu` site because no specific campus was provided.

To log out from Supabase CLI:

```bash
npx supabase logout
```

## What is implemented

This is the current user-facing functionality available in the app:

- **Reset flow:** Responsive landing page with clear product boundaries and the **Unload -> Relieve -> Reset** flow.
- **Stages 01–04:** Required thought dump with built-in and custom color-coded threads, mood selection with emoji indicators, low-friction activity choices, and an editable next step with a time boundary.
- **Checkpoint:** Continue, repeat relief, or save a reset.
- **Accounts and data:** Supabase Auth, server-side session persistence, ownership checks, private-by-default save confirmation, `private` and `anonymous_community` visibility, deletion, and PDF export.
- **Personal dashboard:** Search, timestamps, selected threads, moods, edit/delete actions, and an anonymous sharing preview.
- **Community:** Opt-in community posts, reactions, reporting, and owner hiding.
- **Support:** Verified U.S. support links and non-diagnostic safety language.

## Production notes

Community moderation should be connected to an admin workflow before public launch. The current report endpoint records reports and owner hiding is available; it does not yet auto-moderate or notify staff.

## Verification

```bash
npm run lint
npm run build
```
