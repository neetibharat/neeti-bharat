'use client';

import {
  IconAlertTriangle,
  IconDots,
  IconMail,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Avatar } from '@/components/base/avatar/avatar';
import { FormActions } from '@/components/base/form-actions/form-actions';
import { HighlightCard } from '@/components/base/highlight-card/highlight-card';
import { HeroFact, HeroFacts, HeroPanel } from '@/components/base/hero-panel/hero-panel';
import { IconLinkRow } from '@/components/base/icon-link-row/icon-link-row';
import { ProgressBar } from '@/components/base/progress-bar/progress-bar';
import { StatCard } from '@/components/base/stat-card/stat-card';
import { Badge } from '@/components/base/badge/badge';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';
import { Button } from '@/components/base/button/button';
import { Card } from '@/components/base/card/card';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { DropZone } from '@/components/base/drop-zone/drop-zone';
import { EmptyState } from '@/components/base/empty-state/empty-state';
import { Input } from '@/components/base/input/input';
import { Modal } from '@/components/base/modal/modal';
import { Select } from '@/components/base/select/select';
import { SegmentedControl } from '@/components/base/segmented-control/segmented-control';
import { Switch } from '@/components/base/switch/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/base/table/table';
import { Tabs } from '@/components/base/tabs/tabs';
import { Textarea } from '@/components/base/textarea/textarea';
import { Tooltip } from '@/components/base/tooltip/tooltip';

