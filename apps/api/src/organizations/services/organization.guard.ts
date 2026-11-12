import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORGANIZATION_HEADER } from '@dpdp-kit/shared';
import { AppException } from '../../core/common/app.exception';
import { setOrganization } from '../../core/org/org-context';
import { NO_ORGANIZATION_KEY, ROLES_KEY } from '../../core/org/roles.decorator';
import { MembershipRepository, type OpenMembership } from '../repositories/membership.repository';

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  session?: { user?: { id: string } } | null;
}

/** Refuses a role the route does not allow. A route with no list is open to every role. */
function assertRoleAllowed(
  allowed: readonly string[] | undefined,
  membership: OpenMembership,
): void {
  if (allowed?.length && !allowed.includes(membership.role)) {
    throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
  }
}

/** The organisation a request names in its header, if it names one. */
function namedBy(request: RequestLike): string | undefined {
  const header = request.headers[ORGANIZATION_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  return value?.trim() || undefined;
}

/** Picks the membership a request works under: the one it names, or the only one the person has. */
function choose(open: OpenMembership[], named: string | undefined): OpenMembership {
  if (named) {
    const found = open.find((membership) => membership.organizationId === named);
    if (!found) throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    return found;
  }
  if (open.length === 1) return open[0]!;
  throw new AppException('ORGANIZATION_REQUIRED', HttpStatus.BAD_REQUEST);
}

/**
 * Runs after sign-in is checked. It works out which organisation the request is for, refuses anyone who is not a
 * member of it or whose role there is not allowed, and tells the rest of the request which organisation it is in.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly memberships: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(NO_ORGANIZATION_KEY, targets)) return true;
    const request = context.switchToHttp().getRequest<RequestLike>();
    // RequestAccessGuard runs the sign-in check first. If this is ever reached without it, refusing is safer than
    // treating everyone as signed out.
    if (request.session === undefined) {
      throw new Error('The organisation guard ran before the sign-in guard');
    }
    const user = request.session?.user;
    // Nobody signed in: the sign-in guard already let this route through as a public one.
    if (!user) return true;

    const membership = choose(await this.memberships.findOpen(user.id), namedBy(request));
    assertRoleAllowed(
      this.reflector.getAllAndOverride<readonly string[] | undefined>(ROLES_KEY, targets),
      membership,
    );
    setOrganization(membership.organizationId, membership.role);
    return true;
  }
}
