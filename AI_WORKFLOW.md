# AI workflow

## AI tools actually used

- **Cursor Agent (Composer)** — primary implementation assistant for scaffolding, feature code, tests, and documentation in this repository.

## Where AI materially accelerated implementation

- Bootstrapping the Next.js App Router project structure and Tailwind baseline
- Drafting Supabase SQL (schema, RLS policies, auth trigger)
- Implementing Tiptap editor wiring, toolbar, and debounced autosave patterns
- Building share/import flows and Vitest unit tests for pure helpers
- Producing assessment documentation (`README`, `ARCHITECTURE`, `SUBMISSION`)

## Suggestions reviewed, changed, or rejected

- **Rejected client-side user impersonation dropdown** — demo switching uses real Supabase sign-in with seeded accounts instead.
- **Rejected localStorage as primary storage** — persistence is Postgres via Supabase.
- **Narrowed Markdown import** — full CommonMark / HTML passthrough was rejected; only a safe subset is converted to Tiptap JSON.
- **Rejected Trash navigation** — omitted because soft-delete was not implemented.
- **Tightened autosave** — initial generation-only guard was insufficient for DB races; optimistic `updated_at` locking and resave-after-inflight were added.

## How verification was performed

- `npm run typecheck` — TypeScript passed after fixing login state typing.
- `npm run lint` — ESLint passed after removing unused variables / prefer-const issues.
- `npm run test` — 19 Vitest tests passed (permissions, import validation/parsing, autosave generation guard).
- `npm run build` — production build executed (see `SUBMISSION.md` for result).
- Manual end-to-end multi-user flows against a live Supabase project require credentials in `.env.local` and were not claimed as verified without that environment.

## Remaining risks or unverified behavior

- Live Auth/RLS behavior depends on applying `supabase/migrations/001_init.sql` and seeding demo users in a real Supabase project.
- Supabase foreign-key join names in queries assume default Postgres FK naming from the migration; if renamed, list/detail queries need adjustment.
- Conflict retry after optimistic-lock failure omits `expectedUpdatedAt` on the retry path — correct for recovering latest content, but concurrent editors can still last-write-win (no CRDT).
- Deployment URL was not verified unless explicitly recorded in `SUBMISSION.md`.
