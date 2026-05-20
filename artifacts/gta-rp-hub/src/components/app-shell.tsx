import React from "react";
import ServerList from "./server-list";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <ServerList />
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
