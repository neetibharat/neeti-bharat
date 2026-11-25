import { documentToMarkdown, markdownToDocument } from '@dpdp-kit/shared';
import { describe, expect, it } from 'vitest';
import { UnusableReply, shorten } from '../utils/ai-reply';
import { checkTask, toCheckResponse, type CheckRule } from './policy-check.task';
import { applyEdits, tailorTask, toTailorResponse, type TailorInput } from './policy-tailor.task';
import { proofCheckTask, toProofCheckResponse } from './proof-check.task';

const policyMarkdown = documentToMarkdown;

const answers = [
  { key: 'companyName', value: 'Acme Pvt Ltd' },
  { key: 'dpoName', value: '' },
  { key: 'grievanceEmail', value: '' },
];

const doc = markdownToDocument(
  [
    '> All personal data at {{companyName}} is encrypted.',
    '',
    '## 1. Purpose',
    '',
    'We process payments for customers.',
    '',
    '- Keep records safe.',
  ].join('\n'),
);

const tailorInput = (over: Partial<TailorInput> = {}): TailorInput => ({
  title: 'Security policy',
  summary: 'How we protect data.',
  markdown: policyMarkdown(doc),
  document: doc,
  answers,
  vendors: [],
  context: '',
  ...over,
});

describe('tailorTask', () => {
  it('sends the answers given, the unanswered keys, the vendors, the note and the policy', () => {
    const { prompt, feature } = tailorTask(
      tailorInput({
        vendors: [
          {
            name: 'Razorpay',
            service: 'Takes card payments',
            category: 'payments',
            dataKinds: ['financial', 'contact'],
            location: 'india',
          },
        ],
        context: 'We are a fintech with 120 staff.',
      }),
    );
    expect(feature).toBe('policy_tailor');
    expect(prompt.user).toContain('{{companyName}} = "Acme Pvt Ltd"');
    expect(prompt.user).toContain('Unanswered keys:\n- dpoName\n- grievanceEmail');
    expect(prompt.user).toContain(
      '- Razorpay (payments): Takes card payments; data given: financial, contact; works india',
    );
    expect(prompt.user).toContain(
      'Description written by the person: We are a fintech with 120 staff.',
    );
    expect(prompt.user).toContain('## 1. Purpose');
    expect(prompt.system).toContain('"edits"');
  });

  it('says so when there are no vendors and no note', () => {
    const { prompt } = tailorTask(tailorInput());
    expect(prompt.user).toContain('Vendors in use: (none listed)');
    expect(prompt.user).toContain('Description written by the person: (none)');
  });
});

describe('applyEdits', () => {
  const text = 'One sentence here. Another sentence there.\n\nA third line.';

  it('makes an edit by finding its text exactly once', () => {
    const { text: next, applied } = applyEdits(text, [
      {
        find: 'Another sentence there.',
        replace: 'Another sentence there, in India.',
        reason: 'r',
      },
    ]);
    expect(next).toBe('One sentence here. Another sentence there, in India.\n\nA third line.');
    expect(applied).toHaveLength(1);
  });

  it('leaves out an edit it cannot make safely, and makes the rest', () => {
    const { text: next, applied } = applyEdits('same word. same word. unique line.', [
      { find: 'same word.', replace: 'changed.', reason: 'appears twice' },
      { find: 'not in the text', replace: 'x', reason: 'absent' },
      { find: 'unique line.', replace: 'unique line.', reason: 'says nothing new' },
      { find: 'unique\nline', replace: 'x', reason: 'across lines' },
      { find: '  ', replace: 'x', reason: 'empty' },
      { find: 'unique line.', replace: 'a better line.', reason: 'ok' },
    ]);
    expect(next).toBe('same word. same word. a better line.');
    expect(applied.map((edit) => edit.reason)).toEqual(['ok']);
  });

  it('applies edits one after the other, so a later one can build on an earlier one', () => {
    const { text: next } = applyEdits('alpha beta', [
      { find: 'alpha', replace: 'alpha one', reason: 'a' },
      { find: 'beta', replace: 'beta two', reason: 'b' },
    ]);
    expect(next).toBe('alpha one beta two');
  });
});

describe('toTailorResponse', () => {
  it('changes only the sentence it was told to, and keeps every other line as it was, callout included', () => {
    const reply = JSON.stringify({
      edits: [
        {
          find: 'We process payments for customers.',
          replace:
            'We process card payments for customers, with Razorpay as our payment processor.',
          reason: 'Named the payment processor, from the vendor list.',
        },
      ],
      missingAnswers: ['dpoName', 'companyName', 'madeUp'],
    });
    const result = toTailorResponse(reply, tailorInput());
    const lines = policyMarkdown(result.content).split('\n');
    expect(lines[0]).toBe('> All personal data at {{companyName}} is encrypted.');
    expect(lines.join('\n')).toContain('with Razorpay as our payment processor');
    expect(result.changes).toEqual(['Named the payment processor, from the vendor list.']);
    expect(result.missingAnswers).toEqual(['dpoName']);
  });

  it('hands the policy back untouched when there are no edits, or none that can be made', () => {
    const none = toTailorResponse(JSON.stringify({ edits: [], missingAnswers: [] }), tailorInput());
    expect(none.content).toBe(doc);
    expect(none.changes).toEqual([]);
    const unusable = toTailorResponse(
      JSON.stringify({ edits: [{ find: 'not in the policy', replace: 'x', reason: 'r' }] }),
      tailorInput(),
    );
    expect(unusable.content).toBe(doc);
    expect(unusable.changes).toEqual([]);
  });

  it('cuts a long reason, and refuses a reply that is not JSON', () => {
    const reply = JSON.stringify({
      edits: [
        { find: 'Keep records safe.', replace: 'Keep all records safe.', reason: 'x'.repeat(500) },
      ],
    });
    const [reason] = toTailorResponse(reply, tailorInput()).changes;
    expect(reason!.length).toBeLessThanOrEqual(300);
    expect(reason!.endsWith('…')).toBe(true);
    expect(() => toTailorResponse('not json', tailorInput())).toThrow(UnusableReply);
  });
});

