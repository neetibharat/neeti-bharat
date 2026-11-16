import { describe, expect, it } from 'vitest';
import { PROFILE_FIELDS } from '../../profile.js';
import { DPDP_POLICIES, controlsForPolicy } from './index.js';
import {
  SETTING_LABELS,
  customAnswerLabel,
  resolveDocument,
  starterDocument,
  tokenKeys,
  type PolicyDocument,
} from './policy-document.js';
import { POLICY_SETTINGS, policyTemplate } from './policy-text.js';

const starterOf = (id: string) => {
  const policy = DPDP_POLICIES.find((candidate) => candidate.id === id)!;
  return starterDocument(
    policyTemplate(
      { templateId: policy.id, summary: policy.summary },
      controlsForPolicy(id).map(({ title, description }) => ({ title, description })),
    ),
  );
};

const flat = (doc: PolicyDocument): string => JSON.stringify(doc);

describe('starterDocument', () => {
  it('has the headings, the controls as a list, and the settings', () => {
    const doc = starterOf('P08');
    const headings = doc.content
      .filter((n) => n.type === 'heading')
      .map((n) => n.content![0]!.text);
    expect(headings).toEqual(['Purpose', 'Scope', 'What it requires', 'Settings', 'Contact']);
    expect(flat(doc)).toContain('Breach detection and triage.');
    expect(flat(doc)).toContain('Breach report window: {{breachReportWindow}}');
  });

  it('leaves out the settings heading for a policy that quotes none', () => {
    expect(flat(starterOf('P02'))).not.toContain('Settings');
  });

  it('only asks for answers that exist in the profile', () => {
    const keys = new Set<string>(PROFILE_FIELDS.map((field) => field.key));
    for (const policy of DPDP_POLICIES) {
      for (const key of tokenKeys(starterOf(policy.id)))
        expect(keys.has(key), policy.id).toBe(true);
    }
  });

  it('names every setting a policy quotes', () => {
    for (const keys of Object.values(POLICY_SETTINGS)) {
      for (const key of keys) expect(SETTING_LABELS[key], key).toBeTruthy();
    }
  });
});

describe('answers the company added', () => {
  const custom: PolicyDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Write to us at {{custom:office-address}}.' }],
      },
    ],
  };

  it('are found in the text like any other', () => {
    expect(tokenKeys(custom)).toEqual(['custom:office-address']);
  });

  it('are filled in from the profile', () => {
    const text = flat(
      resolveDocument(custom, { 'custom:office-address': '12 MG Road' }, customAnswerLabel),
    );
    expect(text).toContain('12 MG Road');
  });

  it('show their name in brackets while they have no answer', () => {
    expect(flat(resolveDocument(custom, {}, customAnswerLabel))).toContain('[Office address]');
  });
});

describe('customAnswerLabel', () => {
  it('turns the key into a name', () => {
    expect(customAnswerLabel('custom:office-address')).toBe('Office address');
    expect(customAnswerLabel('custom:gst-no')).toBe('Gst no');
  });
});

describe('resolveDocument', () => {
  const doc: PolicyDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: 'At {{companyName}} in {{hostingRegion}}.',
          },
        ],
      },
    ],
  };

  it('fills what is answered, and highlights what is not, keeping other marks', () => {
    const resolved = resolveDocument(doc, { companyName: 'Acme' }, (key) => `Label of ${key}`);
    const pieces = resolved.content[0]!.content!;
    expect(pieces.map((p) => p.text)).toEqual([
      'At ',
      'Acme',
      ' in ',
      '[Label of hostingRegion]',
      '.',
    ]);
    expect(pieces[1]!.marks).toEqual([{ type: 'bold' }]);
    expect(pieces[3]!.marks).toEqual([{ type: 'bold' }, { type: 'highlight' }]);
  });

  it('does not change the document it was given', () => {
    const before = flat(doc);
    resolveDocument(doc, {}, (key) => key);
    expect(flat(doc)).toBe(before);
  });
});

describe('tokenKeys', () => {
  it('lists each answer once', () => {
    const doc: PolicyDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{dpoName}} and {{dpoName}} and {{dpoEmail}}' }],
        },
      ],
    };
    expect(tokenKeys(doc)).toEqual(['dpoName', 'dpoEmail']);
  });
});
