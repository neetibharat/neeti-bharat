'use client';

import type { MyWorkload, PersonResponse } from '@dpdp-kit/shared';
import { useFormatter, useTranslations } from 'next-intl';
import { Avatar } from '@/components/base/avatar/avatar';
import { Badge } from '@/components/base/badge/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { EditPersonButton } from './edit-person-button';
import { LeavePersonButton } from './leave-person-button';
import { PersonAccess } from './person-access';
import { PersonWork } from './person-work';

function Head() {
  const t = useTranslations('people.columns');

  return (
    <TableHeader>
      <TableColumn isRowHeader>{t('person')}</TableColumn>
      <TableColumn>{t('access')}</TableColumn>
      <TableColumn>{t('roles')}</TableColumn>
      <TableColumn>{t('work')}</TableColumn>
      <TableColumn>{t('status')}</TableColumn>
      <TableColumn>
        <span className="sr-only">{t('actions')}</span>
      </TableColumn>
    </TableHeader>
  );
}

function PersonRow({ person, work }: { person: PersonResponse; work?: MyWorkload }) {
  return (
    <TableRow>
      <TableCell>
        <PersonCell person={person} />
      </TableCell>
      <TableCell>
        <PersonAccess person={person} />
      </TableCell>
      <TableCell>
        <RoleBadges person={person} />
      </TableCell>
      <TableCell>
        <PersonWork personId={person.id} work={work} />
      </TableCell>
      <TableCell>
        <StatusBadge person={person} />
      </TableCell>
      <TableCell>
        <RowActions person={person} />
      </TableCell>
    </TableRow>
  );
}

export function PeopleTable(props: { people: PersonResponse[]; work: Map<string, MyWorkload> }) {
  const t = useTranslations('people.columns');

  return (
    <Table aria-label={t('person')}>
      <Head />
      <TableBody>
        {props.people.map((person) => (
          <PersonRow key={person.id} person={person} work={props.work.get(person.id)} />
        ))}
      </TableBody>
    </Table>
  );
}

function PersonCell({ person }: { person: PersonResponse }) {
  const detail = [person.jobTitle, person.department].filter(Boolean).join(' · ');
  return (
    <div className="flex items-center gap-3">
      <Avatar name={person.name} />
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{person.name}</p>
        <p className="truncate text-caption text-fg-subtle">{person.email}</p>
        {detail && <p className="truncate text-caption text-fg-subtle">{detail}</p>}
      </div>
    </div>
  );
}

function RoleBadges({ person }: { person: PersonResponse }) {
  const t = useTranslations('jobRoles');
  const none = useTranslations('people')('noRoles');
  if (!person.roles.length) return <span className="text-fg-subtle">{none}</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {person.roles.map((role) => (
        <Badge key={role} color="brand">
          {t(role)}
        </Badge>
      ))}
    </div>
  );
}

function StatusBadge({ person }: { person: PersonResponse }) {
  const t = useTranslations('people');
  const format = useFormatter();
  if (person.status === 'active' && person.invited)
    return <Badge color="warning">{t('status.invited')}</Badge>;
  if (person.status === 'active') return <Badge color="success">{t('status.active')}</Badge>;
  const date = person.leftAt
    ? format.dateTime(new Date(person.leftAt), { dateStyle: 'medium' })
    : '';
  return <Badge>{t('leftOn', { date })}</Badge>;
}

/** Left people can no longer be changed: they stay on record, and that is all. */
function RowActions({ person }: { person: PersonResponse }) {
  if (person.status === 'left') return null;
  return (
    <div className="flex justify-end gap-1">
      <EditPersonButton person={person} />
      <LeavePersonButton person={person} />
    </div>
  );
}
