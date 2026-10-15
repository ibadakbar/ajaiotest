"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeShare, shareDocument } from "@/lib/documents/mutations";
import type { DocumentWithAccess, SharePermission } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ShareDialogProps {
  document: DocumentWithAccess;
  onClose: () => void;
}

export function ShareDialog({ document, onClose }: ShareDialogProps) {
  const router = useRouter();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("viewer");
  const [pending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  function handleShare(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await shareDocument({
        documentId: document.id,
        email,
        permission,
      });
      if (!result.ok) {
        push(result.error, "error");
        return;
      }
      push(`Shared with ${email.trim()}`, "success");
      setEmail("");
      router.refresh();
    });
  }

  function handleRevoke(shareId: string) {
    setRevokingId(shareId);
    startTransition(async () => {
      const result = await revokeShare({
        documentId: document.id,
        shareId,
      });
      setRevokingId(null);
      if (!result.ok) {
        push(result.error, "error");
        return;
      }
      push("Access revoked", "success");
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="share-title" className="text-lg font-semibold">
              Share document
            </h2>
            <p className="mt-1 text-sm text-muted">
              Share with a registered Draftly user by email.
            </p>
          </div>
          <Button variant="ghost" aria-label="Close share dialog" onClick={onClose}>
            Close
          </Button>
        </div>

        <form onSubmit={handleShare} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="share-email">
            Collaborator email
          </label>
          <input
            id="share-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm"
          />
          <label className="sr-only" htmlFor="share-permission">
            Permission
          </label>
          <select
            id="share-permission"
            value={permission}
            onChange={(e) => setPermission(e.target.value as SharePermission)}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <Button type="submit" disabled={pending}>
            {pending ? "Sharing…" : "Share"}
          </Button>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-medium">People with access</h3>
          <ul className="mt-2 divide-y divide-border rounded-md border border-border">
            <li className="flex items-center justify-between px-3 py-2 text-sm">
              <div>
                <p className="font-medium">
                  {document.owner?.display_name ?? "Owner"}
                </p>
                <p className="text-xs text-muted">{document.owner?.email}</p>
              </div>
              <span className="text-xs text-muted">Owner</span>
            </li>
            {document.shares.map((share) => (
              <li
                key={share.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {share.profile?.display_name ?? "Collaborator"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {share.profile?.email ?? share.shared_with}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs capitalize text-muted">
                    {share.permission}
                  </span>
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    disabled={pending && revokingId === share.id}
                    onClick={() => handleRevoke(share.id)}
                    aria-label={`Revoke access for ${share.profile?.email ?? "collaborator"}`}
                  >
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
            {document.shares.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted">
                Not shared with anyone yet.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
