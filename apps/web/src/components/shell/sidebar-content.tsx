import type { MeResponse } from '@dpdp-kit/shared';
import { Sidebar } from './sidebar/sidebar';
import { UserFooter } from './user-footer';

/** The whole sidebar. The desktop sidebar and the mobile drawer both show exactly this. */
export function SidebarContent({ user }: { user: MeResponse }) {
  return <Sidebar isAdmin={user.role === 'admin'} footer={<UserFooter user={user} />} />;
}
