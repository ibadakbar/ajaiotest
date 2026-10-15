# Draftly

A lightweight collaborative document editor — a practical Google Docs alternative built for the Ajaia LLC Full Stack Product Engineer assessment.

## Implemented features

- Workspace with sidebar navigation: **My Documents** and **Shared with Me**
- Document search by title
- Create, rename, open, edit, and reopen documents
- Tiptap rich-text editor (bold, italic, underline, headings, lists, undo/redo)
- Structured JSON content persistence with debounced autosave
- Visible save states: Saving / Saved / Save failed (with retry)
- Import `.txt` and `.md` files into editable documents
- Sharing by email with **viewer** and **editor** roles, plus revoke
- Server-verified Supabase Auth sessions and Postgres Row Level Security
- Seeded demo accounts for assessment switching (real sign-in, not client impersonation)

## Technology stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Tiptap
- Supabase Auth + Postgres + RLS
- Vitest

## Prerequisites

- Node.js 20+
- npm
- A Supabase project

## Environment variables

Copy `.env.example` to `.env.local` and fill in values from Supabase → Settings → API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never commit `.env.local` or expose the service role key to the browser.

## Local installation

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase credentials
```

## Database setup and migrations

1. Open the Supabase SQL editor (or use the Supabase CLI).
2. Run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) in full.
   This creates `profiles`, `documents`, `document_shares`, indexes, triggers, and RLS policies.
3. Seed demo users:

```bash
npm run seed
```

This creates:

| Email | Password | Suggested role in demos |
| --- | --- | --- |
| `alice@draftly.demo` | `DemoPass123!` | Owner |
| `bob@draftly.demo` | `DemoPass123!` | Editor collaborator |
| `carol@draftly.demo` | `DemoPass123!` | Viewer collaborator |

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a demo account.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deployment (Vercel)

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Set the same environment variables as `.env.example` (including `NEXT_PUBLIC_*` and optionally `SUPABASE_SERVICE_ROLE_KEY` only if you need seed scripts in CI — prefer keeping the service role out of the web app runtime).
4. Apply the SQL migration to your production Supabase project and run the seed script against it.
5. Deploy.

Deployment status for this submission: see [`SUBMISSION.md`](SUBMISSION.md).

## Known limitations

- No real-time multiplayer cursors or CRDT sync
- No Trash / soft-delete
- No DOCX import
- Markdown import supports a useful subset (headings, lists, bold/italic, paragraphs), not full CommonMark
- Live multi-user features require a configured Supabase project
