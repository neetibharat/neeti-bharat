import { HttpStatus, Injectable } from '@nestjs/common';
import type { AppRole } from '@dpdp-kit/shared';
import { AppException } from '../../core/common/app.exception';
import { ApiKeyRepository, type KeyForSignIn } from '../repositories/api-key.repository';
import { hashKey } from '../utils/key-secret';

/** A key's use is noted at most this often, so a busy script does not write to the table on every call. */
const USE_NOTED_EVERY_MS = 60_000;

/** Who a key acts as, and where. */
export interface KeyAccess {
  user: { id: string; name: string; email: string };
  organizationId: string;
  role: AppRole;
}

const RANK: Record<AppRole, number> = { auditor: 0, member: 1, admin: 2 };

/** A key never gives more than its own role, nor more than its creator has now. */
const lesser = (a: AppRole, b: AppRole): AppRole => (RANK[a] <= RANK[b] ? a : b);

/** A key works until it is revoked or runs out, and only while its creator is still a member of the organisation. */
function stillWorks(
  found: KeyForSignIn | null,
  now: Date,
): found is KeyForSignIn & { creatorRole: AppRole } {
  if (!found || found.revokedAt || found.creatorRole === null) return false;
  return !found.expiresAt || found.expiresAt > now;
}

/**
 * Signs a request in from the key it carries. The key acts as the person who made it, in the organisation it was made
 * in, so the activity log names them. It stops working when it is revoked, when it runs out, or when its creator is no
 * longer a member there.
 */
@Injectable()
export class ApiKeyAdmission {
  constructor(private readonly keys: ApiKeyRepository) {}

  async admit(key: string, now = new Date()): Promise<KeyAccess> {
    const found = await this.keys.findForSignIn(hashKey(key));
    if (!stillWorks(found, now)) throw new AppException('UNAUTHENTICATED', HttpStatus.UNAUTHORIZED);
    const last = found.lastUsedAt?.getTime();
    if (last === undefined || now.getTime() - last > USE_NOTED_EVERY_MS) {
      await this.keys.markUsed(found.id, now);
    }
    return {
      user: found.createdBy,
      organizationId: found.organizationId,
      role: lesser(found.role, found.creatorRole),
    };
  }
}
