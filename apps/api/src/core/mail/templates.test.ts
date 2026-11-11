import { describe, expect, it } from 'vitest';
import { renderMail } from './templates';

describe('renderMail', () => {
  it('writes the sign-in email with its link and how long it lasts', () => {
    const { subject, text } = renderMail('en', 'signIn', { url: 'https://x.in/go', minutes: 5 });
    expect(subject).toContain('sign-in');
    expect(text).toContain('https://x.in/go');
    expect(text).toContain('5 minutes');
  });

  it('writes the invitation with where to sign in and how long it is valid', () => {
    const { text } = renderMail('en', 'invitation', { url: 'https://x.in', days: 7 });
    expect(text).toContain('https://x.in');
    expect(text).toContain('7 days');
  });
});
