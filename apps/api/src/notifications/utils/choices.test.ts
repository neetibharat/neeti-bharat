import { describe, expect, it } from 'vitest';
import { choiceResolver } from './choices';

describe('choiceResolver', () => {
  const roleDefaults = [
    { role: 'auditor' as const, kind: 'request' as const, inApp: true, email: false },
  ];

  it('is on in both ways when nobody chose', () => {
    expect(choiceResolver([], [])('member', 'proof')).toEqual({ inApp: true, email: true });
  });

  it('uses the role default, for that role only', () => {
    const choose = choiceResolver([], roleDefaults);
    expect(choose('auditor', 'request')).toEqual({ inApp: true, email: false });
    expect(choose('admin', 'request')).toEqual({ inApp: true, email: true });
  });

  it('lets a person\u2019s own choice win over the role default', () => {
    const choose = choiceResolver([{ kind: 'request', inApp: false, email: true }], roleDefaults);
    expect(choose('auditor', 'request')).toEqual({ inApp: false, email: true });
  });
});
