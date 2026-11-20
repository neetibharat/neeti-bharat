'use client';

import { IconSparkles } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Alert } from '@/components/base/alert/alert';
import { Button } from '@/components/base/button/button';
import { Modal } from '@/components/base/modal/modal';
import { useGetAiSettingsQuery } from '@/lib/api/ai-api';
import { useErrorMessage } from '@/lib/hooks/use-error-message';

/** What a mutation hands back: the answer, or the reason there is none. */
type Outcome<T> = { data: T; error?: undefined } | { data?: undefined; error: unknown };

type State<T> =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'failed'; error: unknown }
  | { status: 'done'; data: T };

export interface AiDialogProps<T> {
  trigger: ReactElement;
  title: string;
  /** What this does, in a sentence or two. */
  intro: string;
  /** What leaves the app, in words, such as "the text of this policy". It is shown before anything is sent. */
  sends: string;
  /** Something to fill in before running, such as a note about the company. It sits above the notice. */
  before?: ReactNode;
  run: () => Promise<Outcome<T>>;
  /** What to show once the AI has answered. It brings its own buttons, and can ask to start again. */
  children: (result: T, close: () => void, retry: () => void) => ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl';
}

/** Says where the words go, with the company's own service and model, before the person chooses to send them. */
function SendsNotice({ sends }: { sends: string }) {
  const t = useTranslations('aiTools');
  const tProviders = useTranslations('ai.providers');
  const { data } = useGetAiSettingsQuery();
  if (!data?.provider) return null;

  return (
    <Alert>
      {t('sends', {
        what: sends,
        provider: tProviders(data.provider),
        model: data.model ?? '',
      })}
    </Alert>
  );
}

function Asking<T>(props: AiDialogProps<T> & { close: () => void }) {
  const t = useTranslations('aiTools');
  const errorMessage = useErrorMessage();
  const [state, setState] = useState<State<T>>({ status: 'idle' });

  async function start() {
    setState({ status: 'running' });
    const outcome = await props.run();
    setState(
      'error' in outcome
        ? { status: 'failed', error: outcome.error }
        : { status: 'done', data: outcome.data },
    );
  }

  if (state.status === 'done') {
    return <>{props.children(state.data, props.close, () => setState({ status: 'idle' }))}</>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-fg-muted">{props.intro}</p>
      {props.before}
      <SendsNotice sends={props.sends} />
      {state.status === 'failed' && <Alert tone="error">{errorMessage(state.error)}</Alert>}
      <div className="flex justify-end gap-2">
        <Button color="secondary" onPress={props.close}>
          {t('cancel')}
        </Button>
        <Button iconLeading={IconSparkles} isLoading={state.status === 'running'} onPress={start}>
          {state.status === 'running'
            ? t('running')
            : state.status === 'failed'
              ? t('again')
              : t('run')}
        </Button>
      </div>
      {state.status === 'running' && <p className="text-label text-fg-subtle">{t('wait')}</p>}
    </div>
  );
}

/**
 * A dialog that asks the company's AI to do one thing. It says what it will send, waits for the person to say go, and
 * shows the answer. Nothing is saved by it: a result that can be used offers its own button for that.
 */
export function AiDialog<T>(props: AiDialogProps<T>) {
  return (
    <Modal trigger={props.trigger} title={props.title} size={props.size ?? 'lg'}>
      {(close) => <Asking {...props} close={close} />}
    </Modal>
  );
}
