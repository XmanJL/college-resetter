# Reset Room

Reset Room is a private-first web app for college overwhelm. Its core loop is **Unload -> Relieve -> Reset**: put down the messy thought, make a little room, and leave with one bounded next action.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What is implemented

- Responsive landing page with clear product boundaries.
- Private thought dump with optional topic tags.
- Relief state selection and low-friction activity choices.
- Checkpoint to continue, repeat relief, or save.
- Editable next step with a time boundary.
- Private-by-default save confirmation.
- Read-only anonymous community preview.
- Support resources and non-diagnostic safety language.
- Draft persistence in browser `localStorage` for this prototype.

## Current MVP boundary

This is the private core-loop prototype. Authentication, a server database, real session history, account settings, moderation, and anonymous post creation are intentionally not wired yet. The current browser storage is useful for validating the experience but is not suitable for sensitive production data.

## Next build phase

1. Add Supabase Auth and Postgres with explicit visibility states: `private`, `personal_only`, and `anonymous_community`.
2. Move session persistence server-side with ownership checks, deletion, and export paths.
3. Add a real personal dashboard and save/share preview.
4. Add community posts, reactions, reporting, and hiding behind explicit opt-in.
5. Replace the placeholder crisis/campus links with verified local resources for the launch region.

## Verification

```bash
npm run lint
npm run build
```
