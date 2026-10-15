# Submission — Draftly

## Product name and summary

**Draftly** is a lightweight collaborative document editor inspired by Google Docs. It supports document creation/editing with rich text, `.txt`/`.md` import, ownership, viewer/editor sharing, and Postgres persistence via Supabase.

## Live product URL

https://ajaiotest-vglk.vercel.app/

## Source code

https://github.com/ibadakbar/ajaiotest

## Walkthrough video URL

https://drive.google.com/file/d/1Bk0dfXibLZ2nOwq2gsXpSDrxZ4I4aRKz/view?usp=sharing

Drive folder (screenshots + HTML package):  
https://drive.google.com/drive/folders/1CWQFoTpNSQnE5nGdAb1VBiaSOW3gz51h?usp=sharing


## Demo credentials (required for sharing review)

| Email | Password | Role in demo |
| --- | --- | --- |
| `alice@draftly.demo` | `DemoPass123!` | Owner |
| `bob@draftly.demo` | `DemoPass123!` | Editor collaborator |
| `carol@draftly.demo` | `DemoPass123!` | Viewer collaborator |

Suggested review path: sign in as Alice → create/edit → Share with Bob (editor) and Carol (viewer) → sign in as Bob/Carol and verify permissions.

## Local setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and add Supabase URL + anon key (+ service role for seeding)
3. Run `supabase/migrations/001_init.sql` in the Supabase SQL editor
4. `npm run seed`
5. `npm run dev` → http://localhost:3000

## What is included

- README.md — setup and run instructions
- ARCHITECTURE.md — architecture, schema, tradeoffs, deprioritized work
- AI_WORKFLOW.md — AI tools used, accepted/rejected suggestions, verification
- SUBMISSION.md — this file
- WALKTHROUGH_URL.txt — walkthrough link(s)
- Source code on GitHub + live Vercel deployment
- Automated tests (Vitest)

## What is working

- Create, rename, edit, autosave, reopen documents (Tiptap JSON persistence)
- Rich text: bold, italic, underline, headings, bullets, numbers, undo/redo
- Import `.txt` and `.md` into a new editable document
- Sharing by email with viewer/editor roles + revoke
- Owned vs Shared with Me views
- Server-verified Supabase Auth + RLS authorization
- Validation/error/empty/loading/save-failed states
- Deployed app on Vercel

## What is incomplete / intentionally deprioritized

- Real-time multiplayer cursors / CRDT sync
- Trash / soft-delete
- DOCX import
- Comments, version history, PDF export

## Automated test results

```text
npm run typecheck  → passed
npm run lint       → passed
npm run test       → 19 tests passed
npm run build      → passed
```

## Next with another 2–4 hours

1. Record/polish a 3–5 minute Loom/YouTube walkthrough if not already uploaded
2. Playwright E2E: create → share → viewer cannot edit
3. Soft-delete Trash with RLS
