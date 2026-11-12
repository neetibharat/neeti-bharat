import { describe, expect, it } from 'vitest';
import {
  READINESS_BANDS,
  READINESS_DOMAINS,
  READINESS_QUESTIONS,
  isValidReadinessAnswers,
  readinessBand,
  scoreReadiness,
  type ReadinessAnswer,
  type ReadinessAnswers,
} from './readiness.js';

const all = (answer: ReadinessAnswer): ReadinessAnswers =>
  Object.fromEntries(
    READINESS_QUESTIONS.map((q) => [
      q.id,
      answer === 'not_applicable' && !q.canBeNotApplicable ? 'no' : answer,
    ]),
  );

describe('the readiness check', () => {
  it('has 25 questions in eight areas worth 100 points', () => {
    expect(READINESS_QUESTIONS).toHaveLength(25);
    expect(READINESS_DOMAINS).toHaveLength(8);
    expect(READINESS_DOMAINS.reduce((sum, domain) => sum + domain.points, 0)).toBe(100);
  });

  it('gives every question an id of its own', () => {
    const ids = READINESS_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scoreReadiness', () => {
  it('is 100 for all yes and 0 for all no', () => {
    expect(scoreReadiness(all('yes')).score).toBe(100);
    expect(scoreReadiness(all('no')).score).toBe(0);
  });

  it('counts partly as half', () => {
    expect(scoreReadiness(all('partly')).score).toBe(50);
  });

  it('weighs a domain by its points', () => {
    const answers = { ...all('no') };
    for (const q of READINESS_DOMAINS[1].questions) answers[q.id] = 'yes';
    const result = scoreReadiness(answers);
    expect(result.score).toBe(20);
    expect(result.domains.find((d) => d.id === 'consent_notice')).toMatchObject({
      points: 20,
      earned: 20,
      percent: 100,
    });
  });

  it('splits a domain evenly between its questions', () => {
    const answers = { ...all('no'), responsible_person: 'yes' as const };
    const governance = scoreReadiness(answers).domains.find((d) => d.id === 'governance')!;
    expect(governance.earned).toBe(5);
    expect(governance.percent).toBe(33);
  });

  it('leaves a not applicable question out instead of counting it against the company', () => {
    const answers = {
      ...all('yes'),
      parental_consent: 'not_applicable' as const,
      age_check: 'no' as const,
    };
    const children = scoreReadiness(answers).domains.find((d) => d.id === 'children_special')!;
    // Three questions count: one no and two yes, out of 5 points.
    expect(children.percent).toBe(67);
  });
});

describe('readinessBand', () => {
  it('names the band a score reaches', () => {
    expect(readinessBand(0)).toBe('starting');
    expect(readinessBand(39)).toBe('starting');
    expect(readinessBand(40)).toBe('building');
    expect(readinessBand(70)).toBe('good');
    expect(readinessBand(89)).toBe('good');
    expect(readinessBand(90)).toBe('strong');
    expect(readinessBand(100)).toBe('strong');
  });

  it('lists the bands from lowest to highest', () => {
    const starts = READINESS_BANDS.map((band) => band.from);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });
});

describe('isValidReadinessAnswers', () => {
  it('accepts a full set of answers', () => {
    expect(isValidReadinessAnswers(all('partly'))).toBe(true);
  });

  it('refuses a missing, unknown or misspelt answer', () => {
    const missing = { ...all('yes') } as Record<string, unknown>;
    delete missing.encryption;
    expect(isValidReadinessAnswers(missing)).toBe(false);
    expect(isValidReadinessAnswers({ ...all('yes'), extra: 'yes' })).toBe(false);
    expect(isValidReadinessAnswers({ ...all('yes'), encryption: 'maybe' })).toBe(false);
  });

  it('allows not applicable only where it is offered', () => {
    expect(isValidReadinessAnswers({ ...all('yes'), parental_consent: 'not_applicable' })).toBe(
      true,
    );
    expect(isValidReadinessAnswers({ ...all('yes'), encryption: 'not_applicable' })).toBe(false);
  });
});
