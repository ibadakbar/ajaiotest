"use client";

import { useState, useTransition } from "react";
import { renameDocument } from "@/lib/documents/mutations";
import type { DocumentListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface RenameDialogProps {
  document: DocumentListItem;
  onClose: () => void;
  onRenamed: () => void;
}

export function RenameDialog({
  document,
  onClose,
  onRenamed,
}: RenameDialogProps) {
  const { push } = useToast();
  const [title, setTitle] = useState(document.title);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await renameDocument({
        documentId: document.id,
        title,
      });
      if (!result.ok) {
        push(result.error, "error");
        return;
      }
      onRenamed();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-lg"
      >
        <h2 id="rename-title" className="text-lg font-semibold">
          Rename document
        </h2>
        <label htmlFor="rename-input" className="mt-4 block text-sm font-medium">
          Title
        </label>
        <input
          id="rename-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          maxLength={200}
          autoFocus
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
