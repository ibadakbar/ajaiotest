"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import type { JSONContent } from "@tiptap/react";
import { updateDocumentContent } from "@/lib/documents/mutations";
import { canEdit, canShare } from "@/lib/documents/permissions";
import { createSaveGeneration } from "@/lib/documents/autosave";
import type { DocumentWithAccess } from "@/lib/types";
import { Toolbar } from "@/components/editor/Toolbar";
import { SaveStatus, type SaveState } from "@/components/editor/SaveStatus";
import { ShareDialog } from "@/components/sharing/ShareDialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const AUTOSAVE_MS = 800;

interface DocumentEditorProps {
  document: DocumentWithAccess;
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const { push } = useToast();
  const editable = canEdit(document.role);
  const [title, setTitle] = useState(document.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [, setDirty] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef<JSONContent>(document.content);
  const updatedAtRef = useRef(document.updated_at);
  const dirtyRef = useRef(false);
  const needsResaveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(createSaveGeneration());
  const savingRef = useRef(false);
  const persistRef = useRef<() => Promise<void>>(async () => undefined);

  titleRef.current = title;

  const persist = useCallback(async () => {
    if (!editable) return;
    if (savingRef.current) {
      needsResaveRef.current = true;
      return;
    }

    const gen = generation.current.next();
    savingRef.current = true;
    needsResaveRef.current = false;
    setSaveState("saving");

    const result = await updateDocumentContent({
      documentId: document.id,
      content: contentRef.current,
      title: titleRef.current,
      expectedUpdatedAt: updatedAtRef.current,
    });

    savingRef.current = false;

    if (!generation.current.isCurrent(gen)) {
      return;
    }

    if (!result.ok) {
      if (result.error.toLowerCase().includes("conflict")) {
        const retry = await updateDocumentContent({
          documentId: document.id,
          content: contentRef.current,
          title: titleRef.current,
        });
        if (!generation.current.isCurrent(gen)) return;
        if (retry.ok) {
          updatedAtRef.current = retry.data.updated_at;
          if (needsResaveRef.current) {
            needsResaveRef.current = false;
            dirtyRef.current = true;
            setDirty(true);
            setSaveState("saving");
            void persistRef.current();
            return;
          }
          dirtyRef.current = false;
          setDirty(false);
          setSaveState("saved");
          return;
        }
      }
      setSaveState("error");
      push(result.error, "error");
      return;
    }

    updatedAtRef.current = result.data.updated_at;

    if (needsResaveRef.current) {
      needsResaveRef.current = false;
      dirtyRef.current = true;
      setDirty(true);
      void persistRef.current();
      return;
    }

    dirtyRef.current = false;
    setDirty(false);
    setSaveState("saved");
  }, [document.id, editable, push]);

  persistRef.current = persist;

  const scheduleSave = useCallback(() => {
    if (!editable) return;
    dirtyRef.current = true;
    setDirty(true);
    if (savingRef.current) {
      needsResaveRef.current = true;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void persistRef.current();
    }, AUTOSAVE_MS);
  }, [editable]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: document.content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "px-8 py-10 sm:px-12",
        "aria-label": "Document content",
      },
    },
    onUpdate: ({ editor: ed }) => {
      contentRef.current = ed.getJSON();
      scheduleSave();
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (editable) {
      scheduleSave();
    }
  }

  async function handleManualRetry() {
    if (timerRef.current) clearTimeout(timerRef.current);
    await persist();
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Link
          href="/documents"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Workspace
        </Link>
        <div className="min-w-0 flex-1">
          <label htmlFor="doc-title" className="sr-only">
            Document title
          </label>
          <input
            id="doc-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            disabled={!editable}
            className="w-full truncate border-0 bg-transparent text-lg font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-70"
            maxLength={200}
          />
        </div>
        <SaveStatus state={saveState} />
        {saveState === "error" ? (
          <Button variant="secondary" className="text-xs" onClick={handleManualRetry}>
            Retry save
          </Button>
        ) : null}
        {!editable ? (
          <span className="rounded-md bg-stone-100 px-2 py-1 text-xs text-muted">
            View only
          </span>
        ) : null}
        {canShare(document.role) ? (
          <Button variant="secondary" onClick={() => setShareOpen(true)}>
            Share
          </Button>
        ) : null}
      </div>

      <Toolbar editor={editor} disabled={!editable} />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto my-6 max-w-3xl rounded-md border border-border bg-surface shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>

      {shareOpen ? (
        <ShareDialog document={document} onClose={() => setShareOpen(false)} />
      ) : null}
    </div>
  );
}
