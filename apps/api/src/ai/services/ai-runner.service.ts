import { HttpStatus, Injectable } from '@nestjs/common';
import type { AiFeature } from '@dpdp-kit/shared';
import type { ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import { AiClient, AiProviderError, type AiPrompt, type AiTarget } from '../providers/ai-client';
import { UnusableReply } from '../utils/ai-reply';
import { AiSettingsService } from './ai-settings.service';

/**
 * One thing the AI is asked to do: the feature it belongs to, the words to send, and how to turn the answer into
 * something the app can use. A task knows nothing about which service answers, so changing the service or the model
 * in the company's AI setting changes none of them.
 */
export interface AiTask<T> {
  feature: AiFeature;
  prompt: AiPrompt;
  /** Checks the reply and returns the result. Throws `UnusableReply` for an answer that is not what was asked for. */
  parse: (reply: string) => T;
}

/** Who asked, and what it was about, for the activity log. */
export interface AiUse {
  actor: ActivityActor;
  subject?: { type: string; id?: string };
}

/**
 * The only way the app asks the AI anything. It reads the company's AI setting at the moment of the call, so switching
 * service, model or key takes effect at once and nothing else needs to change. It keeps out of the request's database
 * transaction while it waits, and writes the use to the activity log, with the service and model, once it has answered.
 */
@Injectable()
export class AiRunner {
  constructor(
    private readonly settings: AiSettingsService,
    private readonly client: AiClient,
  ) {}

  async run<T>(task: AiTask<T>, use: AiUse): Promise<T> {
    await this.settings.assertOn(task.feature);
    const target = await this.settings.target();
    const result = this.parse(task, await this.ask(target, task.prompt));
    await this.settings.recordUse(use, task.feature, target);
    return result;
  }

  private async ask(target: AiTarget, prompt: AiPrompt): Promise<string> {
    try {
      return await this.client.completeJson(target, prompt);
    } catch (error) {
      if (!(error instanceof AiProviderError)) throw error;
      throw new AppException('AI_FAILED', HttpStatus.BAD_GATEWAY, {
        reason: error.reason,
        detail: error.detail,
      });
    }
  }

  /** An answer that is not the JSON asked for is the service's failure, not the person's. */
  private parse<T>(task: AiTask<T>, reply: string): T {
    try {
      return task.parse(reply);
    } catch (error) {
      if (!(error instanceof UnusableReply)) throw error;
      throw new AppException('AI_FAILED', HttpStatus.BAD_GATEWAY, { reason: 'unusable' });
    }
  }
}
