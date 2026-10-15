import { describe, expect, it } from "vitest";
import {
  canEdit,
  canShare,
  canView,
  isValidSharePermission,
  resolveRole,
  validateTitle,
} from "@/lib/documents/permissions";

describe("validateTitle", () => {
  it("rejects empty titles", () => {
    expect(validateTitle("")).toBeTruthy();
    expect(validateTitle("   ")).toBeTruthy();
  });

  it("rejects titles over 200 characters", () => {
    expect(validateTitle("a".repeat(201))).toBeTruthy();
  });

  it("accepts valid titles", () => {
    expect(validateTitle("Meeting notes")).toBeNull();
  });
});

describe("permission helpers", () => {
  it("allows viewers to read but not edit or share", () => {
    expect(canView("viewer")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canShare("viewer")).toBe(false);
  });

  it("allows editors to edit but not share", () => {
    expect(canEdit("editor")).toBe(true);
    expect(canShare("editor")).toBe(false);
  });

  it("allows owners full control", () => {
    expect(canEdit("owner")).toBe(true);
    expect(canShare("owner")).toBe(true);
  });

  it("rejects null roles", () => {
    expect(canView(null)).toBe(false);
    expect(canEdit(null)).toBe(false);
    expect(canShare(null)).toBe(false);
  });
});

describe("resolveRole", () => {
  it("returns owner when user owns the document", () => {
    expect(
      resolveRole({
        userId: "u1",
        ownerId: "u1",
        sharePermission: null,
      }),
    ).toBe("owner");
  });

  it("returns share permission for collaborators", () => {
    expect(
      resolveRole({
        userId: "u2",
        ownerId: "u1",
        sharePermission: "editor",
      }),
    ).toBe("editor");
    expect(
      resolveRole({
        userId: "u2",
        ownerId: "u1",
        sharePermission: "viewer",
      }),
    ).toBe("viewer");
  });

  it("returns null for unrelated users", () => {
    expect(
      resolveRole({
        userId: "u3",
        ownerId: "u1",
        sharePermission: null,
      }),
    ).toBeNull();
  });
});

describe("isValidSharePermission", () => {
  it("accepts viewer and editor only", () => {
    expect(isValidSharePermission("viewer")).toBe(true);
    expect(isValidSharePermission("editor")).toBe(true);
    expect(isValidSharePermission("owner")).toBe(false);
    expect(isValidSharePermission("admin")).toBe(false);
  });
});
