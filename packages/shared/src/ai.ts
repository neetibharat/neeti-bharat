import type { PolicyDocument } from './frameworks/dpdp/policy-document.js';
import type { JobRole } from './people.js';

/** The AI services DPDP Kit can ask to read a document. Each is called with the company's own key. */
export const AI_PROVIDERS = ['openai', 'anthropic', 'deepseek'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** A model suggested when a provider is picked. OpenAI has none: its model names change often, so the company types one. */
export const AI_DEFAULT_MODELS: Readonly<Record<AiProvider, string>> = {
  openai: '',
  anthropic: 'claude-haiku-5-5',
  deepseek: 'deepseek-flash',
};

export const AI_MODEL_MAX_LENGTH = 80;
export const AI_KEY_MAX_LENGTH = 400;

/** The company's AI setting, from `GET /v1/ai`. The key is never sent back, only its last four characters. */
export interface AiSettingsResponse {
  /** False when the install has no secrets key, so no key can be kept. */
  enabled: boolean;
  provider: AiProvider | null;
  model: string | null;
  /** The last four characters of the key, so people can tell which one is set. */
  keyHint: string | null;
  /** Who set it. */
  configuredByName: string | null;
}

export interface SaveAiSettingsRequest {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

/** The files a policy can be read from. A scan with no text in it cannot be read. */
export const POLICY_IMPORT_EXTENSIONS = ['pdf', 'docx', 'pptx'] as const;
export type PolicyImportExtension = (typeof POLICY_IMPORT_EXTENSIONS)[number];
export const POLICY_IMPORT_MAX_BYTES = 10 * 1024 * 1024;

/** The most text read from one file. A policy is a few thousand words, so this is far beyond a real one. */
export const POLICY_IMPORT_MAX_CHARACTERS = 80_000;

/** A policy read from a file, to check and edit before it is added. Nothing is kept from the file itself. */
export interface PolicyImportResponse {
  title: string;
  /** What the policy is for, in a sentence or two. */
  summary: string;
  /** Null when the file does not say who owns it. */
  ownerRole: JobRole | null;
  /** Empty when the file does not say who approves it. */
  approverTitle: string;
  content: PolicyDocument;
  /** False when the file had none and the AI wrote one, so the person knows to read it closely. */
  titleFromFile: boolean;
  summaryFromFile: boolean;
}
