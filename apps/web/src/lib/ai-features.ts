import type { AiFeature, AiSettingsResponse } from '@neeti-bharat/shared';

/** Whether an AI feature can be offered: the install has a service, an admin switched the feature on, and the person may edit. */
export function featureAvailable(
  settings: AiSettingsResponse | undefined,
  feature: AiFeature,
  canEdit: boolean,
): boolean {
  if (!canEdit || !settings?.provider) return false;
  return settings.enabledFeatures.includes(feature);
}

/** The features with this one switched on or off. Each appears once, in the order they are listed. */
export function withFeature(
  enabled: readonly AiFeature[],
  all: readonly AiFeature[],
  feature: AiFeature,
  on: boolean,
): AiFeature[] {
  const next = new Set(enabled);
  if (on) next.add(feature);
  else next.delete(feature);
  return all.filter((item) => next.has(item));
}
