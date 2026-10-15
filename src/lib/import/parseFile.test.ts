import { describe, expect, it } from "vitest";
import {
  fileContentToTiptap,
  mdToTiptap,
  txtToTiptap,
  validateImportFile,
} from "@/lib/import/parseFile";

describe("validateImportFile", () => {
  it("rejects unsupported extensions", () => {
    const result = validateImportFile({
      filename: "notes.docx",
      size: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported/i);
    }
  });

  it("rejects empty and oversized files", () => {
    expect(validateImportFile({ filename: "a.txt", size: 0 }).ok).toBe(false);
    expect(
      validateImportFile({ filename: "a.txt", size: 3 * 1024 * 1024 }).ok,
    ).toBe(false);
  });

  it("accepts txt and md with a title from the filename", () => {
    const txt = validateImportFile({ filename: "Meeting Notes.txt", size: 12 });
    expect(txt.ok).toBe(true);
    if (txt.ok) {
      expect(txt.extension).toBe(".txt");
      expect(txt.title).toBe("Meeting Notes");
    }

    const md = validateImportFile({ filename: "readme.md", size: 40 });
    expect(md.ok).toBe(true);
    if (md.ok) {
      expect(md.extension).toBe(".md");
    }
  });
});

describe("txtToTiptap", () => {
  it("stores plain text as paragraph nodes without HTML injection", () => {
    const doc = txtToTiptap("Hello\n<script>alert(1)</script>");
    expect(doc.type).toBe("doc");
    expect(doc.content?.[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "Hello" }],
    });
    expect(JSON.stringify(doc)).toContain("<script>alert(1)</script>");
    expect(JSON.stringify(doc)).not.toMatch(/"type":"hardBreak"/);
  });
});

describe("mdToTiptap", () => {
  it("parses headings, lists, and emphasis", () => {
    const doc = mdToTiptap(
      "# Title\n\nParagraph with **bold** and *italic*\n\n- one\n- two\n\n1. first\n2. second\n",
    );
    expect(doc.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
    });
    expect(doc.content?.some((n) => n.type === "bulletList")).toBe(true);
    expect(doc.content?.some((n) => n.type === "orderedList")).toBe(true);
    const paragraph = doc.content?.find((n) => n.type === "paragraph");
    expect(paragraph?.content?.some((c) => c.marks?.[0]?.type === "bold")).toBe(
      true,
    );
  });
});

describe("fileContentToTiptap", () => {
  it("routes by extension", () => {
    const txt = fileContentToTiptap(".txt", "plain");
    expect(txt.content?.[0]?.type).toBe("paragraph");
    const md = fileContentToTiptap(".md", "## Heading");
    expect(md.content?.[0]?.type).toBe("heading");
  });
});
