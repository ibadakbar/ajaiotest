import type { JSONContent } from "@tiptap/react";
import { EMPTY_DOC_CONTENT } from "@/lib/types";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md"] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export interface ImportValidationError {
  ok: false;
  error: string;
}

export interface ImportValidationSuccess {
  ok: true;
  extension: SupportedExtension;
  title: string;
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) return "";
  return filename.slice(idx).toLowerCase();
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  if (!base) return "Imported document";
  return base.slice(0, 200);
}

export function validateImportFile(params: {
  filename: string;
  size: number;
}): ImportValidationSuccess | ImportValidationError {
  if (!params.filename.trim()) {
    return { ok: false, error: "Missing filename." };
  }

  const extension = getFileExtension(params.filename);
  if (extension !== ".txt" && extension !== ".md") {
    return {
      ok: false,
      error: "Unsupported file type. Only .txt and .md files are allowed.",
    };
  }

  if (params.size <= 0) {
    return { ok: false, error: "File is empty." };
  }

  if (params.size > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      error: "File is too large. Maximum size is 2 MB.",
    };
  }

  return {
    ok: true,
    extension,
    title: titleFromFilename(params.filename),
  };
}

function textNode(text: string, marks?: JSONContent["marks"]): JSONContent {
  const node: JSONContent = { type: "text", text };
  if (marks && marks.length > 0) {
    node.marks = marks;
  }
  return node;
}

function paragraphFromPlain(line: string): JSONContent {
  if (!line) {
    return { type: "paragraph" };
  }
  return {
    type: "paragraph",
    content: [textNode(line)],
  };
}

/** Parse inline **bold** and *italic* (non-nested, best-effort). */
export function parseInlineMarks(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(textNode(text.slice(lastIndex, match.index)));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(textNode(token.slice(2, -2), [{ type: "bold" }]));
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(textNode(token.slice(1, -1), [{ type: "italic" }]));
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(textNode(text.slice(lastIndex)));
  }

  return nodes.length > 0 ? nodes : [textNode(text)];
}

export function txtToTiptap(content: string): JSONContent {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return EMPTY_DOC_CONTENT;
  }

  const lines = normalized.split("\n");
  return {
    type: "doc",
    content: lines.map((line) => paragraphFromPlain(line)),
  };
}

/**
 * Markdown subset → Tiptap JSON.
 * Supports: #–### headings, -/* bullet lists, 1. ordered lists,
 * paragraphs, **bold**, *italic*. Does not support HTML, tables, or code fences.
 */
export function mdToTiptap(content: string): JSONContent {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return EMPTY_DOC_CONTENT;
  }

  const lines = normalized.split("\n");
  const nodes: JSONContent[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      nodes.push({
        type: "heading",
        attrs: { level },
        content: text ? parseInlineMarks(text) : undefined,
      });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: JSONContent[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*]\s+/, "");
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: itemText ? parseInlineMarks(itemText) : undefined,
            },
          ],
        });
        i += 1;
      }
      nodes.push({ type: "bulletList", content: items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: JSONContent[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, "");
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: itemText ? parseInlineMarks(itemText) : undefined,
            },
          ],
        });
        i += 1;
      }
      nodes.push({ type: "orderedList", content: items });
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    nodes.push({
      type: "paragraph",
      content: parseInlineMarks(line),
    });
    i += 1;
  }

  return {
    type: "doc",
    content: nodes.length > 0 ? nodes : [{ type: "paragraph" }],
  };
}

export function fileContentToTiptap(
  extension: SupportedExtension,
  content: string,
): JSONContent {
  if (content.length > MAX_IMPORT_BYTES) {
    throw new Error("File content exceeds the maximum allowed size.");
  }

  if (extension === ".md") {
    return mdToTiptap(content);
  }
  return txtToTiptap(content);
}
