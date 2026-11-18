'use client';

import { IconHelpCircle } from '@tabler/icons-react';
import { Button } from '@/components/base/button/button';

/** Opens the setup guide, which takes the place of the form. */
export function GuideButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      className="self-start"
      color="tertiary"
      size="sm"
      iconLeading={IconHelpCircle}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
