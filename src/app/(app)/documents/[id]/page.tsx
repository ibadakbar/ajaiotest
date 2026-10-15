import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents/queries";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  let document;
  try {
    document = await getDocumentWithAccess(id, user.id);
  } catch {
    notFound();
  }

  if (!document) {
    notFound();
  }

  return <DocumentEditor document={document} />;
}
