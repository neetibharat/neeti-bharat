'use client';

import { IconSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button as AriaButton,
  Collection,
  Dialog,
  DialogTrigger,
  Header,
  Input,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Modal,
  ModalOverlay,
  SearchField,
} from 'react-aria-components';
import { Button } from '@/components/base/button/button';
import { useCan } from '@/components/providers/user-provider';
import { useRouter } from '@/i18n/navigation';
import { isSearchShortcut } from '@/lib/search';
import type { SearchGroup, SearchItem } from '@/lib/search-groups';
import { useSearchItems } from './use-search-items';

export interface GlobalSearchProps {
  /** A wide box with the shortcut shown, or just an icon. */
  variant: 'box' | 'icon';
}

/** Search for a page or a record from anywhere. Ctrl or Cmd with K opens it from the box. */
export function GlobalSearch({ variant }: GlobalSearchProps) {
  const t = useTranslations('search');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (variant !== 'box') return;
    const onKey = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant]);

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      {variant === 'box' ? (
        <SearchBox label={t('trigger')} />
      ) : (
        <Button color="tertiary" isIconOnly iconLeading={IconSearch} aria-label={t('open')} />
      )}
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-start justify-center bg-overlay p-4 pt-[12vh] entering:animate-fade-in exiting:animate-fade-out"
      >
        <Modal className="w-full max-w-xl overflow-hidden rounded-card border border-line bg-surface shadow-popover outline-none entering:animate-pop-in">
          <Dialog aria-label={t('label')} className="outline-none">
            <SearchPanel onDone={() => setOpen(false)} />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

function SearchBox({ label }: { label: string }) {
  const mac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  return (
    <AriaButton className="flex h-10 w-full max-w-md cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 text-body text-fg-subtle outline-none transition hover:bg-surface-muted focus-visible:focus-ring">
      <IconSearch className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">{label}</span>
      <kbd className="rounded-sm border border-line px-1.5 text-caption text-fg-muted">
        {mac ? '⌘' : 'Ctrl'} K
      </kbd>
    </AriaButton>
  );
}

function SearchPanel({ onDone }: { onDone: () => void }) {
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const who = useCan();
  const { groups, searching, active, remember } = useSearchItems(query, who);
  const items = groups.flatMap((group) => group.items);

  function go(key: string | number) {
    const item = items.find((entry) => entry.key === key);
    if (!item) return;
    remember(item);
    onDone();
    router.push(item.href);
  }

  return (
    <Autocomplete inputValue={query} onInputChange={setQuery} filter={() => true}>
      <SearchInput label={t('label')} placeholder={t('placeholder')} />
      <ListBox
        aria-label={t('label')}
        items={groups}
        onAction={go}
        renderEmptyState={() => (
          <p className="px-4 py-6 text-center text-body text-fg-muted">
            {searching ? '' : active ? t('empty') : t('hint')}
          </p>
        )}
        className="max-h-[50vh] overflow-y-auto p-2 outline-none"
      >
        {(group) => <ResultGroup group={group} />}
      </ListBox>
    </Autocomplete>
  );
}

function SearchInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <SearchField autoFocus aria-label={label} className="border-b border-line">
      <div className="flex items-center gap-3 px-4">
        <IconSearch className="size-5 shrink-0 text-fg-subtle" />
        <Input
          placeholder={placeholder}
          className="h-12 w-full bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle"
        />
      </div>
    </SearchField>
  );
}

function ResultGroup({ group }: { group: SearchGroup }) {
  const t = useTranslations('search.groups');

  return (
    <ListBoxSection id={group.id} className="mb-1">
      <Header className="px-3 pt-2 pb-1 text-caption font-semibold tracking-wide text-fg-subtle uppercase">
        {t(group.id)}
      </Header>
      <Collection items={group.items}>{(item) => <ResultRow item={item} />}</Collection>
    </ListBoxSection>
  );
}

function ResultRow({ item }: { item: SearchItem }) {
  const ItemIcon = item.icon;

  return (
    <ListBoxItem
      id={item.key}
      textValue={item.title}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-body text-fg outline-none data-focused:bg-brand-soft"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
        <ItemIcon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.title}</span>
        {item.detail && (
          <span className="block truncate text-caption text-fg-subtle">{item.detail}</span>
        )}
      </span>
      <span className="shrink-0 text-caption text-fg-subtle">{item.tag}</span>
    </ListBoxItem>
  );
}
