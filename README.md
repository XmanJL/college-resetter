# Reset Room

Reset Room is a private-first web app for college overwhelm. Its core loop is **Unload -> Relieve -> Reset**: put down the messy thought, make a little room, and leave with one bounded next action.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

Create a Supabase project, copy `.env.example` to `.env.local`, fill in the project URL and anon key, and run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. Email/password auth must be enabled in Supabase Auth. The schema enables RLS so sessions are only readable, exportable, or deletable by their owner.

The app uses the U.S. as its launch region for verified support links: 988, 911, SAMHSA's treatment locator, and Crisis Text Line. Campus contacts are intentionally routed through each school's official `.edu` site because no specific campus was provided.

## What is implemented

- Responsive landing page with clear product boundaries.
- Private thought dump with optional topic tags.
- Relief state selection and low-friction activity choices.
- Checkpoint to continue, repeat relief, or save.
- Editable next step with a time boundary.
- Private-by-default save confirmation with `private`, `personal_only`, and `anonymous_community` visibility.
- Supabase Auth, server-side session persistence, ownership checks, deletion, and JSON export.
- Personal dashboard and exact anonymous sharing preview.
- Opt-in community posts, reactions, reporting, and owner hiding.
- Verified U.S. support links and non-diagnostic safety language.

## Production notes

Community moderation should be connected to an admin workflow before public launch. The current report endpoint records reports and owner hiding is available; it does not yet auto-moderate or notify staff.

## Verification

```bash
npm run lint
npm run build
```
