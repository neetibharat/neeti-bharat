import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AI_DEFAULT_MODELS,
  AI_FEATURES,
  type AiFeature,
  type AiSettingsResponse,
} from '@neeti-bharat/shared';
import { ActivityService, type ActivityActor } from '../../activity/services/activity.service';
import { AppException } from '../../core/common/app.exception';
import type { Env } from '../../core/config/env.validation';
import type { AiTarget } from '../providers/ai-client';
import { AiSettingRepository } from '../repositories/ai-setting.repository';

const KEY_HINT_LENGTH = 4;

/** The known features among these, once each, in the order they are listed. */
const featuresOf = (names: readonly string[] | undefined): AiFeature[] =>
  AI_FEATURES.filter((feature) => names?.includes(feature));

/**
 * The AI service is the install's: its service, model and key are read from the environment at each call. What a
 * company chooses is which features are on, and that is the only thing kept in the database.
 */
@Injectable()
export class AiSettingsService {
  constructor(
    private readonly settings: AiSettingRepository,
    private readonly config: ConfigService<Env, true>,
    private readonly activity: ActivityService,
  ) {}

  async get(): Promise<AiSettingsResponse> {
    const target = this.environmentTarget();
    return {
      provider: target?.provider ?? null,
      model: target?.model ?? null,
      keyHint: target ? target.apiKey.slice(-KEY_HINT_LENGTH) : null,
      enabledFeatures: target ? featuresOf((await this.settings.find())?.enabledFeatures) : [],
    };
  }

  /** Writes one use of the AI to the activity log, with the service and model that answered, in a transaction of its own. */
  recordUse(
    use: { actor: ActivityActor; subject?: { type: string; id?: string } },
    feature: AiFeature,
    target: AiTarget,
  ): Promise<void> {
    return this.settings.inTransaction(() =>
      this.activity.record({
        actor: use.actor,
        action: 'AI_USED',
        ...(use.subject && { subject: use.subject }),
        details: { feature, provider: target.provider, model: target.model },
      }),
    );
  }

  /** Switches on the features given and off the rest. Only features that exist are kept. */
  async setFeatures(enabled: AiFeature[], actor: ActivityActor): Promise<AiSettingsResponse> {
    this.target();
    const next = featuresOf(enabled);
    await this.settings.setEnabledFeatures(next, actor.label);
    await this.activity.record({
      actor,
      action: 'AI_FEATURES_CHANGED',
      subject: { type: 'ai' },
      details: { on: next.length ? next.join(', ') : 'none' },
    });
    return this.get();
  }

  /** Refuses a feature that is not switched on, or any feature while the install has no AI service. */
  async assertOn(feature: AiFeature): Promise<void> {
    this.target();
    const row = await this.settings.find();
    if (!featuresOf(row?.enabledFeatures).includes(feature)) {
      throw new AppException('AI_FEATURE_OFF', HttpStatus.CONFLICT, { feature });
    }
  }

  /** What a call to the service needs, or AI_NOT_CONFIGURED when the install has no AI service. */
  target(): AiTarget {
    const target = this.environmentTarget();
    if (!target) throw new AppException('AI_NOT_CONFIGURED', HttpStatus.CONFLICT);
    return target;
  }

  private environmentTarget(): AiTarget | null {
    const provider = this.config.get('AI_PROVIDER', { infer: true });
    const apiKey = this.config.get('AI_API_KEY', { infer: true });
    if (!provider || !apiKey) return null;
    const model = this.config.get('AI_MODEL', { infer: true }) ?? AI_DEFAULT_MODELS[provider];
    return { provider, model, apiKey };
  }
}
