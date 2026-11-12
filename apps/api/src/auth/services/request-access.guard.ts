import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { OrganizationGuard } from '../../organizations/services/organization.guard';
import { AUTH } from '../auth-instance';
import type { Auth } from '../auth.factory';

/**
 * Every request passes through here first. It checks the person is signed in, which also puts their session on the
 * request, and only then works out which organisation the request is for and whether their role there is allowed.
 * Running the two in one place, in that order, is what keeps the second from ever seeing a request the first has not
 * looked at.
 */
@Injectable()
export class RequestAccessGuard implements CanActivate {
  private readonly signedIn: AuthGuard;

  constructor(
    reflector: Reflector,
    @Inject(AUTH) auth: Auth,
    private readonly organization: OrganizationGuard,
  ) {
    this.signedIn = new AuthGuard(reflector, { auth } as never);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await this.signedIn.canActivate(context))) return false;
    return this.organization.canActivate(context);
  }
}
