import type { JSONContent } from "@tiptap/react";

export type SharePermission = "viewer" | "editor";

export type DocumentAccessRole = "owner" | "editor" | "viewer";

export interface Profile {
  id: string;
  display_name: string;
  email: string;
}

export interface DocumentRow {
  id: string;
  owner_id: string;
  title: string;
  content: JSONContent;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_with: string;
  permission: SharePermission;
  created_at: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  updated_at: string;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  sharing_status: "private" | "shared";
  permission: DocumentAccessRole;
}

export interface DocumentWithAccess extends DocumentRow {
  role: DocumentAccessRole;
  owner: Profile | null;
  shares: Array<DocumentShare & { profile: Profile | null }>;
}

export const EMPTY_DOC_CONTENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
