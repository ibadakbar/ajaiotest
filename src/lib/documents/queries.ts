import { createClient } from "@/lib/supabase/server";
import { resolveRole } from "@/lib/documents/permissions";
import type {
  DocumentAccessRole,
  DocumentListItem,
  DocumentWithAccess,
  Profile,
  SharePermission,
} from "@/lib/types";

export async function listOwnedDocuments(
  userId: string,
  search?: string,
): Promise<DocumentListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("id, title, updated_at, owner_id")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (search?.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const docs = data ?? [];
  if (docs.length === 0) return [];

  const ids = docs.map((d) => d.id);
  const { data: shares } = await supabase
    .from("document_shares")
    .select("document_id")
    .in("document_id", ids);

  const sharedIds = new Set((shares ?? []).map((s) => s.document_id));

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", userId)
    .maybeSingle();

  return docs.map((row) => ({
    id: row.id,
    title: row.title,
    updated_at: row.updated_at,
    owner_id: row.owner_id,
    owner_name: ownerProfile?.display_name ?? null,
    owner_email: ownerProfile?.email ?? null,
    sharing_status: sharedIds.has(row.id) ? "shared" : "private",
    permission: "owner" as DocumentAccessRole,
  }));
}

export async function listSharedDocuments(
  userId: string,
  search?: string,
): Promise<DocumentListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_shares")
    .select("permission, document_id")
    .eq("shared_with", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const shareRows = data ?? [];
  if (shareRows.length === 0) return [];

  const documentIds = shareRows.map((s) => s.document_id);
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, title, updated_at, owner_id")
    .in("id", documentIds);

  if (docsError) {
    throw new Error(docsError.message);
  }

  const ownerIds = [...new Set((docs ?? []).map((d) => d.owner_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", ownerIds);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));
  const docById = new Map((docs ?? []).map((d) => [d.id, d]));
  const permissionByDoc = new Map(
    shareRows.map((s) => [s.document_id, s.permission as DocumentAccessRole]),
  );

  const items: DocumentListItem[] = [];
  for (const id of documentIds) {
    const doc = docById.get(id);
    if (!doc) continue;
    const owner = ownerById.get(doc.owner_id);
    items.push({
      id: doc.id,
      title: doc.title,
      updated_at: doc.updated_at,
      owner_id: doc.owner_id,
      owner_name: owner?.display_name ?? null,
      owner_email: owner?.email ?? null,
      sharing_status: "shared",
      permission: permissionByDoc.get(id) ?? "viewer",
    });
  }

  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(term));
  }

  return items;
}

export async function getDocumentWithAccess(
  documentId: string,
  userId: string,
): Promise<DocumentWithAccess | null> {
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, owner_id, title, content, created_at, updated_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!doc) {
    return null;
  }

  const { data: share } = await supabase
    .from("document_shares")
    .select("permission")
    .eq("document_id", documentId)
    .eq("shared_with", userId)
    .maybeSingle();

  const role = resolveRole({
    userId,
    ownerId: doc.owner_id,
    sharePermission: (share?.permission as SharePermission | undefined) ?? null,
  });

  if (!role) {
    return null;
  }

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .eq("id", doc.owner_id)
    .maybeSingle();

  const { data: shares } = await supabase
    .from("document_shares")
    .select("id, document_id, shared_with, permission, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  const shareRows = shares ?? [];
  const collaboratorIds = shareRows.map((s) => s.shared_with);
  let profilesById = new Map<string, Profile>();

  if (collaboratorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", collaboratorIds);
    profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  return {
    id: doc.id,
    owner_id: doc.owner_id,
    title: doc.title,
    content: doc.content,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    role,
    owner: owner ?? null,
    shares: shareRows.map((s) => ({
      id: s.id,
      document_id: s.document_id,
      shared_with: s.shared_with,
      permission: s.permission as SharePermission,
      created_at: s.created_at,
      profile: profilesById.get(s.shared_with) ?? null,
    })),
  };
}
