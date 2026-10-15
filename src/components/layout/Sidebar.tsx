"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "@/lib/documents/mutations";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface SidebarProps {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const ownedActive =
    pathname === "/documents" && view !== "shared";
  const sharedActive =
    pathname === "/documents" && view === "shared";

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-fg transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/documents" className="text-xl font-semibold tracking-tight">
            Draftly
          </Link>
          <p className="mt-1 text-xs text-sidebar-muted">Collaborative documents</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Workspace">
          <Link
            href="/documents"
            onClick={onClose}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              ownedActive
                ? "bg-white/10 text-white"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            My Documents
          </Link>
          <Link
            href="/documents?view=shared"
            onClick={onClose}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              sharedActive
                ? "bg-white/10 text-white"
                : "text-sidebar-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            Shared with Me
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">
            {profile?.display_name ?? "Signed in"}
          </p>
          <p className="truncate text-xs text-sidebar-muted">
            {profile?.email ?? ""}
          </p>
          <form action={signOut} className="mt-3">
            <Button
              type="submit"
              variant="secondary"
              className="w-full border-white/20 bg-transparent text-sidebar-fg hover:bg-white/10"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
