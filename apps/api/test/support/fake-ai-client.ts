import { AiClient, type AiPrompt, type AiTarget } from '../../src/ai/providers/ai-client';

/** What the fake service answers a policy file with, until a test sets its own. */
export const POLICY_REPLY = {
  title: 'Cross-Border Transfer Policy',
  titleFromFile: true,
  summary: 'Personal data leaves India only where no restriction applies.',
  summaryFromFile: true,
  ownerRole: 'PRIVACY_LEAD',
  approverTitle: 'Data Protection Officer',
  text: '## 1. Purpose\n\nTo comply with s.16.\n\n## 2. Scope\n\n- Cloud regions\n- Offshore vendors',
};

/** Answers like an AI service would, from a table, and remembers what it was asked. */
export class FakeAiClient extends AiClient {
  reply: string = JSON.stringify(POLICY_REPLY);
  asked: { target: AiTarget; prompt: AiPrompt }[] = [];

  completeJson(target: AiTarget, prompt: AiPrompt): Promise<string> {
    this.asked.push({ target, prompt });
    return Promise.resolve(this.reply);
  }
}

export const fakeAi = new FakeAiClient();
