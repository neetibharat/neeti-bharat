import { Injectable, Logger } from '@nestjs/common';
import type { AiProvider } from '@dpdp-kit/shared';

/** Which service, which model and whose key a call is made with. */
export interface AiTarget {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

export interface AiPrompt {
  system: string;
  user: string;
}

/** Why a call to an AI service failed. The web app turns each into a sentence; none of it holds the key. */
export type AiFailure = 'key' | 'busy' | 'timeout' | 'empty' | 'unusable' | 'other';

/** The service refused or could not be reached. `detail` is what the service itself said, when it said anything. */
export class AiProviderError extends Error {
  constructor(
    readonly reason: AiFailure,
    readonly detail = '',
  ) {
    super(reason);
  }
}

/** Asks an AI service a question and gets its JSON answer back. Faked in tests; `HttpAiClient` is the real one. */
export abstract class AiClient {
  /** Makes one small call, to see that the key and the model work. Throws `AiProviderError` if they do not. */
  abstract verify(target: AiTarget): Promise<void>;
  /** Sends the prompt and returns the text of the answer, which the prompt asks to be a JSON object. */
  abstract completeJson(target: AiTarget, prompt: AiPrompt): Promise<string>;
}

// Where each service listens. The addresses are fixed here, so a key can only ever be sent to its own service.
const BASE_URL: Record<AiProvider, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com',
  anthropic: 'https://api.anthropic.com/v1',
};

const VERIFY_SECONDS = 30;
const COMPLETE_SECONDS = 120;
const MAX_ANSWER_TOKENS = 16_000;
const DETAIL_MAX_LENGTH = 200;

@Injectable()
export class HttpAiClient extends AiClient {
  private readonly logger = new Logger(HttpAiClient.name);

  async verify(target: AiTarget): Promise<void> {
    const prompt = {
      system: 'Reply with the JSON object {"ok": true} and nothing else.',
      user: 'ping',
    };
    await this.send(target, prompt, VERIFY_SECONDS);
  }

  completeJson(target: AiTarget, prompt: AiPrompt): Promise<string> {
    return this.send(target, prompt, COMPLETE_SECONDS);
  }

  private async send(target: AiTarget, prompt: AiPrompt, seconds: number): Promise<string> {
    const request =
      target.provider === 'anthropic'
        ? anthropicRequest(target, prompt)
        : openAiRequest(target, prompt);
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(request.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...request.headers },
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(seconds * 1000),
      });
    } catch {
      throw new AiProviderError('timeout');
    }
    const body: unknown = await response.json().catch(() => null);
    // How long the service took and how much it read and wrote, so a slow call can be explained. Never the key or the text.
    this.logger.log(
      `${target.provider} ${target.model}: ${response.status}, ${elapsed(started)}s, ${usageText(body)}`,
    );
    if (!response.ok) throw failureOf(response.status, body, target.apiKey);
    const text = target.provider === 'anthropic' ? anthropicText(body) : openAiText(body);
    if (!text) throw new AiProviderError('empty');
    return text;
  }
}

interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * DeepSeek's models think at length, out of sight, before every answer unless told not to. These jobs are short answers
 * in a fixed shape, so thinking only adds waiting (and can disturb strict JSON). The field is DeepSeek's own and no other
 * service is sent it.
 */
const quietThinking = (target: AiTarget) =>
  target.provider === 'deepseek' ? { thinking: { type: 'disabled' } } : {};

function openAiRequest(target: AiTarget, prompt: AiPrompt): ProviderRequest {
  return {
    url: `${BASE_URL[target.provider]}/chat/completions`,
    headers: { authorization: `Bearer ${target.apiKey}` },
    body: {
      model: target.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      response_format: { type: 'json_object' },
      ...quietThinking(target),
    },
  };
}

function anthropicRequest(target: AiTarget, prompt: AiPrompt): ProviderRequest {
  return {
    url: `${BASE_URL.anthropic}/messages`,
    headers: { 'x-api-key': target.apiKey, 'anthropic-version': '2023-06-01' },
    body: {
      model: target.model,
      max_tokens: MAX_ANSWER_TOKENS,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    },
  };
}

const elapsed = (started: number): string => ((Date.now() - started) / 1000).toFixed(1);

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
}

const reasoningNote = (usage: Usage): string => {
  const reasoning = usage.completion_tokens_details?.reasoning_tokens;
  return reasoning ? ` (${reasoning} reasoning)` : '';
};

/** What a service says it read and wrote, in a few words, such as "read 2100, wrote 340 (120 reasoning)". */
export function usageText(body: unknown): string {
  const usage = (body as { usage?: Usage } | null)?.usage;
  if (!usage) return 'no usage reported';
  const read = usage.prompt_tokens ?? usage.input_tokens ?? 0;
  const wrote = usage.completion_tokens ?? usage.output_tokens ?? 0;
  return `read ${read}, wrote ${wrote}${reasoningNote(usage)}`;
}

const openAiText = (body: unknown): string =>
  (body as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message
    ?.content as string;

const anthropicText = (body: unknown): string =>
  (body as { content?: { type: string; text?: string }[] } | null)?.content
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('') ?? '';

/** The failure to report for an answer that was not a success. What the service said is kept, with the key taken out. */
function failureOf(status: number, body: unknown, apiKey: string): AiProviderError {
  if (status === 401 || status === 403) return new AiProviderError('key');
  if (status === 429) return new AiProviderError('busy');
  const message = (body as { error?: { message?: unknown } } | null)?.error?.message;
  const said = typeof message === 'string' ? message.split(apiKey).join('***') : '';
  return new AiProviderError('other', said.slice(0, DETAIL_MAX_LENGTH));
}
