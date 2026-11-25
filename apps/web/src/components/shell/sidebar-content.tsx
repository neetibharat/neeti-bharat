import type { SessionUser } from '@/lib/session-user';
import { OrganizationHeader } from './organization-header';
import { Sidebar } from './sidebar/sidebar';

/** The whole sidebar. The desktop sidebar and the mobile drawer both show exactly this. */
export interface SidebarContentProps {
  user: SessionUser;
  /** Folded down to the icons. Only the desktop sidebar does this. */
  collapsed?: boolean;
  /** Asked for when an icon is pressed while folded, so the pages of its area can show. */
  onExpand?: () => void;
}

export function SidebarContent({ user, collapsed, onExpand }: SidebarContentProps) {
  return (
    <Sidebar
      isAdmin={user.role === 'admin'}
      collapsed={collapsed}
      onExpand={onExpand}
      header={
        <OrganizationHeader organizations={user.organizations} activeId={user.organization.id} />
      }
    />
  );
}
