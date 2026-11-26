import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiProviderError, HttpAiClient, usageText } from './ai-client';

const prompt = { system: 'Be brief.', user: 'Hello' };
const KEY = 'sk-super-secret-1234';

const BOTH_SHAPES = {
  choices: [{ message: { content: '{"ok":true}' } }],
  content: [{ type: 'text', text: '{"ok":true}' }],
};

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sent = (fetchMock: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(init.body as string) as Record<string, unknown>,
  };
};

afterEach(() => vi.unstubAllGlobals());

describe('HttpAiClient', () => {
  it('asks DeepSeek for a JSON answer, with the key as a bearer token', async () => {
    const fetchMock = answer(BOTH_SHAPES);
    const text = await new HttpAiClient().completeJson(
      { provider: 'deepseek', model: 'deepseek-flash', apiKey: KEY },
      prompt,
    );
    expect(text).toBe('{"ok":true}');
    const call = sent(fetchMock);
    expect(call.url).toBe('https://api.deepseek.com/chat/completions');
    expect(call.headers['authorization']).toBe(`Bearer ${KEY}`);
    expect(call.body).toMatchObject({
      model: 'deepseek-flash',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system' }, { role: 'user' }],
    });
  });

  it('tells DeepSeek not to think out of sight first, and sends that to no other service', async () => {
    const deepseek = answer(BOTH_SHAPES);
    await new HttpAiClient().completeJson(
      { provider: 'deepseek', model: 'deepseek-flash', apiKey: KEY },
      prompt,
    );
    expect(sent(deepseek).body).toMatchObject({ thinking: { type: 'disabled' } });

    const openai = answer(BOTH_SHAPES);
    await new HttpAiClient().completeJson(
      { provider: 'openai', model: 'gpt-x', apiKey: KEY },
      prompt,
    );
    expect(sent(openai).body).not.toHaveProperty('thinking');

    const anthropic = answer(BOTH_SHAPES);
    await new HttpAiClient().completeJson(
      { provider: 'anthropic', model: 'claude-x', apiKey: KEY },
      prompt,
    );
    expect(sent(anthropic).body).not.toHaveProperty('thinking');
  });

  it('asks Anthropic through its own route and header', async () => {
    const fetchMock = answer(BOTH_SHAPES);
    const text = await new HttpAiClient().completeJson(
      { provider: 'anthropic', model: 'claude-haiku-5-5', apiKey: KEY },
      prompt,
    );
    expect(text).toBe('{"ok":true}');
    const call = sent(fetchMock);
    expect(call.url).toBe('https://api.anthropic.com/v1/messages');
    expect(call.headers['x-api-key']).toBe(KEY);
    expect(call.headers['anthropic-version']).toBeTruthy();
    expect(call.body).toMatchObject({ model: 'claude-haiku-5-5', system: 'Be brief.' });
  });

  it('only ever sends a key to its own service', async () => {
    for (const [provider, host] of [
      ['openai', 'https://api.openai.com/'],
      ['deepseek', 'https://api.deepseek.com/'],
      ['anthropic', 'https://api.anthropic.com/'],
    ] as const) {
      const fetchMock = answer(BOTH_SHAPES);
      await new HttpAiClient().completeJson({ provider, model: 'm', apiKey: KEY }, prompt);
      expect(sent(fetchMock).url.startsWith(host)).toBe(true);
    }
  });

  it('says a refused key was not accepted, without repeating it', async () => {
    answer({ error: { message: `Incorrect API key provided: ${KEY}` } }, 401);
    const error = await new HttpAiClient()
      .completeJson({ provider: 'openai', model: 'm', apiKey: KEY }, prompt)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AiProviderError);
    expect(error).toMatchObject({ reason: 'key', detail: '' });
  });

  it('keeps the message of the service for other failures, with the key taken out', async () => {
    answer({ error: { message: `The model ${KEY} does not exist` } }, 404);
    const error = await new HttpAiClient()
      .completeJson({ provider: 'openai', model: 'nope', apiKey: KEY }, prompt)
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ reason: 'other', detail: 'The model *** does not exist' });
  });

  it('reports an empty answer, a busy service and an unreachable one', async () => {
    const target = { provider: 'deepseek' as const, model: 'm', apiKey: KEY };
    answer({ choices: [{ message: { content: '' } }] });
    await expect(new HttpAiClient().completeJson(target, prompt)).rejects.toMatchObject({
      reason: 'empty',
    });
    answer({}, 429);
    await expect(new HttpAiClient().completeJson(target, prompt)).rejects.toMatchObject({
      reason: 'busy',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(new HttpAiClient().completeJson(target, prompt)).rejects.toMatchObject({
      reason: 'timeout',
    });
  });
});

describe('usageText', () => {
  it('says what was read and written, and how much of it was reasoning', () => {
    expect(
      usageText({
        usage: {
          prompt_tokens: 2100,
          completion_tokens: 340,
          completion_tokens_details: { reasoning_tokens: 120 },
        },
      }),
    ).toBe('read 2100, wrote 340 (120 reasoning)');
    expect(usageText({ usage: { input_tokens: 900, output_tokens: 50 } })).toBe(
      'read 900, wrote 50',
    );
  });

  it('copes with an answer that reports nothing', () => {
    expect(usageText(null)).toBe('no usage reported');
    expect(usageText({})).toBe('no usage reported');
  });
});
