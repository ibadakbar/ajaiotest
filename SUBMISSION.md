# Submission — Draftly

## Product name and summary

**Draftly** is a lightweight collaborative document editor. Users create and edit rich-text documents, import text/Markdown files, and share documents with registered users as viewers or editors. Authorization is enforced with Supabase Auth sessions and Postgres RLS.

## Live URL

https://ajaiotest-vglk.vercel.app/

## Walkthrough URL

https://drive.google.com/drive/folders/1CWQFoTpNSQnE5nGdAb1VBiaSOW3gz51h?usp=sharing

## Source code location

- Local: `D:\testpracticeajaio`
- GitHub: https://github.com/ibadakbar/ajaiotest

## Setup instructions

1. `npm install`
2. Copy `.env.example` → `.env.local` and add Supabase URL + anon key (+ service role for seeding).
3. Run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) in the Supabase SQL editor.
4. `npm run seed`
5. `npm run dev`
6. Sign in at `/login` with a demo account.

## Demo credentials

| Email | Password |
| --- | --- |
| `alice@draftly.demo` | `DemoPass123!` |
| `bob@draftly.demo` | `DemoPass123!` |
| `carol@draftly.demo` | `DemoPass123!` |

Suggested demo: sign in as Alice, create a document, share with Bob as editor and Carol as viewer, then sign out and verify permissions as Bob/Carol.

## Implemented features

- Auth (email/password) with middleware-protected routes
- My Documents / Shared with Me workspace, search, create, rename
- Tiptap editor with formatting toolbar and JSON autosave
- Share / revoke with viewer and editor roles
- `.txt` / `.md` import with validation
- Unit tests for permissions, import, and autosave guards
- Assessment documentation set

## Incomplete features

- Real-time collaboration, trash, DOCX import (intentionally out of scope)

## Automated tests and actual results

Commands run in this session:

```text
npm run typecheck  → passed
npm run lint       → passed
npm run test       → 3 files, 19 tests passed
npm run build      → passed (Next.js 15.5.28 production build)
```

## Known limitations

See README “Known limitations”. Multi-user persistence requires a configured Supabase project.

## Next improvements (2–4 more hours)

1. Playwright happy-path covering create → share → viewer denied edit
2. Soft-delete Trash with RLS
3. Add a short Loom/YouTube screen recording of the live app (optional polish beyond the Drive walkthrough package)
4. Playwright E2E for create → share → viewer denied edit
