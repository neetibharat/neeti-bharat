import { PROOF_TEMPLATES, type ProofTemplate } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { insertTemplate, matchingTemplates, templateTrigger } from './template-suggest';

const templates: ProofTemplate[] = [
  {
    file: 'PR-P01-01-published-notice-snapshot.docx',
    title: 'Published notice snapshot',
    proofId: 'PR-P01-01',
  },
  { file: 'PR-P08-01-incident-register.docx', title: 'Incident register', proofId: 'PR-P08-01' },
];

describe('templateTrigger', () => {
  it('opens on a / that starts a word, and carries what was typed after it', () => {
    expect(templateTrigger('/', 1)).toEqual({ start: 0, end: 1, query: '' });
    expect(templateTrigger('Use this: /not', 14)).toEqual({ start: 10, end: 14, query: 'not' });
    expect(templateTrigger('Use\n/inc', 8)).toEqual({ start: 4, end: 8, query: 'inc' });
  });

  it('does not open in the middle of an address or a word', () => {
    expect(templateTrigger('see https://x.in/a', 18)).toBeNull();
    expect(templateTrigger('and/or', 6)).toBeNull();
    expect(templateTrigger('no slash here', 13)).toBeNull();
  });

  it('closes once the word has a space after it', () => {
    expect(templateTrigger('/notice ', 8)).toBeNull();
  });

  it('treats a typed templates/ prefix as the start of the path, not as a search', () => {
    expect(templateTrigger('/templ', 6)?.query).toBe('');
    expect(templateTrigger('/templates/inc', 14)?.query).toBe('inc');
  });
});

describe('matchingTemplates', () => {
  it('lists everything for nothing typed, and narrows by title or file name', () => {
    expect(matchingTemplates(templates, '')).toHaveLength(2);
    expect(matchingTemplates(templates, 'incident').map((t) => t.proofId)).toEqual(['PR-P08-01']);
    expect(matchingTemplates(templates, 'p01 notice').map((t) => t.proofId)).toEqual(['PR-P01-01']);
    expect(matchingTemplates(templates, 'zzz')).toEqual([]);
  });

  it('works on the templates the kit ships', () => {
    expect(matchingTemplates(PROOF_TEMPLATES, '').length).toBe(PROOF_TEMPLATES.length);
  });
});

describe('insertTemplate', () => {
  it('replaces the word with the path and puts the cursor after it', () => {
    const text = 'Use /not and fill it in.';
    const trigger = templateTrigger(text, 8)!;
    const done = insertTemplate(text, trigger, templates[0]!);
    expect(done.text).toBe(
      'Use /templates/PR-P01-01-published-notice-snapshot.docx and fill it in.',
    );
    expect(done.cursor).toBe(4 + '/templates/PR-P01-01-published-notice-snapshot.docx'.length);
  });
});