const rules: CheckRule[] = [
  {
    id: 'R6',
    frameworkId: 'dpdp',
    reference: 'Rule 6',
    title: 'Security safeguards',
    summary: 'Protect personal data.',
    controls: [
      { id: 'c1', title: 'Encryption', description: 'Encrypt data.' },
      { id: 'c2', title: 'Access control', description: 'Least privilege.' },
    ],
  },
];

describe('checkTask', () => {
  it('lists every control by id, with the rule it sits under', () => {
    const { prompt } = checkTask({ title: 'Security', markdown: 'Text.', rules });
    expect(prompt.user).toContain('Rule 6, Security safeguards');
    expect(prompt.user).toContain('id c1: Encryption. Encrypt data.');
    expect(prompt.user).toContain('id c2: Access control.');
  });

  it('keeps the verdicts, and marks a control the AI skipped as missing, saying so', () => {
    const reply = JSON.stringify({
      summary: 'Mostly there.',
      controls: [{ controlId: 'c1', verdict: 'covered', note: 'Section 2.', suggestion: '' }],
    });
    const [rule] = toCheckResponse(reply, rules).rules;
    expect(rule!.controls[0]).toMatchObject({ controlId: 'c1', verdict: 'covered' });
    expect(rule!.controls[1]).toMatchObject({ controlId: 'c2', verdict: 'missing' });
    expect(rule!.controls[1]!.note).toContain('no answer');
  });

  it('treats a verdict it does not know as missing', () => {
    const reply = JSON.stringify({
      summary: '',
      controls: [
        { controlId: 'c1', verdict: 'great', note: '', suggestion: '' },
        { controlId: 'c2', verdict: 'partly', note: 'Vague.', suggestion: 'Add roles.' },
      ],
    });
    const [rule] = toCheckResponse(reply, rules).rules;
    expect(rule!.controls.map((c) => c.verdict)).toEqual(['missing', 'partly']);
  });

  it('refuses an answer that covers fewer than half the controls', () => {
    const reply = JSON.stringify({ summary: '', controls: [] });
    expect(() => toCheckResponse(reply, rules)).toThrow(UnusableReply);
  });
});

const proofInput = {
  control: { title: 'Access review', description: 'Review access quarterly.' },
  requirement: {
    title: 'Quarterly access review',
    description: 'Sign-off.',
    frequency: 'quarterly',
  },
  proof: { kind: 'file', title: 'review.pdf', note: null, url: null, fileName: 'review.pdf' },
  fileText: 'Access review completed on 2026-09-30 by the CISO.',
};

describe('proofCheckTask', () => {
  it('sends the requirement and the text of the proof, never the file', () => {
    const { prompt, feature } = proofCheckTask(proofInput);
    expect(feature).toBe('proof_check');
    expect(prompt.user).toContain('Requirement: Quarterly access review. Sign-off.');
    expect(prompt.user).toContain('Text of the file:\nAccess review completed on 2026-09-30');
  });

  it('keeps a real date from the document and drops one that does not exist', () => {
    const ok = toProofCheckResponse(
      JSON.stringify({
        verdict: 'matches',
        reason: 'Dated sign-off.',
        missing: [],
        suggestedTitle: '',
        dateOnDocument: '2026-09-30',
      }),
    );
    expect(ok).toMatchObject({ verdict: 'matches', dateOnDocument: '2026-09-30' });
    const bad = toProofCheckResponse(
      JSON.stringify({ verdict: 'matches', reason: '', dateOnDocument: '2026-02-30' }),
    );
    expect(bad.dateOnDocument).toBeNull();
  });

  it('says unclear for a verdict it does not know, and trims what is too long', () => {
    const result = toProofCheckResponse(
      JSON.stringify({
        verdict: 'perfect',
        reason: 'r'.repeat(900),
        missing: ['  a  ', ''],
        suggestedTitle: 't'.repeat(200),
      }),
    );
    expect(result.verdict).toBe('unclear');
    expect(result.reason.length).toBeLessThanOrEqual(600);
    expect(result.reason.endsWith('…')).toBe(true);
    expect(result.missing).toEqual(['a']);
    expect(result.suggestedTitle.length).toBe(80);
  });
});

describe('shorten', () => {
  it('leaves short text alone', () => {
    expect(shorten('  A short note.  ', 50)).toBe('A short note.');
  });

  it('cuts at the end of a word and says it left something out, never mid-word', () => {
    const text =
      'Section 3 commits to encryption in transit and at rest, and section 4 covers key management.';
    const cut = shorten(text, 60);
    expect(cut.length).toBeLessThanOrEqual(60);
    expect(cut.endsWith('…')).toBe(true);
    expect(text.startsWith(cut.slice(0, -1))).toBe(true);
    expect(text.charAt(cut.length - 1)).toBe(' ');
  });

  it('falls back to a hard cut for a long unbroken run', () => {
    const cut = shorten('x'.repeat(100), 20);
    expect(cut).toHaveLength(20);
    expect(cut.endsWith('…')).toBe(true);
  });
});
