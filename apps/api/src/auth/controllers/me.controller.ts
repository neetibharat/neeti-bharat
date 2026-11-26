import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MeResponse } from '@neeti-bharat/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { NoOrganization } from '../../core/org/roles.decorator';
import { OrganizationsService } from '../../organizations/services/organizations.service';

@ApiTags('Auth')
@ApiCookieAuth()
@Controller('me')
export class MeController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @NoOrganization()
  @ApiOperation({ summary: 'The signed-in person and the organisations they can open' })
  async me(@Session() { user }: UserSession): Promise<MeResponse> {
    const { organizations } = await this.organizations.listFor(user.id);
    return { id: user.id, name: user.name, email: user.email, organizations };
  }
}
