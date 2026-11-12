import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORGANIZATION_HEADER } from '@dpdp-kit/shared';
import { AppException } from '../../core/common/app.exception';
import { setOrganization } from '../../core/org/org-context';
import { NO_API_KEY_KEY, NO_ORGANIZATION_KEY, ROLES_KEY } from '../../core/org/roles.decorator';
import { MembershipRepository, type OpenMembership } from '../repositories/membership.repository';

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  session?: { user?: { id: string } } | null;
  /** Set by the sign-in guard when the request came with an API key: the organisation and role the key gives. */
  keyAccess?: { organizationId: string; role: OpenMembership['role'] };
}

/** Refuses a role the route does not allow. A route with no list is open to every role. */
function assertRoleAllowed(allowed: readonly string[] | undefined, role: string): void {
  if (allowed?.length && !allowed.includes(role)) {
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

/** Who is signed in. RequestAccessGuard runs the sign-in check first; reaching here without it is a bug, and refusing is safer than treating everyone as signed out. */
function signedInUser(request: RequestLike): { id: string } | undefined {
  if (request.session === undefined) {
    throw new Error('The organisation guard ran before the sign-in guard');
  }
  return request.session?.user;
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
    const request = context.switchToHttp().getRequest<RequestLike>();
    if (this.isOutsideAnyOrganisation(context, request)) return true;
    const user = signedInUser(request);
    // Nobody signed in: the sign-in guard already let this route through as a public one.
    if (!user) return true;

    const place = request.keyAccess ?? (await this.placeFor(user.id, request));
    assertRoleAllowed(
      this.reflector.getAllAndOverride<readonly string[] | undefined>(ROLES_KEY, targets),
      place.role,
    );
    setOrganization(place.organizationId, place.role);
    return true;
  }

  /** True for a route that is not about one organisation. Routes like that, and routes for people only, refuse keys. */
  private isOutsideAnyOrganisation(context: ExecutionContext, request: RequestLike): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const outside = this.reflector.getAllAndOverride<boolean>(NO_ORGANIZATION_KEY, targets);
    const peopleOnly = this.reflector.getAllAndOverride<boolean>(NO_API_KEY_KEY, targets);
    if (request.keyAccess && (outside || peopleOnly)) {
      throw new AppException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }
    return Boolean(outside);
  }

  /** The organisation a signed-in person is working in, and their role there. */
  private async placeFor(userId: string, request: RequestLike) {
    return choose(await this.memberships.findOpen(userId), namedBy(request));
  }
}
