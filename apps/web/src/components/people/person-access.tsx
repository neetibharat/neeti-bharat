'use client';

import type { AppRole, PersonResponse } from '@neeti-bharat/shared';
import { Alert } from '@/components/base/alert/alert';
import { useSetAccessMutation } from '@/lib/api/people-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';
import { AccessSelect } from './access-select';

/** A person's access, changed in place. */
export function PersonAccess({ person }: { person: PersonResponse }) {
  const errorMessage = useErrorMessage();
  const [setAccess, { error }] = useSetAccessMutation();

  return (
    <div className="flex flex-col gap-1">
      <AccessSelect
        className="w-36"
        value={person.access}
        isDisabled={person.status === 'left'}
        onChange={(access: AppRole) => void setAccess({ id: person.id, access })}
      />
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
    </div>
  );
}
