export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveStatus({ state }: { state: SaveState }) {
  const label =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Saved"
        : state === "error"
          ? "Save failed"
          : "All changes saved";

  const className =
    state === "error"
      ? "text-danger"
      : state === "saving"
        ? "text-amber-700"
        : "text-muted";

  return (
    <span className={`text-xs font-medium ${className}`} role="status" aria-live="polite">
      {label}
    </span>
  );
}
