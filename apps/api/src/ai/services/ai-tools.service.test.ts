import { describe, expect, it, vi } from 'vitest';
import { docx } from '../../../test/support/office-files';
import type { PoliciesService } from '../../frameworks/services/policies.service';
import type { PolicyScopeReader } from '../../frameworks/services/policy-scope-reader';
import type { ProofReader, ProofToRead } from '../../frameworks/services/proof-reader';
import type { ProfileService } from '../../profile/services/profile.service';
import type { VendorBriefReader } from '../../vendors/services/vendor-brief-reader';
import type { AiRunner } from './ai-runner.service';
import { PolicyCheckService } from './policy-check.service';
import { PolicyTailorService, type AiAsker } from './policy-tailor.service';
import { ProofCheckService } from './proof-check.service';

const actor = { id: 'u1', label: 'Asha' };
const asker: AiAsker = { actor, viewer: { email: 'asha@acme.in', isAdmin: true } };

const doc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'We encrypt data.' }] }],
};
const policy = (status: string) => ({
  title: 'Security',
  summary: 'Security.',
  status,
  content: doc,
});

const runner = () => ({ run: vi.fn().mockResolvedValue({ ok: true }) });

describe('PolicyTailorService', () => {
  const build = (status: string) => {
    const ai = runner();
    const policies = { detail: vi.fn().mockResolvedValue(policy(status)) };
    const profile = {
      list: vi
        .fn()
        .mockResolvedValue({ entries: [{ key: 'companyName', value: 'Acme', label: 'x' }] }),
    };
    const vendors = {
      active: vi.fn().mockResolvedValue([
        {
          name: 'Razorpay',
          service: 'Payments',
          category: 'payments',
          dataKinds: [],
          location: null,
        },
      ]),
    };
    const service = new PolicyTailorService(
      ai as unknown as AiRunner,
      policies as unknown as PoliciesService,
      profile as unknown as ProfileService,
      vendors as unknown as VendorBriefReader,
    );
    return { service, ai };
  };

  it('asks for a draft, sending its text and the company answers, and logs it against the policy', async () => {
    const { service, ai } = build('draft');
    await service.tailor('P08', asker);
    const [task, use] = ai.run.mock.calls[0]!;
    expect(task.feature).toBe('policy_tailor');
    expect(task.prompt.user).toContain('We encrypt data.');
    expect(task.prompt.user).toContain('{{companyName}} = "Acme"');
    expect(use).toEqual({ actor, subject: { type: 'policy', id: 'P08' } });
  });

  it('sends the vendors in use and what the person wrote about the company', async () => {
    const { service, ai } = build('draft');
    await service.tailor('P08', asker, 'We are a fintech.');
    const [task] = ai.run.mock.calls[0]!;
    expect(task.prompt.user).toContain('Razorpay');
    expect(task.prompt.user).toContain('Description written by the person: We are a fintech.');
  });

  it('will not rewrite a policy that is in review or approved', async () => {
    for (const status of ['in_review', 'approved']) {
      const { service, ai } = build(status);
      await expect(service.tailor('P08', asker)).rejects.toMatchObject({ code: 'CONFLICT' });
      expect(ai.run).not.toHaveBeenCalled();
    }
  });
});

describe('PolicyCheckService', () => {
  const build = (rules: unknown[]) => {
    const ai = runner();
    const policies = { detail: vi.fn().mockResolvedValue(policy('draft')) };
    const scope = { rulesCoveredBy: vi.fn().mockResolvedValue(rules) };
    const service = new PolicyCheckService(
      ai as unknown as AiRunner,
      policies as unknown as PoliciesService,
      scope as unknown as PolicyScopeReader,
    );
    return { service, ai };
  };

  it('sends the policy with the rules and controls it covers', async () => {
    const rule = {
      id: 'R6',
      frameworkId: 'dpdp',
      reference: 'Rule 6',
      title: 'Security',
      summary: 's',
      controls: [{ id: 'c1', title: 'Encryption', description: 'd' }],
    };
    const { service, ai } = build([rule]);
    await service.check('P08', asker);
    const [task] = ai.run.mock.calls[0]!;
    expect(task.feature).toBe('policy_check');
    expect(task.prompt.user).toContain('id c1: Encryption');
    expect(task.prompt.user).toContain('We encrypt data.');
  });

  it('has nothing to check for a policy that covers no control', async () => {
    const { service, ai } = build([]);
    await expect(service.check('P08', asker)).rejects.toMatchObject({ code: 'NOTHING_TO_CHECK' });
    expect(ai.run).not.toHaveBeenCalled();
  });
});

describe('ProofCheckService', () => {
  const proof = (over: Partial<ProofToRead>): ProofToRead => ({
    kind: 'file',
    title: 'review',
    note: null,
    url: null,
    fileName: 'review.docx',
    bytes: null,
    control: { title: 'Access', description: 'Review access.' },
    requirement: { title: 'Quarterly review', description: 'Sign-off.', frequency: 'quarterly' },
    ...over,
  });
  const build = (found: ProofToRead) => {
    const ai = runner();
    const proofs = { read: vi.fn().mockResolvedValue(found) };
    const service = new ProofCheckService(
      ai as unknown as AiRunner,
      proofs as unknown as ProofReader,
    );
    return { service, ai };
  };

  it('sends the text of a file it can read', async () => {
    const text = 'Access review completed on 30 September by the CISO and signed off.';
    const { service, ai } = build(proof({ bytes: docx([{ text }]) }));
    await service.check('c1', 'e1', actor);
    const [task, use] = ai.run.mock.calls[0]!;
    expect(task.feature).toBe('proof_check');
    expect(task.prompt.user).toContain(text);
    expect(use).toEqual({ actor, subject: { type: 'control', id: 'c1' } });
  });

  it('sends a note on its own, when the proof has no file text', async () => {
    const { service, ai } = build(
      proof({ kind: 'note', fileName: null, note: 'Reviewed on 30 Sep.' }),
    );
    await service.check('c1', 'e1', actor);
    expect(ai.run.mock.calls[0]![0].prompt.user).toContain('Note: Reviewed on 30 Sep.');
  });

  it('has nothing to check for a picture or a link alone', async () => {
    const picture = proof({ fileName: 'shot.png', bytes: Buffer.from('not a document') });
    const link = proof({ kind: 'link', fileName: null, url: 'https://example.com' });
    for (const found of [picture, link]) {
      const { service, ai } = build(found);
      await expect(service.check('c1', 'e1', actor)).rejects.toMatchObject({
        code: 'NOTHING_TO_CHECK',
      });
      expect(ai.run).not.toHaveBeenCalled();
    }
  });
});
