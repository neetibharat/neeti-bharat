'use client';

import {
  READINESS_DOMAINS,
  type ReadinessAnswer,
  type ReadinessAnswers,
  type ReadinessQuestion,
} from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badge/badge';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import {
  answerOptions,
  firstOpenDomain,
  isComplete,
  progressOf,
  unansweredIn,
} from '@/lib/readiness-form';

const DOMAINS = READINESS_DOMAINS;

interface QuestionRowProps {
  question: ReadinessQuestion;
  value: ReadinessAnswer | null;
  onChange: (answer: ReadinessAnswer) => void;
}

function QuestionRow({ question, value, onChange }: QuestionRowProps) {
  const t = useTranslations('readiness');
  // Question ids come from the shared list, and a test keeps en.json in step with it.
  const words = t as unknown as (key: string) => string;

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-body font-medium text-fg">{words(`questions.${question.id}`)}</p>
        {question.reference && (
          <p className="mt-0.5 text-caption text-fg-subtle">
            {t('reference', { section: question.reference })}
          </p>
        )}
      </div>
      <SegmentedControl
        aria-label={words(`questions.${question.id}`)}
        value={value}
        onChange={onChange}
        options={answerOptions(question).map((answer) => ({
          id: answer,
          label: t(`answers.${answer}`),
        }))}
      />
    </li>
  );
}

interface AreaCardProps {
  domain: (typeof READINESS_DOMAINS)[number];
  answers: Partial<ReadinessAnswers>;
  onAnswer: (questionId: string, answer: ReadinessAnswer) => void;
}

/** One area of the check: its name, what it is worth, and its questions. */
function AreaCard({ domain, answers, onAnswer }: AreaCardProps) {
  const t = useTranslations('readiness');

  return (
    <Card
      title={t(`domains.${domain.id}.title`)}
      description={t(`domains.${domain.id}.about`)}
      actions={<Badge color="brand">{t('points', { points: domain.points })}</Badge>}
    >
      <ul className="divide-y divide-line">
        {domain.questions.map((question) => (
          <QuestionRow
            key={question.id}
            question={question}
            value={answers[question.id] ?? null}
            onChange={(answer) => onAnswer(question.id, answer)}
          />
        ))}
      </ul>
    </Card>
  );
}

interface FormButtonsProps {
  position: { index: number; count: number };
  canContinue: boolean;
  isSaving: boolean;
  onBack?: () => void;
  onNext: () => void;
}

function FormButtons({ position, canContinue, isSaving, onBack, onNext }: FormButtonsProps) {
  const t = useTranslations('readiness');
  const isLast = position.index === position.count - 1;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-label text-fg-muted">
        {t('area', { current: position.index + 1, total: position.count })}
      </p>
      <div className="flex gap-2">
        {onBack && (
          <Button color="secondary" onPress={onBack}>
            {t('back')}
          </Button>
        )}
        <Button isDisabled={!canContinue} isLoading={isSaving} onPress={onNext}>
          {t(isLast ? 'seeScore' : 'next')}
        </Button>
      </div>
    </div>
  );
}

export interface ReadinessFormProps {
  /** Earlier answers to start from, for a retake. */
  initial?: Partial<ReadinessAnswers>;
  isSaving: boolean;
  /** An already translated message when saving failed. */
  problem?: string | null;
  onSubmit: (answers: ReadinessAnswers) => void;
  /** Leaves the form from its first area, when the caller has somewhere to go back to. */
  onLeave?: () => void;
}

/** The readiness check one area at a time: a few questions, each answered yes, partly or no. */
export function ReadinessForm({
  initial,
  isSaving,
  problem,
  onSubmit,
  onLeave,
}: ReadinessFormProps) {
  const t = useTranslations('readiness');
  const [answers, setAnswers] = useState<Partial<ReadinessAnswers>>(initial ?? {});
  const [index, setIndex] = useState(() => firstOpenDomain(initial ?? {}));
  const domain = DOMAINS[index]!;
  const { answered, total } = progressOf(answers);

  function next() {
    if (index < DOMAINS.length - 1) setIndex(index + 1);
    else if (isComplete(answers)) onSubmit(answers);
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar
        label={t('progress')}
        value={Math.round((answered / total) * 100)}
        valueText={t('answered', { answered, total })}
      />
      <AreaCard
        domain={domain}
        answers={answers}
        onAnswer={(id, answer) => setAnswers((current) => ({ ...current, [id]: answer }))}
      />
      {problem && <Alert tone="error">{problem}</Alert>}
      <FormButtons
        position={{ index, count: DOMAINS.length }}
        canContinue={unansweredIn(domain, answers) === 0}
        isSaving={isSaving}
        onBack={index > 0 ? () => setIndex(index - 1) : onLeave}
        onNext={next}
      />
    </div>
  );
}
