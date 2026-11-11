'use client';

import { IconMenu2 } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';
import { Button } from '@/components/base/button/button';
import { usePathname } from '@/i18n/navigation';
import { ProductName } from './product-name';

/** The top bar on small screens. Its menu button opens the sidebar as a drawer. */
export function MobileBar({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  // Remembering where it was opened closes the drawer by itself when a link in it changes the page.
  const [openedOn, setOpenedOn] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
      <ProductName />
      <DialogTrigger
        isOpen={openedOn === pathname}
        onOpenChange={(isOpen) => setOpenedOn(isOpen ? pathname : null)}
      >
        <Button color="tertiary" isIconOnly iconLeading={IconMenu2} aria-label={t('openMenu')} />
        <ModalOverlay
          isDismissable
          className="fixed inset-0 z-50 bg-overlay entering:animate-fade-in exiting:animate-fade-out"
        >
          <Modal className="fixed inset-y-0 left-0 w-80 max-w-[92vw] bg-surface shadow-popover entering:animate-slide-in-left exiting:animate-slide-out-left">
            <Dialog aria-label={t('label')} className="h-full outline-none">
              {children}
            </Dialog>
          </Modal>
        </ModalOverlay>
      </DialogTrigger>
    </header>
  );
}
