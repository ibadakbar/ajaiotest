import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Document not found</h1>
      <p className="mt-2 text-sm text-muted">
        This document does not exist, or you do not have permission to view it.
      </p>
      <Link
        href="/documents"
        className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-hover"
      >
        Back to workspace
      </Link>
    </div>
  );
}
