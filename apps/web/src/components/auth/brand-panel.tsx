import { IconChecklist, IconHistory, IconServer, type Icon } from '@tabler/icons-react';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';

const FEATURES: { id: 'checklist' | 'log' | 'selfHosted'; icon: Icon }[] = [
  { id: 'checklist', icon: IconChecklist },
  { id: 'log', icon: IconHistory },
  { id: 'selfHosted', icon: IconServer },
];

async function FeatureList() {
  const t = await getTranslations('auth.signIn.brand');

  return (
    <ul className="mt-10 flex flex-col gap-6">
      {FEATURES.map(({ id, icon: FeatureIcon }) => (
        <li key={id} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface/10 ring-1 ring-surface/15 ring-inset">
            <FeatureIcon className="size-5" />
          </span>
          <div>
            <p className="text-subtitle font-semibold">{t(`features.${id}.title`)}</p>
            <p className="mt-0.5 text-body text-on-brand/70">{t(`features.${id}.body`)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The left of the sign-in page: what the product is for, on the brand colour. Only wide screens have room for it. */
export async function BrandPanel() {
  const t = await getTranslations('auth.signIn.brand');
  const tMeta = await getTranslations('meta');

  return (
    <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 text-on-brand lg:flex lg:flex-col lg:justify-between lg:p-14">
      {/* A faint grid of dots and a saffron glow give the colour some depth. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:radial-gradient(var(--color-on-brand)_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-accent/25 blur-3xl"
      />
      <div className="relative flex items-center gap-3">
        <BrandMark size="lg" tone="inverse" />
        <span className="text-title font-semibold tracking-tight">{tMeta('title')}</span>
      </div>
      <div className="page-stagger relative max-w-lg">
        <div>
          <h2 className="text-heading font-semibold tracking-tight text-balance">
            {t('headline')}
          </h2>
          <p className="mt-3 text-body text-on-brand/75">{t('subline')}</p>
        </div>
        <FeatureList />
      </div>
      <p className="relative text-label text-on-brand/55">{t('footer')}</p>
    </aside>
  );
}
