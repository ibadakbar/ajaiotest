"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/Button";

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 text-xs ${active ? "bg-stone-200" : ""}`}
    >
      {label}
    </Button>
  );
}

export function Toolbar({ editor, disabled }: ToolbarProps) {
  if (!editor) return null;

  const off = disabled || !editor.isEditable;

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-3 py-2"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolButton
        label="Bold"
        active={editor.isActive("bold")}
        disabled={off}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolButton
        label="Italic"
        active={editor.isActive("italic")}
        disabled={off}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolButton
        label="Underline"
        active={editor.isActive("underline")}
        disabled={off}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      <ToolButton
        label="Paragraph"
        active={editor.isActive("paragraph")}
        disabled={off}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <ToolButton
        label="H1"
        active={editor.isActive("heading", { level: 1 })}
        disabled={off}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolButton
        label="H2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={off}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolButton
        label="H3"
        active={editor.isActive("heading", { level: 3 })}
        disabled={off}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      <ToolButton
        label="Bullets"
        active={editor.isActive("bulletList")}
        disabled={off}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolButton
        label="Numbers"
        active={editor.isActive("orderedList")}
        disabled={off}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
      <ToolButton
        label="Undo"
        disabled={off || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolButton
        label="Redo"
        disabled={off || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}
