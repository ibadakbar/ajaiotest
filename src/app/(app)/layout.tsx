import { Suspense } from "react";
import { requireUser, getCurrentProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <AppShell profile={profile}>{children}</AppShell>
    </Suspense>
  );
}
