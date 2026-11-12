import {
  READINESS_DOMAINS,
  type ReadinessAnswer,
  type ReadinessAnswers,
  type ReadinessDomain,
  type ReadinessQuestion,
} from '@dpdp-kit/shared';

const DOMAINS: readonly ReadinessDomain[] = READINESS_DOMAINS;

/** The answers a question offers, in the order shown. */
export function answerOptions(question: ReadinessQuestion): ReadinessAnswer[] {
  const base: ReadinessAnswer[] = ['yes', 'partly', 'no'];
  return question.canBeNotApplicable ? [...base, 'not_applicable'] : base;
}

/** How many questions of an area have no answer yet. */
export function unansweredIn(domain: ReadinessDomain, answers: Partial<ReadinessAnswers>): number {
  return domain.questions.filter((question) => !answers[question.id]).length;
}

/** The first area with a question still open, so a returning person lands where they left off. Zero when all are open. */
export function firstOpenDomain(answers: Partial<ReadinessAnswers>): number {
  const index = DOMAINS.findIndex((domain) => unansweredIn(domain, answers) > 0);
  return index === -1 ? DOMAINS.length - 1 : index;
}

/** Whether every question in every area has an answer. */
export function isComplete(answers: Partial<ReadinessAnswers>): answers is ReadinessAnswers {
  return DOMAINS.every((domain) => unansweredIn(domain, answers) === 0);
}

/** How many questions are answered, out of how many. */
export function progressOf(answers: Partial<ReadinessAnswers>): {
  answered: number;
  total: number;
} {
  const total = DOMAINS.reduce((sum, domain) => sum + domain.questions.length, 0);
  const open = DOMAINS.reduce((sum, domain) => sum + unansweredIn(domain, answers), 0);
  return { answered: total - open, total };
}
