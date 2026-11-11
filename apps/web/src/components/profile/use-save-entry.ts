'use client';

import { useUpdateProfileEntryMutation } from '@/lib/api/profile-api';

/** Saves one answer. `save` says whether it worked, so a dialog knows whether to close. */
export function useSaveEntry(key: string) {
  const [update, { isLoading, error }] = useUpdateProfileEntryMutation();

  async function save(value: string, confirmed?: boolean): Promise<boolean> {
    const result = await update({ key, value, confirmed });
    return !('error' in result);
  }

  return { save, isSaving: isLoading, error };
}
