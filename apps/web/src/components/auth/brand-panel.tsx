import { IconChecklist, IconHistory, IconServer, type Icon } from '@tabler/icons-react';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';

const FEATURES: { id: 'checklist' | 'log' | 'selfHosted'; icon: Icon }[] = [
  { id: 'checklist', icon: IconChecklist },
  { id: 'log', icon: IconHistory },
  { id: 'selfHosted', icon: IconServer },
];

const STEPS = ['law', 'control', 'proof'] as const;

/** One link in the chain from the Act to what an auditor sees: the law, the control that answers it, the proof behind it. */
async function Step({ id, index }: { id: (typeof STEPS)[number]; index: number }) {
  const t = await getTranslations('auth.signIn.brand.chain');

  return (
    <li className="relative flex flex-col gap-1.5 px-5 py-4">
      <div className="flex items-center justify-between gap-3 font-mono text-caption tracking-wide text-fg-subtle uppercase">
        <span>
          {String(index + 1).padStart(2, '0')} · {t(`${id}.label`)}
        </span>
        <span>{t(`${id}.tag`)}</span>
      </div>
      <p className="text-subtitle font-semibold text-fg">{t(`${id}.title`)}</p>
      <p className="text-label text-fg-muted">{t(`${id}.text`)}</p>
    </li>
  );
}

/** What the product does in three steps, as the screens show it. */
async function Chain() {
  return (
    <ol className="divide-y divide-line/70 overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
      {STEPS.map((id, index) => (
        <Step key={id} id={id} index={index} />
      ))}
    </ol>
  );
}

async function FeatureList() {
  const t = await getTranslations('auth.signIn.brand');

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {FEATURES.map(({ id, icon: FeatureIcon }) => (
        <li key={id} className="flex items-center gap-2 text-label text-fg-muted">
          <FeatureIcon className="size-4 text-brand" aria-hidden />
          {t(`features.${id}.title`)}
        </li>
      ))}
    </ul>
  );
}

/** A faint grid with a few tinted squares, the same ground as the website, so the app opens where the site leaves off. */
function Ground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_95%)]" />
      <div className="absolute top-[14%] left-[8%] size-16 bg-brand-soft ring-1 ring-brand-line/40 ring-inset" />
      <div className="absolute top-[52%] left-[3%] size-16 bg-surface-sunken" />
      <div className="absolute right-[10%] bottom-[16%] size-16 bg-accent-soft ring-1 ring-accent/20 ring-inset" />
      <div className="absolute top-[10%] right-[26%] size-16 bg-surface-sunken" />
    </div>
  );
}

/** The sign-in page's backdrop and its left side: what the product is for. Only wide screens have room for the left side. */
export async function BrandPanel() {
  const t = await getTranslations('auth.signIn.brand');
  const tMeta = await getTranslations('meta');

  return (
    <>
      <Ground />
      <aside className="relative hidden lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-14 xl:p-20">
        <div className="flex items-center gap-3">
          <BrandMark size="lg" />
          <span className="text-title font-semibold tracking-tight text-fg">{tMeta('title')}</span>
        </div>
        <div className="page-stagger flex max-w-xl flex-col gap-8">
          <div>
            <p className="flex items-center gap-2 font-mono text-caption tracking-wide text-fg-muted uppercase">
              <span className="size-2 bg-accent" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 className="mt-4 text-stat leading-[1.05] font-semibold tracking-tight text-balance text-fg">
              {t('headlineLead')} <span className="text-brand/70">{t('headlineAccent')}</span>
            </h2>
            <p className="mt-4 max-w-md text-subtitle text-fg-muted">{t('subline')}</p>
          </div>
          <Chain />
          <FeatureList />
        </div>
        <p className="font-mono text-caption tracking-wide text-fg-subtle uppercase">
          {t('footer')}
        </p>
      </aside>
    </>
  );
}
