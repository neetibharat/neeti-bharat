/** How a company answers each readiness question. Not applicable is only offered where the question may not apply. */
export const READINESS_ANSWERS = ['yes', 'partly', 'no', 'not_applicable'] as const;
export type ReadinessAnswer = (typeof READINESS_ANSWERS)[number];

export interface ReadinessQuestion {
  id: string;
  /** The section of the DPDP Act it rests on, where one is clear. */
  reference?: string;
  /** Offered a "not applicable" answer, for a question that only matters to some companies. */
  canBeNotApplicable?: boolean;
}

export interface ReadinessDomain {
  id: string;
  /** What the domain is worth out of 100. The domains add up to 100. */
  points: number;
  questions: readonly ReadinessQuestion[];
}

/** The readiness check: eight areas, 25 questions, 100 points. The words are in the web app under `readiness`. */
export const READINESS_DOMAINS = [
  {
    id: 'governance',
    points: 15,
    questions: [
      { id: 'responsible_person', reference: 'S.8' },
      { id: 'written_policy' },
      { id: 'grievance_officer', reference: 'S.13' },
    ],
  },
  {
    id: 'consent_notice',
    points: 20,
    questions: [
      { id: 'consent_before_collecting', reference: 'S.6' },
      { id: 'notice_when_collecting', reference: 'S.5' },
      { id: 'withdraw_consent', reference: 'S.6' },
    ],
  },
  {
    id: 'rights',
    points: 15,
    questions: [
      { id: 'access_to_data', reference: 'S.11' },
      { id: 'correct_data', reference: 'S.12' },
      { id: 'erase_data', reference: 'S.12' },
    ],
  },
  {
    id: 'inventory',
    points: 10,
    questions: [
      { id: 'data_inventory' },
      { id: 'purposes_written_down', reference: 'S.5' },
      { id: 'know_where_data_lives' },
    ],
  },
  {
    id: 'security',
    points: 15,
    questions: [
      { id: 'access_controls', reference: 'S.8' },
      { id: 'encryption' },
      { id: 'security_reviews' },
    ],
  },
  {
    id: 'vendors',
    points: 10,
    questions: [
      { id: 'processor_agreements', reference: 'S.8' },
      { id: 'vendor_reviews' },
      { id: 'transfers_abroad', reference: 'S.16' },
    ],
  },
  {
    id: 'breach_retention',
    points: 10,
    questions: [
      { id: 'breach_procedure', reference: 'S.8' },
      { id: 'report_within_window' },
      { id: 'retention_schedule', reference: 'S.8' },
    ],
  },
  {
    id: 'children_special',
    points: 5,
    questions: [
      { id: 'age_check', reference: 'S.9' },
      { id: 'parental_consent', reference: 'S.9', canBeNotApplicable: true },
      { id: 'harm_scenarios' },
      { id: 'sensitive_data_consent' },
    ],
  },
] as const satisfies readonly ReadinessDomain[];

export type ReadinessDomainId = (typeof READINESS_DOMAINS)[number]['id'];

export const READINESS_QUESTIONS: readonly ReadinessQuestion[] = READINESS_DOMAINS.flatMap(
  (domain) => domain.questions as readonly ReadinessQuestion[],
);

/** The answers to every question, by question id. */
export type ReadinessAnswers = Record<string, ReadinessAnswer>;

/** What each answer is worth, as a share of a question. */
const WORTH: Record<Exclude<ReadinessAnswer, 'not_applicable'>, number> = {
  yes: 1,
  partly: 0.5,
  no: 0,
};

export interface ReadinessDomainScore {
  id: ReadinessDomainId;
  points: number;
  /** Out of `points`, to one decimal. */
  earned: number;
  /** A whole percent of the domain. */
  percent: number;
}

export interface ReadinessScore {
  /** Out of 100, a whole number. */
  score: number;
  domains: ReadinessDomainScore[];
}

const round = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

function scoreDomain(domain: ReadinessDomain, answers: ReadinessAnswers): ReadinessDomainScore {
  const counted = domain.questions.flatMap((question) => {
    const answer = answers[question.id];
    return answer && answer !== 'not_applicable' ? [WORTH[answer]] : [];
  });
  // A domain with nothing that applies is not held against the company.
  const share =
    counted.length === 0 ? 1 : counted.reduce((sum, worth) => sum + worth, 0) / counted.length;
  return {
    id: domain.id as ReadinessDomainId,
    points: domain.points,
    earned: round(share * domain.points, 1),
    percent: Math.round(share * 100),
  };
}

/** Works out the score. Each question is worth an equal share of its domain; yes is all of it, partly half, no none. */
export function scoreReadiness(answers: ReadinessAnswers): ReadinessScore {
  const domains = READINESS_DOMAINS.map((domain) => scoreDomain(domain, answers));
  const score = Math.round(domains.reduce((sum, domain) => sum + domain.earned, 0));
  return { score, domains };
}

/** What a score means, from lowest to highest. A score belongs to the last band whose `from` it reaches. */
export const READINESS_BANDS = [
  { id: 'starting', from: 0 },
  { id: 'building', from: 40 },
  { id: 'good', from: 70 },
  { id: 'strong', from: 90 },
] as const;

export type ReadinessBandId = (typeof READINESS_BANDS)[number]['id'];

export function readinessBand(score: number): ReadinessBandId {
  return [...READINESS_BANDS].reverse().find((band) => score >= band.from)!.id;
}

/** A domain at or below this percent is called out as a place to start. */
export const READINESS_WEAK_BELOW = 60;

/** Whether the answers are complete and allowed: every question answered, and "not applicable" only where offered. */
export function isValidReadinessAnswers(
  answers: Record<string, unknown>,
): answers is ReadinessAnswers {
  const known = new Set(READINESS_QUESTIONS.map((question) => question.id));
  if (Object.keys(answers).some((id) => !known.has(id))) return false;
  return READINESS_QUESTIONS.every((question) => {
    const answer = answers[question.id];
    if (typeof answer !== 'string' || !(READINESS_ANSWERS as readonly string[]).includes(answer))
      return false;
    return answer !== 'not_applicable' || Boolean(question.canBeNotApplicable);
  });
}

/** One check as listed. */
export interface ReadinessCheckSummary {
  id: string;
  takenAt: string;
  takenByName: string;
  score: number;
}

/** One check with everything: the answers, and the score per domain. */
export interface ReadinessCheckResponse extends ReadinessCheckSummary {
  answers: ReadinessAnswers;
  domains: ReadinessDomainScore[];
}

/** The latest check and the earlier scores, from `GET /v1/readiness`. */
export interface ReadinessResponse {
  latest: ReadinessCheckResponse | null;
  /** Earlier checks, newest first, the latest included. */
  history: ReadinessCheckSummary[];
}

/** The answers to submit, from the readiness form. */
export interface TakeReadinessCheckRequest {
  answers: ReadinessAnswers;
}

/** How many past checks `GET /v1/readiness` lists. */
export const READINESS_HISTORY_LIMIT = 10;
