import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  PolicyCheckResponse,
  PolicyTailorResponse,
  ProofCheckResponse,
} from '@dpdp-kit/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { actorOf } from '../../core/common/actor';
import { ZodValidationPipe } from '../../core/common/zod-validation.pipe';
import { currentRole } from '../../core/org/org-context';
import { NoApiKey, Roles } from '../../core/org/roles.decorator';
import { TransactionAfterBody } from '../../core/prisma/transaction.interceptor';
import { TailorPolicyDto, tailorPolicySchema, type TailorPolicyInput } from '../dto/ai.dto';
import { PolicyCheckService } from '../services/policy-check.service';
import { PolicyTailorService, type AiAsker } from '../services/policy-tailor.service';
import { ProofCheckService } from '../services/proof-check.service';

const askerOf = ({ user }: UserSession): AiAsker => ({
  actor: actorOf(user),
  viewer: { email: user.email, isAdmin: currentRole() === 'admin' },
});

// Nothing is saved by these, and each waits on the AI, so none holds the request's transaction open. They spend the
// company's AI key, which is for people to decide, so an API key cannot call them.
@ApiTags('AI')
@ApiCookieAuth()
@Controller()
export class AiToolsController {
  constructor(
    private readonly tailor: PolicyTailorService,
    private readonly check: PolicyCheckService,
    private readonly proof: ProofCheckService,
  ) {}

  @Post('policies/:id/tailor')
  @Roles(['admin', 'member'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Suggest a draft policy rewritten for the company, from its profile, its vendors and what the person says about it. Nothing is saved (admin and member)',
  })
  @ApiBody({ type: TailorPolicyDto, required: false })
  tailorPolicy(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(tailorPolicySchema)) body: TailorPolicyInput,
    @Session() session: UserSession,
  ): Promise<PolicyTailorResponse> {
    return this.tailor.tailor(id, askerOf(session), body.context);
  }

  @Post('policies/:id/check')
  @Roles(['admin', 'member'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Read a policy against the rules and controls it covers, and say what it leaves out. Nothing is saved (admin and member)',
  })
  checkPolicy(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<PolicyCheckResponse> {
    return this.check.check(id, askerOf(session));
  }

  @Post('controls/:controlId/evidence/:evidenceId/check')
  @Roles(['admin', 'member'])
  @NoApiKey()
  @TransactionAfterBody()
  @ApiOperation({
    summary:
      'Read one piece of proof against the requirement it was added for. Only its text is sent. Nothing is saved (admin and member)',
  })
  checkProof(
    @Param('controlId') controlId: string,
    @Param('evidenceId') evidenceId: string,
    @Session() { user }: UserSession,
  ): Promise<ProofCheckResponse> {
    return this.proof.check(controlId, evidenceId, actorOf(user));
  }
}
