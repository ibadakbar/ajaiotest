import type { DocumentAccessRole, SharePermission } from "@/lib/types";

export function canView(role: DocumentAccessRole | null): boolean {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canEdit(role: DocumentAccessRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canShare(role: DocumentAccessRole | null): boolean {
  return role === "owner";
}

export function canRename(role: DocumentAccessRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function isValidSharePermission(
  value: string,
): value is SharePermission {
  return value === "viewer" || value === "editor";
}

export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return "Title is required.";
  }
  if (trimmed.length > 200) {
    return "Title must be 200 characters or fewer.";
  }
  return null;
}

export function resolveRole(params: {
  userId: string;
  ownerId: string;
  sharePermission: SharePermission | null;
}): DocumentAccessRole | null {
  if (params.userId === params.ownerId) {
    return "owner";
  }
  if (params.sharePermission === "editor") {
    return "editor";
  }
  if (params.sharePermission === "viewer") {
    return "viewer";
  }
  return null;
}
