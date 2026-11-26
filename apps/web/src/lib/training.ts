import type {
  AddTrainingRequest,
  TrainingResponse,
  UpdateTrainingRequest,
} from '@neeti-bharat/shared';

/** What a training form holds while it is being typed. */
export interface TrainingValues {
  name: string;
  about: string;
  url: string;
  repeatsYearly: boolean;
}

export const NEW_TRAINING: TrainingValues = { name: '', about: '', url: '', repeatsYearly: false };

export const toTrainingValues = (training: TrainingResponse): TrainingValues => ({
  name: training.name,
  about: training.about ?? '',
  url: training.url ?? '',
  repeatsYearly: training.repeatsYearly,
});

/** A training needs a name. The rest is optional. */
export const canSaveTraining = (values: TrainingValues): boolean => values.name.trim() !== '';

const trimmed = (text: string) => text.trim() || undefined;

export function toAddTrainingRequest(values: TrainingValues): AddTrainingRequest {
  return {
    name: values.name.trim(),
    about: trimmed(values.about),
    url: trimmed(values.url),
    repeatsYearly: values.repeatsYearly,
  };
}

/** What was emptied is sent as null, so the API clears it. */
export function toUpdateTrainingRequest(values: TrainingValues): UpdateTrainingRequest {
  return {
    name: values.name.trim(),
    about: trimmed(values.about) ?? null,
    url: trimmed(values.url) ?? null,
    repeatsYearly: values.repeatsYearly,
  };
}

export type Progress = 'complete' | 'started' | 'not_started';

/** How far someone has got: all done, some done, or none. */
export function progressOf(done: number, total: number): Progress {
  if (total > 0 && done >= total) return 'complete';
  return done > 0 ? 'started' : 'not_started';
}
