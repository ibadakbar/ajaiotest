"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  canEdit,
  canShare,
  isValidSharePermission,
  validateTitle,
} from "@/lib/documents/permissions";
import { getDocumentWithAccess } from "@/lib/documents/queries";
import { EMPTY_DOC_CONTENT } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import type { SharePermission } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createDocument(
  title = "Untitled document",
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const titleError = validateTitle(title);
  if (titleError) {
    return { ok: false, error: titleError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      title: title.trim(),
      content: EMPTY_DOC_CONTENT,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create document." };
  }

  revalidatePath("/documents");
  return { ok: true, data: { id: data.id } };
}

export async function createDocumentFromImport(params: {
  title: string;
  content: JSONContent;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const titleError = validateTitle(params.title);
  if (titleError) {
    return { ok: false, error: titleError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      title: params.title.trim(),
      content: params.content,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to import document." };
  }

  revalidatePath("/documents");
  return { ok: true, data: { id: data.id } };
}

export async function updateDocumentContent(params: {
  documentId: string;
  content: JSONContent;
  title?: string;
  expectedUpdatedAt?: string;
}): Promise<ActionResult<{ updated_at: string }>> {
  const user = await requireUser();
  const doc = await getDocumentWithAccess(params.documentId, user.id);

  if (!doc) {
    return { ok: false, error: "Document not found or access denied." };
  }
  if (!canEdit(doc.role)) {
    return { ok: false, error: "You do not have permission to edit this document." };
  }

  if (params.title !== undefined) {
    const titleError = validateTitle(params.title);
    if (titleError) {
      return { ok: false, error: titleError };
    }
  }

  const supabase = await createClient();
  const payload: {
    content: JSONContent;
    updated_at: string;
    title?: string;
  } = {
    content: params.content,
    updated_at: new Date().toISOString(),
  };

  if (params.title !== undefined) {
    payload.title = params.title.trim();
  }

  // Optimistic lock: reject if another save already advanced updated_at.
  let query = supabase
    .from("documents")
    .update(payload)
    .eq("id", params.documentId);

  if (params.expectedUpdatedAt) {
    query = query.eq("updated_at", params.expectedUpdatedAt);
  }

  const { data, error } = await query.select("updated_at").maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return {
      ok: false,
      error: "Save conflict — a newer version exists. Retrying is safe.",
    };
  }

  revalidatePath(`/documents/${params.documentId}`);
  revalidatePath("/documents");
  return { ok: true, data: { updated_at: data.updated_at } };
}

export async function renameDocument(params: {
  documentId: string;
  title: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const titleError = validateTitle(params.title);
  if (titleError) {
    return { ok: false, error: titleError };
  }

  const doc = await getDocumentWithAccess(params.documentId, user.id);
  if (!doc) {
    return { ok: false, error: "Document not found or access denied." };
  }
  if (!canEdit(doc.role)) {
    return { ok: false, error: "You do not have permission to rename this document." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      title: params.title.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.documentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${params.documentId}`);
  return { ok: true, data: undefined };
}

export async function shareDocument(params: {
  documentId: string;
  email: string;
  permission: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const email = params.email.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!isValidSharePermission(params.permission)) {
    return { ok: false, error: "Permission must be viewer or editor." };
  }

  const doc = await getDocumentWithAccess(params.documentId, user.id);
  if (!doc) {
    return { ok: false, error: "Document not found or access denied." };
  }
  if (!canShare(doc.role)) {
    return { ok: false, error: "Only the owner can share this document." };
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }
  if (!profile) {
    return {
      ok: false,
      error: "No registered user found with that email.",
    };
  }
  if (profile.id === user.id) {
    return { ok: false, error: "You already own this document." };
  }

  const { error } = await supabase.from("document_shares").upsert(
    {
      document_id: params.documentId,
      shared_with: profile.id,
      permission: params.permission as SharePermission,
    },
    { onConflict: "document_id,shared_with" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/documents/${params.documentId}`);
  revalidatePath("/documents");
  return { ok: true, data: undefined };
}

export async function revokeShare(params: {
  documentId: string;
  shareId: string;
}): Promise<ActionResult> {
  const user = await requireUser();
  const doc = await getDocumentWithAccess(params.documentId, user.id);

  if (!doc) {
    return { ok: false, error: "Document not found or access denied." };
  }
  if (!canShare(doc.role)) {
    return { ok: false, error: "Only the owner can revoke access." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_shares")
    .delete()
    .eq("id", params.shareId)
    .eq("document_id", params.documentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/documents/${params.documentId}`);
  revalidatePath("/documents");
  return { ok: true, data: undefined };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
