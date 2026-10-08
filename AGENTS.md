<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reset Room Project Instructions

## Environment

- Next.js 16.3.8 with the App Router
- React 19 and TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, and row-level security

## Project Structure

- `src/app/page.tsx`: main client-side user experience and reset flow
- `src/app/globals.css`: shared theme, layout, and responsive styles
- `src/app/api/`: server-side auth, session, and community routes
- `src/utils/supabase/`: browser, server, and middleware Supabase helpers
- `supabase/schema.sql`: database schema and RLS policies

## Development Commands

- `npm run dev`: start the development server
- `npm run lint`: run ESLint
- `npm run build`: verify the production build

## Code Conventions

- Prefer simple, focused functions and components; add abstractions only when they remove meaningful duplication or complexity.
- Reuse existing utilities, styles, and API routes so new code stays consistent with the project.
- Use clear names, preserve existing behavior, and keep each change limited to the requested task.
- Never place secrets or private user data in source code, browser logs, or committed configuration.

## Validation

- Run `npm run lint` after every code change.
- Run `npm run build` after changes to routes, authentication, layout, shared styles, or configuration.
- For UI changes, verify desktop and mobile layouts and check that interactive controls remain keyboard accessible.
