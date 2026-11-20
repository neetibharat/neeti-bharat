import type { SessionUser } from '@/lib/session-user';
import type { ReactNode } from 'react';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileBar } from './mobile-bar';
import { SidebarContent } from './sidebar-content';
import { GlobalSearch } from './search/global-search';
import { ShortcutsHelp } from './shortcuts-help';
import { UserMenu } from './user-menu';

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[auto_minmax(0,1fr)] print:block">
      <DesktopSidebar user={user} />
      <ShortcutsHelp />
      <div className="min-w-0">
        <MobileBar user={user}>
          <SidebarContent user={user} />
        </MobileBar>
        <div className="hidden h-14 items-center px-5 lg:flex print:hidden">
          <div className="flex flex-1 justify-center">
            <GlobalSearch variant="box" />
          </div>
          <UserMenu user={user} />
        </div>
        <main className="mx-auto w-full max-w-[96rem] px-5 py-8 lg:px-10 lg:pb-10 lg:pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
