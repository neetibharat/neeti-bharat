import { AzureAccessError, type AzureApi, type AzureEndpoint } from '../azure-api';

/** What a fake service answers: a path that contains the key gets the value. */
export type Answers = Record<string, unknown>;

function endpoint(answers: Answers, denied: string[]): AzureEndpoint {
  const find = (path: string): unknown => {
    if (denied.some((part) => path.includes(part))) throw new AzureAccessError('Not allowed');
    const key = Object.keys(answers).find((part) => path.includes(part));
    if (key === undefined) throw new Error(`No fake answer for ${path}`);
    return answers[key];
  };
  return {
    get: <T>(path: string) => Promise.resolve().then(() => find(path) as T),
    list: <T>(path: string) => Promise.resolve().then(() => find(path) as T[]),
  };
}

/** An Azure that answers from a table, for tests: nothing leaves the machine. */
export function fakeAzure(
  parts: { arm?: Answers; graph?: Answers; denied?: string[] } = {},
): AzureApi {
  const denied = parts.denied ?? [];
  return { arm: endpoint(parts.arm ?? {}, denied), graph: endpoint(parts.graph ?? {}, denied) };
}
