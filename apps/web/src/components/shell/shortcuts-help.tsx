'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { OPEN_SHORTCUTS_EVENT, SHORTCUTS, isHelpShortcut } from '@/lib/shortcuts';

const isMac = () => typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

/** Opens on "?" and on the event the account menu sends. */
function useShortcutsOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isHelpShortcut(event, event.target as HTMLElement | null)) return;
      event.preventDefault();
      setOpen(true);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpen);
    };
  }, []);

  return [open, setOpen];
}

function ShortcutRow({ shortcut }: { shortcut: (typeof SHORTCUTS)[number] }) {
  const t = useTranslations('shortcuts.items');

  return (
    <li className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-body text-fg">{t(shortcut.id)}</span>
      <span className="flex gap-1">
        {shortcut.keys.map((key) => (
          <kbd
            key={key}
            className="rounded-sm border border-line-strong bg-surface-muted px-1.5 text-caption text-fg-muted"
          >
            {key === 'mod' ? (isMac() ? '⌘' : 'Ctrl') : key}
          </kbd>
        ))}
      </span>
    </li>
  );
}

/** The keyboard shortcuts, opened with "?" or from the account menu. */
export function ShortcutsHelp() {
  const t = useTranslations('shortcuts');
  const [open, setOpen] = useShortcutsOpen();

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 entering:animate-fade-in exiting:animate-fade-out"
    >
      <Modal className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-popover outline-none entering:animate-pop-in">
        <Dialog className="outline-none">
          <Heading slot="title" className="text-title font-semibold text-fg">
            {t('title')}
          </Heading>
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {SHORTCUTS.map((shortcut) => (
              <ShortcutRow key={shortcut.id} shortcut={shortcut} />
            ))}
          </ul>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
