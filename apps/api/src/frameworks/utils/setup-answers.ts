import type { ProfileEntryResponse, SetupAnswers } from '@dpdp-kit/shared';

/** The three set-up answers, read from the company profile. Anything but "yes" counts as no. */
export function setupAnswersOf(entries: ProfileEntryResponse[]): SetupAnswers {
  const yes = (key: string) => entries.find((entry) => entry.key === key)?.value === 'yes';
  return {
    children: yes('handlesChildrenData'),
    abroad: yes('sendsDataAbroad'),
    sdf: yes('isSignificantFiduciary'),
  };
}
