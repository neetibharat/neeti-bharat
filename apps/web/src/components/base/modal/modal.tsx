'use client';

import type { ReactElement, ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
} from 'react-aria-components';

export interface ModalProps {
  /** The button that opens the dialog. */
  trigger: ReactElement;
  title: string;
  description?: string;
  /** Open as soon as it shows, for a page that was opened to add something. */
  defaultOpen?: boolean;
  /** `lg` for dialogs with a longer form, `xl` for two columns side by side, `2xl` for two columns that each need room. */
  size?: 'md' | 'lg' | 'xl' | '2xl';
  /** Receives `close` so the content can dismiss the dialog. */
  children: (close: () => void) => ReactNode;
}

const WIDTHS = { md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-4xl', '2xl': 'max-w-5xl' } as const;

export function Modal(props: ModalProps) {
  const { trigger, title, description, size = 'md', defaultOpen, children } = props;
  return (
    <DialogTrigger defaultOpen={defaultOpen}>
      {trigger}
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 entering:animate-fade-in exiting:animate-fade-out"
      >
        <AriaModal
          className={`flex max-h-[calc(100dvh-2rem)] w-full ${WIDTHS[size]} flex-col rounded-card bg-surface shadow-popover outline-none entering:animate-pop-in`}
        >
          <Dialog className="flex min-h-0 flex-col outline-none">
            {({ close }) => (
              <>
                <header className="shrink-0 px-6 pt-6 pb-4">
                  <Heading slot="title" className="text-title font-semibold text-fg">
                    {title}
                  </Heading>
                  {description && <p className="mt-1 text-body text-fg-muted">{description}</p>}
                </header>
                <div className="min-h-0 overflow-y-auto px-6 pb-6">{children(close)}</div>
              </>
            )}
          </Dialog>
        </AriaModal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
