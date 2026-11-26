import { READINESS_QUESTIONS } from '@neeti-bharat/shared';
import { describe, expect, it } from 'vitest';
import { takeReadinessSchema } from './readiness.dto';

const full = () => Object.fromEntries(READINESS_QUESTIONS.map((q) => [q.id, 'yes']));

describe('takeReadinessSchema', () => {
  it('accepts an answer to every question', () => {
    expect(takeReadinessSchema.safeParse({ answers: full() }).success).toBe(true);
  });

  it('refuses a question left out, an unknown one and a wrong answer', () => {
    const missing: Record<string, string> = full();
    delete missing.encryption;
    expect(takeReadinessSchema.safeParse({ answers: missing }).success).toBe(false);
    expect(takeReadinessSchema.safeParse({ answers: { ...full(), extra: 'yes' } }).success).toBe(
      false,
    );
    expect(
      takeReadinessSchema.safeParse({ answers: { ...full(), encryption: 'maybe' } }).success,
    ).toBe(false);
  });

  it('refuses not applicable where it is not offered', () => {
    expect(
      takeReadinessSchema.safeParse({ answers: { ...full(), encryption: 'not_applicable' } })
        .success,
    ).toBe(false);
    expect(
      takeReadinessSchema.safeParse({ answers: { ...full(), parental_consent: 'not_applicable' } })
        .success,
    ).toBe(true);
  });
});
