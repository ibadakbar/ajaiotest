"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar profile={profile} open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
            <Button
              variant="ghost"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
              className="px-2"
            >
              Menu
            </Button>
            <span className="font-semibold">Draftly</span>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
