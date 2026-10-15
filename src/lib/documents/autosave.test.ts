import { describe, expect, it } from "vitest";
import {
  createSaveGeneration,
  shouldApplySaveResult,
} from "@/lib/documents/autosave";

describe("save generation guard", () => {
  it("only treats the latest generation as current", () => {
    const gen = createSaveGeneration();
    const first = gen.next();
    const second = gen.next();

    expect(gen.isCurrent(first)).toBe(false);
    expect(gen.isCurrent(second)).toBe(true);
    expect(shouldApplySaveResult(first, second)).toBe(false);
    expect(shouldApplySaveResult(second, second)).toBe(true);
  });

  it("prevents stale async save responses from winning", () => {
    const gen = createSaveGeneration();
    const stale = gen.next();
    const latest = gen.next();

    // Simulate stale response arriving after a newer save started.
    expect(gen.isCurrent(stale)).toBe(false);
    expect(gen.isCurrent(latest)).toBe(true);
  });
});
