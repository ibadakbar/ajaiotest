# Architecture

## Application architecture

Draftly is a Next.js App Router application with a clear split between:

- **Server Components / server actions** for authenticated data access and mutations
- **Client components** for interactive UI (editor, dialogs, toasts, import picker)
- **Supabase** for Auth sessions, Postgres storage, and Row Level Security

```
Browser
  └─ Next.js App Router
       ├─ Middleware (session refresh + auth redirects)
       ├─ Server Components (document lists, document load)
       ├─ Server Actions (create/rename/save/share/import/sign-out)
       └─ Client Components (Tiptap editor, share dialog, import)
            └─ Supabase browser client (sign-in only)
```

Privileged database work uses the authenticated user’s JWT through the server Supabase client. The service role key is used only by the optional seed script, never in browser bundles.

## Database schema and relationships

- `profiles` — 1:1 with `auth.users`; stores display name and email for sharing lookups
- `documents` — owned by a profile; `content` is Tiptap JSON (`jsonb`)
- `document_shares` — unique `(document_id, shared_with)` with `viewer` | `editor`

Foreign keys cascade on delete so orphaned shares cannot linger after a document or user is removed.

## Authentication and authorization

1. User signs in with email/password via Supabase Auth.
2. Middleware refreshes the session cookie and redirects unauthenticated users to `/login`.
3. Server code calls `supabase.auth.getUser()` — never trusts a client-supplied user id.
4. Application helpers (`canView` / `canEdit` / `canShare`) gate mutations.
5. RLS policies enforce the same rules at the database layer as defense in depth.

Role matrix:

| Action | Owner | Editor | Viewer | Unrelated |
| --- | --- | --- | --- | --- |
| Read | yes | yes | yes | no |
| Edit content / title | yes | yes | no | no |
| Share / revoke | yes | no | no | no |
| Delete document | yes | no | no | no |

Demo account buttons on the login page only fill credentials; they do not impersonate users client-side.

## Document persistence and autosave

- Editor state is Tiptap JSON, stored in `documents.content`.
- Client debounces saves (~800ms) after edits.
- A monotonic save generation token ignores stale responses when updating UI status.
- Concurrent edits during an in-flight save set a resave flag so the latest content is flushed afterward.
- Optimistic locking compares `updated_at`; conflicts trigger a safe retry of the latest local content.
- `beforeunload` warns when unsaved changes remain.

## File import design

- Accepts `.txt` and `.md` only, max 2 MB.
- Validates extension and size before reading.
- Converts text into Tiptap JSON nodes — never injects raw HTML into the DOM.
- Markdown subset: ATX headings (H1–H3), bullet/ordered lists, paragraphs, `**bold**`, `*italic*`.

## Important technical trade-offs

- **Supabase over a custom auth stack** — faster path to verified sessions + RLS for a timeboxed assessment.
- **Server Actions over REST routes** — colocated mutations with less boilerplate for CRUD/share/import.
- **No Yjs / websockets** — out of scope; persistence and permissions were prioritized.
- **Minimal Tiptap extensions** — reduces surface area and keeps save/reopen behavior predictable.

## Deliberately excluded features

- Real-time collaborative cursors
- Comments / suggestions
- Version history
- Trash / soft delete
- DOCX / PDF import or export
- OAuth providers beyond email/password
