import { requireUser } from "@/lib/auth";
import {
  listOwnedDocuments,
  listSharedDocuments,
} from "@/lib/documents/queries";
import { DocumentList } from "@/components/documents/DocumentList";

interface PageProps {
  searchParams: Promise<{ view?: string; q?: string }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const view = params.view === "shared" ? "shared" : "owned";
  const search = params.q ?? "";

  let documents: Awaited<ReturnType<typeof listOwnedDocuments>> = [];
  let errorMessage: string | null = null;

  try {
    documents =
      view === "shared"
        ? await listSharedDocuments(user.id, search)
        : await listOwnedDocuments(user.id, search);
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to load documents. Check your database configuration.";
  }

  return (
    <DocumentList
      documents={documents}
      view={view}
      initialSearch={search}
      errorMessage={errorMessage}
    />
  );
}