function Section({
  title,
  children,
  bare = false,
}: {
  title: string;
  children: ReactNode;
  /** Skip the surrounding card, for sections that are made of cards themselves. */
  bare?: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-title font-semibold text-fg">{title}</h2>
      {bare ? (
        children
      ) : (
        <Card>
          <div className="flex flex-col gap-5">{children}</div>
        </Card>
      )}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const SWATCHES = [
  ['page', 'bg-page'],
  ['surface', 'bg-surface'],
  ['surface-muted', 'bg-surface-muted'],
  ['line', 'bg-line'],
  ['brand', 'bg-brand'],
  ['brand-hover', 'bg-brand-hover'],
  ['brand-soft', 'bg-brand-soft'],
  ['accent', 'bg-accent'],
  ['accent-soft', 'bg-accent-soft'],
  ['success', 'bg-success'],
  ['danger', 'bg-danger'],
  ['info', 'bg-info'],
  ['fg', 'bg-fg'],
  ['fg-muted', 'bg-fg-muted'],
  ['fg-subtle', 'bg-fg-subtle'],
];

function Colors() {
  return (
    <Section title="Colour tokens">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {SWATCHES.map(([name, className]) => (
          <div key={name}>
            <div className={`h-12 rounded-control border border-line ${className}`} />
            <p className="mt-1 text-caption font-semibold text-fg-muted">{name}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const TYPE_SCALE = [
  ['display', 'text-display font-semibold'],
  ['heading', 'text-heading font-semibold'],
  ['title', 'text-title font-semibold'],
  ['subtitle', 'text-subtitle font-semibold'],
  ['body', 'text-body'],
  ['label', 'text-label font-semibold'],
  ['caption', 'text-caption'],
];

function Typography() {
  return (
    <Section title="Type scale (Geist)">
      {TYPE_SCALE.map(([name, className]) => (
        <p key={name} className={`text-fg ${className}`}>
          {name} · The quick brown fox jumps over the lazy dog
        </p>
      ))}
      <p className="font-mono text-body text-fg">
        mono · dpdp_live_9f3a7c21 · 3a7f09c2e1b4 · breachReportWindow
      </p>
    </Section>
  );
}

function Buttons() {
  return (
    <Section title="Buttons">
      {(['primary', 'secondary', 'soft', 'tertiary', 'danger'] as const).map((color) => (
        <Row key={color}>
          <Button color={color} size="sm">
            Small
          </Button>
          <Button color={color}>Medium</Button>
          <Button color={color} size="lg">
            Large
          </Button>
          <Button color={color} iconLeading={IconPlus}>
            With icon
          </Button>
          <Button color={color} isLoading>
            Loading
          </Button>
          <Button color={color} isDisabled>
            Disabled
          </Button>
        </Row>
      ))}
    </Section>
  );
}

function Fields() {
  return (
    <Section title="Fields">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Default" placeholder="you@company.in" />
        <Input label="With icon" placeholder="Search" iconLeading={IconSearch} />
        <Input label="With hint" placeholder="Name" hint="Shown under the field." />
        <Input label="With error" defaultValue="not-an-email" error="Enter a valid email." />
        <Input label="Disabled" placeholder="Disabled" isDisabled />
        <Select
          label="Select"
          defaultSelectedKey="member"
          options={[
            { id: 'admin', label: 'Admin' },
            { id: 'member', label: 'Member' },
          ]}
        />
      </div>
      <Textarea label="Textarea" placeholder="Write something" hint="Resizes vertically." />
    </Section>
  );
}

function DropZones() {
  return (
    <Section title="Drop zone">
      <div className="grid gap-4 sm:grid-cols-3">
        <DropZone
          label="Drag and drop files here"
          hint="Accepted: PDF, PNG. Up to 25 MB each."
          buttonLabel="Choose files"
          loadingLabel="Uploading…"
          accept={['.pdf', '.png']}
          onFiles={() => undefined}
        />
        <DropZone
          label="Drag and drop files here"
          buttonLabel="Choose files"
          loadingLabel="Uploading…"
          isLoading
          onFiles={() => undefined}
        />
        <DropZone
          label="File storage is not set up"
          buttonLabel="Choose files"
          loadingLabel="Uploading…"
          isDisabled
          onFiles={() => undefined}
        />
      </div>
    </Section>
  );
}

function Selection() {
  return (
    <Section title="Checkbox and switch">
      <Row>
        <Checkbox defaultSelected>Checked</Checkbox>
        <Checkbox>Unchecked</Checkbox>
        <Checkbox isIndeterminate>Indeterminate</Checkbox>
        <Checkbox isDisabled>Disabled</Checkbox>
      </Row>
      <Row>
        <Switch defaultSelected>On</Switch>
        <Switch>Off</Switch>
        <Switch isDisabled>Disabled</Switch>
      </Row>
    </Section>
  );
}

function Feedback() {
  return (
    <Section title="Badges and alerts">
      <Row>
        {(['gray', 'brand', 'success', 'warning', 'danger'] as const).map((color) => (
          <Badge key={color} color={color}>
            {color}
          </Badge>
        ))}
      </Row>
      <Alert tone="info" title="Info">
        Something worth knowing.
      </Alert>
      <Alert tone="success" title="Success">
        It worked.
      </Alert>
      <Alert tone="error" title="Error">
        It did not work.
      </Alert>
    </Section>
  );
}

function Overlays() {
  return (
    <Section title="Modal and tooltip">
      <Row>
        <Modal
          trigger={<Button color="secondary">Open modal</Button>}
          title="Cancel this invitation?"
          description="The person will no longer be able to sign in with it."
        >
          {(close) => (
            <div className="flex justify-end gap-2">
              <Button color="secondary" onPress={close}>
                Keep it
              </Button>
              <Button color="danger" iconLeading={IconTrash} onPress={close}>
                Cancel invitation
              </Button>
            </div>
          )}
        </Modal>
        <Tooltip label="Tooltips explain icon-only buttons">
          <Button color="tertiary" iconLeading={IconMail} aria-label="Mail" />
        </Tooltip>
      </Row>
    </Section>
  );
}

function PeopleTable() {
  return (
    <Table aria-label="People">
      <TableHeader>
        <TableColumn isRowHeader>Email</TableColumn>
        <TableColumn>Role</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>priya@company.in</TableCell>
          <TableCell>Member</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>anil@company.in</TableCell>
          <TableCell>Admin</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function EmptyDemo() {
  return (
    <EmptyState
      icon={IconMail}
      title="Nothing here yet"
      description="Empty states say what is missing and how to fix it."
      action={<Button iconLeading={IconPlus}>Add one</Button>}
    />
  );
}

function SegmentedDemo() {
  const [view, setView] = useState('board');

  return (
    <SegmentedControl
      aria-label="View"
      value={view}
      onChange={setView}
      options={[
        { id: 'board', label: 'Board' },
        { id: 'list', label: 'List' },
      ]}
    />
  );
}

function Navigation() {
  return (
    <Section title="Tabs, segmented control and table">
      <SegmentedDemo />
      <Tabs
        tabs={[
          { id: 'people', label: 'People', content: <PeopleTable /> },
          { id: 'empty', label: 'Empty', content: <EmptyDemo /> },
        ]}
      />
    </Section>
  );
}

function DashboardPieces() {
  return (
    <Section title="Dashboard pieces" bare>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <StatCard
          label="Open requests"
          value="12"
          delta={{ value: '3 this week', direction: 'up', isGood: false }}
          actions={<Button color="secondary" isIconOnly iconLeading={IconDots} aria-label="Menu" />}
        >
          <div className="flex flex-col gap-4">
            <ProgressBar label="Answered in time" value={75} valueText="9 of 12" tone="success" />
            <ProgressBar label="Waiting on a system" value={25} valueText="3 of 12" tone="accent" />
          </div>
        </StatCard>
        <StatCard label="Readiness" value="57%" delta={{ value: '4%', direction: 'up' }} />
        <HighlightCard tag="Insight" figure="75%" title="Controls with proof attached">
          Five more controls need proof before the readiness date.
        </HighlightCard>
      </div>
    </Section>
  );
}

function RowDemos() {
  return (
    <>
      <Card title="Icon link row" description="A list item that opens something.">
        <ul className="flex flex-col gap-2">
          <IconLinkRow
            href="/"
            icon={IconAlertTriangle}
            tone="danger"
            title="Retention policy"
            subtitle="Review overdue by 12 days"
          />
          <IconLinkRow
            href="/"
            icon={IconMail}
            tone="brand"
            title="Breach notice"
            subtitle="Draft"
          />
        </ul>
      </Card>
      <Card variant="dashed" className="flex flex-col items-start gap-3">
        <p className="text-subtitle font-semibold text-fg">Dashed card</p>
        <p className="text-body text-fg-muted">A place where something is yet to be added.</p>
        <ProgressBar label="Done" value={60} showPercent className="w-full" />
      </Card>
      <Card
        title="Form actions"
        description="Cancel and submit, with an optional extra on the left."
      >
        <FormActions
          cancelLabel="Cancel"
          submitLabel="Save"
          onCancel={() => undefined}
          extra={<Button color="tertiary">Archive</Button>}
        />
      </Card>
    </>
  );
}

function RowsAndCards() {
  return (
    <Section title="Rows, forms and panels" bare>
      <div className="grid gap-4 lg:grid-cols-2">
        <RowDemos />
        <HeroPanel
          tag="Readiness"
          percent={64}
          gaugeLabel="64 percent ready"
          title="Nearly there"
          text="Most policies are approved."
        >
          <HeroFacts>
            <HeroFact label="Approved" value="6" />
            <HeroFact label="In review" value="2" />
            <HeroFact label="Overdue" value="1" isAlert />
          </HeroFacts>
        </HeroPanel>
      </div>
    </Section>
  );
}

function Identity() {
  return (
    <Section title="Brand mark and avatar">
      <Row>
        <BrandMark size="sm" />
        <BrandMark />
        <Avatar name="Priya" size="sm" />
        <Avatar name="Priya" />
        <Avatar name="Priya" size="lg" />
      </Row>
    </Section>
  );
}

export function Sections() {
  return (
    <>
      <Colors />
      <Typography />
      <Buttons />
      <Fields />
      <DropZones />
      <Selection />
      <Feedback />
      <Overlays />
      <Navigation />
      <DashboardPieces />
      <RowsAndCards />
      <Identity />
    </>
  );
}
