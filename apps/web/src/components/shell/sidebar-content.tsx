import type { SessionUser } from '@/lib/session-user';
import { OrganizationHeader } from './organization-header';
import { Sidebar } from './sidebar/sidebar';
import { UserFooter } from './user-footer';

/** The whole sidebar. The desktop sidebar and the mobile drawer both show exactly this. */
export function SidebarContent({ user }: { user: SessionUser }) {
  return (
    <Sidebar
      isAdmin={user.role === 'admin'}
      header={
        <OrganizationHeader organizations={user.organizations} activeId={user.organization.id} />
      }
      footer={<UserFooter user={user} />}
    />
  );
}
