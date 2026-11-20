import type { AiFeature, AiSettingsResponse } from '@dpdp-kit/shared';

/** Whether an AI feature can be offered: a service is set up, the feature is not switched off, and the person may edit. */
export function featureAvailable(
  settings: AiSettingsResponse | undefined,
  feature: AiFeature,
  canEdit: boolean,
): boolean {
  if (!canEdit || !settings?.provider) return false;
  return !settings.disabledFeatures.includes(feature);
}

/** The features with this one switched off or on. Each appears once, in the order they are listed. */
export function withFeature(
  disabled: readonly AiFeature[],
  all: readonly AiFeature[],
  feature: AiFeature,
  on: boolean,
): AiFeature[] {
  const next = new Set(disabled);
  if (on) next.delete(feature);
  else next.add(feature);
  return all.filter((item) => next.has(item));
}
