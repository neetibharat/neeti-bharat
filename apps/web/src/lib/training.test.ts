import { describe, expect, it } from 'vitest';
import {
  NEW_TRAINING,
  canSaveTraining,
  progressOf,
  toAddTrainingRequest,
  toUpdateTrainingRequest,
} from './training';

const filled = {
  name: ' DPDP awareness ',
  about: '',
  url: ' https://example.com/v ',
  repeatsYearly: true,
};

describe('canSaveTraining', () => {
  it('needs a name and nothing else', () => {
    expect(canSaveTraining(NEW_TRAINING)).toBe(false);
    expect(canSaveTraining({ ...NEW_TRAINING, name: '  ' })).toBe(false);
    expect(canSaveTraining(filled)).toBe(true);
  });
});

describe('requests', () => {
  it('trim, and leave out what was not filled in when adding', () => {
    expect(toAddTrainingRequest(filled)).toEqual({
      name: 'DPDP awareness',
      about: undefined,
      url: 'https://example.com/v',
      repeatsYearly: true,
    });
  });

  it('send what was emptied as null when editing, so the API clears it', () => {
    expect(toUpdateTrainingRequest(filled)).toEqual({
      name: 'DPDP awareness',
      about: null,
      url: 'https://example.com/v',
      repeatsYearly: true,
    });
  });
});

describe('progressOf', () => {
  it('says all, some or none of the trainings are done', () => {
    expect(progressOf(4, 4)).toBe('complete');
    expect(progressOf(1, 4)).toBe('started');
    expect(progressOf(0, 4)).toBe('not_started');
    expect(progressOf(0, 0)).toBe('not_started');
  });
});
