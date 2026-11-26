'use client';

import type { ProfileEntryResponse } from '@neeti-bharat/shared';
import { useState } from 'react';
import { useUpdateProfileEntryMutation } from '@/lib/api/profile-api';
import {
  changedAnswers,
  draftsFrom,
  invalidAnswers,
  withFallbacks,
  type Drafts,
} from '@/lib/answer-drafts';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/**
 * Company answers being filled in on one step: what has been typed, which of it is not acceptable, and a way to save
 * only what changed. `save` says whether it worked, so the step knows whether to move on.
 */
export function useAnswers(
  entries: ProfileEntryResponse[],
  keys: readonly string[],
  fallbacks: Drafts = {},
) {
  const errorMessage = useErrorMessage();
  const [drafts, setDrafts] = useState<Drafts>(() =>
    withFallbacks(draftsFrom(entries, keys), fallbacks),
  );
  const [update, { isLoading, error }] = useUpdateProfileEntryMutation();
  const invalid = invalidAnswers(drafts, entries);

  async function save(): Promise<boolean> {
    const trimmed = Object.fromEntries(
      Object.entries(drafts).map(([key, value]) => [key, value.trim()]),
    );
    for (const [key, value] of Object.entries(changedAnswers(trimmed, entries))) {
      const result = await update({ key, value });
      if ('error' in result) return false;
    }
    return true;
  }

  return {
    drafts,
    set: (key: string, value: string) => setDrafts((current) => ({ ...current, [key]: value })),
    invalid,
    save,
    isSaving: isLoading,
    problem: error ? errorMessage(error) : null,
  };
}
