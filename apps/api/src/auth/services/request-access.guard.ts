import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_KEY_HEADER } from '@neeti-bharat/shared';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { ApiKeyAdmission } from '../../api-keys/services/api-key-admission';
import { OrganizationGuard } from '../../organizations/services/organization.guard';
import { AUTH } from '../auth-instance';
import type { Auth } from '../auth.factory';

interface KeyRequest {
  headers: Record<string, string | string[] | undefined>;
  session?: unknown;
  user?: unknown;
  keyAccess?: unknown;
}

/** The key a request carries, if it carries one. */
function keyOf(request: KeyRequest): string | undefined {
  const header = request.headers[API_KEY_HEADER];
  return (Array.isArray(header) ? header[0] : header)?.trim() || undefined;
}

/**
 * Every request passes through here first. It checks the person is signed in, which also puts their session on the
 * request, and only then works out which organisation the request is for and whether their role there is allowed.
 * Running the two in one place, in that order, is what keeps the second from ever seeing a request the first has not
 * looked at. A request with an API key is signed in as the key's creator, in the key's organisation.
 */
@Injectable()
export class RequestAccessGuard implements CanActivate {
  private readonly signedIn: AuthGuard;

  constructor(
    reflector: Reflector,
    @Inject(AUTH) auth: Auth,
    private readonly organization: OrganizationGuard,
    private readonly apiKeys: ApiKeyAdmission,
  ) {
    this.signedIn = new AuthGuard(reflector, { auth } as never);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await this.signIn(context))) return false;
    return this.organization.canActivate(context);
  }

  private async signIn(context: ExecutionContext): Promise<boolean> {
    const request =
      context.getType() === 'http' ? context.switchToHttp().getRequest<KeyRequest>() : null;
    const key = request && keyOf(request);
    if (!request || !key) return this.signedIn.canActivate(context);
    const access = await this.apiKeys.admit(key);
    // The shape the sign-in library leaves, so the routes that read the session find a person there.
    request.session = { user: access.user, session: { id: 'api-key' } };
    request.user = access.user;
    request.keyAccess = { organizationId: access.organizationId, role: access.role };
    return true;
  }
}
