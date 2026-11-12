import type { SessionUser } from '@/lib/session-user';
import type { ReactNode } from 'react';
import { MobileBar } from './mobile-bar';
import { SidebarContent } from './sidebar-content';

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen p-3 lg:block">
        <div className="h-full overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
          <SidebarContent user={user} />
        </div>
      </aside>
      <div className="min-w-0">
        <MobileBar>
          <SidebarContent user={user} />
        </MobileBar>
        <main className="mx-auto w-full max-w-[96rem] px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
