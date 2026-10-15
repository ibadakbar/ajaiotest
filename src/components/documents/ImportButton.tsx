"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocumentFromImport } from "@/lib/documents/mutations";
import {
  fileContentToTiptap,
  validateImportFile,
  type SupportedExtension,
} from "@/lib/import/parseFile";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validation = validateImportFile({
      filename: file.name,
      size: file.size,
    });

    if (!validation.ok) {
      push(validation.error, "error");
      return;
    }

    startTransition(async () => {
      try {
        const text = await file.text();
        const content = fileContentToTiptap(
          validation.extension as SupportedExtension,
          text,
        );
        const result = await createDocumentFromImport({
          title: validation.title,
          content,
        });
        if (!result.ok) {
          push(result.error, "error");
          return;
        }
        push("File imported successfully", "success");
        router.push(`/documents/${result.data.id}`);
      } catch {
        push("Failed to read or import the file.", "error");
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
      />
      <Button
        variant="secondary"
        onClick={handlePick}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Importing…" : "Import File"}
      </Button>
    </>
  );
}
