# Draftly — Ajaia Full Stack Product Engineer Submission

**Candidate:** Ibad Akbar (ibad_2000@hotmail.com)

## Live product URL
https://ajaiotest-vglk.vercel.app/

## Source code
https://github.com/ibadakbar/ajaiotest

## Google Drive folder (deliverables / walkthrough package)
https://drive.google.com/drive/folders/1CWQFoTpNSQnE5nGdAb1VBiaSOW3gz51h?usp=sharing

## Walkthrough video URL
https://drive.google.com/file/d/1Bk0dfXibLZ2nOwq2gsXpSDrxZ4I4aRKz/view?usp=sharing


## Demo credentials
- alice@draftly.demo / DemoPass123! (owner)
- bob@draftly.demo / DemoPass123! (editor)
- carol@draftly.demo / DemoPass123! (viewer)

## Local run
1. npm install
2. Copy .env.example → .env.local (Supabase URL + anon key; service role for seed)
3. Run supabase/migrations/001_init.sql in Supabase SQL editor
4. npm run seed
5. npm run dev

## What works
- Document create / rename / rich-text edit / debounced autosave / reopen after refresh
- Formatting: bold, italic, underline, headings, lists, undo/redo (Tiptap JSON)
- File import: .txt and .md → new editable document (DOCX not supported; stated in README)
- Sharing: owner shares by email as viewer or editor; revoke; Owned vs Shared with Me
- Persistence: Supabase Postgres + RLS; auth via verified server session
- Deployed on Vercel; Vitest coverage for permissions, import, autosave guards

## What I intentionally deprioritized
- Real-time collaboration cursors
- Trash / version history / comments
- DOCX import / PDF export

## Why these cuts
Core editing, secure sharing, persistence, and a shippable deployment matter more for a 4–6 hour assessment than rebuilding Google Docs real-time features.

## AI workflow (summary)
Used Cursor Agent for scaffolding, RLS SQL, editor/autosave patterns, tests, and docs. Rejected client-side user impersonation, localStorage-as-DB, and raw HTML import. Verified with typecheck, lint, 19 unit tests, production build, and live multi-user checks on Vercel. Full note: AI_WORKFLOW.md in the repo.

## Next with 2–4 more hours
Playwright E2E for share permissions, soft-delete Trash, and polish the walkthrough video narration.
