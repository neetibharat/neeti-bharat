import {
  READINESS_DOMAINS,
  READINESS_QUESTIONS,
  type ReadinessAnswers,
} from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import {
  answerOptions,
  firstOpenDomain,
  isComplete,
  progressOf,
  unansweredIn,
} from './readiness-form';

const full = (): ReadinessAnswers =>
  Object.fromEntries(READINESS_QUESTIONS.map((question) => [question.id, 'yes' as const]));

describe('answerOptions', () => {
  it('offers yes, partly and no, and not applicable only where a question allows it', () => {
    const [plain] = READINESS_QUESTIONS;
    const optional = READINESS_QUESTIONS.find((question) => question.canBeNotApplicable)!;
    expect(answerOptions(plain!)).toEqual(['yes', 'partly', 'no']);
    expect(answerOptions(optional)).toEqual(['yes', 'partly', 'no', 'not_applicable']);
  });
});

describe('progress through the questions', () => {
  it('counts what is answered in an area and overall', () => {
    const domain = READINESS_DOMAINS[0];
    expect(unansweredIn(domain, {})).toBe(3);
    expect(unansweredIn(domain, { responsible_person: 'yes' })).toBe(2);
    expect(progressOf({ responsible_person: 'yes', written_policy: 'no' })).toEqual({
      answered: 2,
      total: 25,
    });
  });

  it('knows when every question is answered', () => {
    expect(isComplete(full())).toBe(true);
    const partial: Record<string, string> = full();
    delete partial.encryption;
    expect(isComplete(partial as never)).toBe(false);
  });

  it('starts at the first area with a question open, and at the last when all are answered', () => {
    expect(firstOpenDomain({})).toBe(0);
    const governance = Object.fromEntries(
      READINESS_DOMAINS[0].questions.map((q) => [q.id, 'yes' as const]),
    );
    expect(firstOpenDomain(governance)).toBe(1);
    expect(firstOpenDomain(full())).toBe(READINESS_DOMAINS.length - 1);
  });
});
