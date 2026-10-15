"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/documents/mutations";
import type { DocumentListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ImportButton } from "@/components/documents/ImportButton";
import { RenameDialog } from "@/components/documents/RenameDialog";

function formatRelative(dateIso: string): string {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

interface DocumentListProps {
  documents: DocumentListItem[];
  view: "owned" | "shared";
  initialSearch?: string;
  errorMessage?: string | null;
}

export function DocumentList({
  documents,
  view,
  initialSearch = "",
  errorMessage,
}: DocumentListProps) {
  const router = useRouter();
  const { push } = useToast();
  const [search, setSearch] = useState(initialSearch);
  const [creating, startCreate] = useTransition();
  const [renameTarget, setRenameTarget] = useState<DocumentListItem | null>(
    null,
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(term));
  }, [documents, search]);

  function handleCreate() {
    startCreate(async () => {
      const result = await createDocument("Untitled document");
      if (!result.ok) {
        push(result.error, "error");
        return;
      }
      push("Document created", "success");
      router.push(`/documents/${result.data.id}`);
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {view === "owned" ? "My Documents" : "Shared with Me"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {view === "owned"
              ? "Create, import, and manage documents you own."
              : "Documents others have shared with you."}
          </p>
        </div>
        {view === "owned" ? (
          <div className="flex flex-wrap gap-2">
            <ImportButton />
            <Button onClick={handleCreate} disabled={creating} aria-busy={creating}>
              {creating ? "Creating…" : "New Document"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <label className="sr-only" htmlFor="doc-search">
          Search documents
        </label>
        <input
          id="doc-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm"
        />
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorMessage}
        </div>
      ) : null}

      {!errorMessage && filtered.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium">No documents found</p>
          <p className="mt-1 text-sm text-muted">
            {search.trim()
              ? "Try a different search term."
              : view === "owned"
                ? "Create a document or import a .txt / .md file to get started."
                : "When someone shares a document with you, it will appear here."}
          </p>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {filtered.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
              <Link
                href={`/documents/${doc.id}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate font-medium">{doc.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {view === "shared" && doc.owner_name
                    ? `Owner: ${doc.owner_name} · `
                    : null}
                  Updated {formatRelative(doc.updated_at)}
                  {" · "}
                  {doc.sharing_status === "shared" ? "Shared" : "Private"}
                  {view === "shared" ? ` · ${doc.permission}` : null}
                </p>
              </Link>
              {view === "owned" || doc.permission === "editor" ? (
                <Button
                  variant="ghost"
                  className="shrink-0 text-xs"
                  onClick={() => setRenameTarget(doc)}
                  aria-label={`Rename ${doc.title}`}
                >
                  Rename
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {renameTarget ? (
        <RenameDialog
          document={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={() => {
            setRenameTarget(null);
            push("Document renamed", "success");
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
