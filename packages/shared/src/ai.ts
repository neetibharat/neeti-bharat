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

/**
 * What the company's AI service is used for. Each can be switched off on its own. A feature is a prompt and the shape of
 * its answer; none of them knows which service answers, so changing the service or the model changes none of them.
 */
export const AI_FEATURES = [
  'policy_import',
  'policy_tailor',
  'policy_check',
  'proof_check',
] as const;
export type AiFeature = (typeof AI_FEATURES)[number];

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
  /** The features an admin has switched off. Empty when all are on. */
  disabledFeatures: AiFeature[];
}

export interface SaveAiFeaturesRequest {
  disabledFeatures: AiFeature[];
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

/** The most a person can write about their company for the AI to use when tailoring a policy. */
export const AI_CONTEXT_MAX_LENGTH = 2000;

/** The body of `POST /v1/policies/:id/tailor`. */
export interface TailorPolicyRequest {
  /** Anything the AI should know about the company that the profile and the vendor list do not say. */
  context?: string;
}

/** A policy rewritten for the company, to read and then keep or drop. Nothing is saved until a person replaces the text. */
export interface PolicyTailorResponse {
  /** The proposed text, in the editor's format. */
  content: PolicyDocument;
  /** What was changed, in a line each, for the person to check against the text. */
  changes: string[];
  /** Facts the policy needs that the company profile does not hold yet, as the profile's names for them. */
  missingAnswers: string[];
}

/** How well a policy's text covers one control. `missing` is also what a control the AI did not answer for is given. */
export const POLICY_CHECK_VERDICTS = ['covered', 'partly', 'missing'] as const;
export type PolicyCheckVerdict = (typeof POLICY_CHECK_VERDICTS)[number];

export interface PolicyCheckControl {
  controlId: string;
  title: string;
  verdict: PolicyCheckVerdict;
  /** Why, in a sentence or two. */
  note: string;
  /** What to add, when something is missing. Empty when nothing is. */
  suggestion: string;
}

export interface PolicyCheckRule {
  ruleId: string;
  frameworkId: string;
  reference: string;
  title: string;
  controls: PolicyCheckControl[];
}

/** A policy read against the rules and controls it is meant to cover. A suggestion, not legal advice. */
export interface PolicyCheckResponse {
  summary: string;
  rules: PolicyCheckRule[];
}

/** Whether a piece of proof looks like what the requirement asks for. `unclear` is for what cannot be told from the text. */
export const PROOF_CHECK_VERDICTS = ['matches', 'partly', 'does_not_match', 'unclear'] as const;
export type ProofCheckVerdict = (typeof PROOF_CHECK_VERDICTS)[number];

export interface ProofCheckResponse {
  verdict: ProofCheckVerdict;
  reason: string;
  /** What the requirement asks for that the proof does not show. */
  missing: string[];
  /** A clearer title for the proof, or empty when its own is fine. */
  suggestedTitle: string;
  /** A date the document carries, such as when a review was done, as YYYY-MM-DD. Null when it has none. */
  dateOnDocument: string | null;
}
