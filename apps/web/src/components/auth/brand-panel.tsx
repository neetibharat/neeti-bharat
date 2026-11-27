import { IconCheck } from '@tabler/icons-react';
import { getTranslations } from 'next-intl/server';
import { BrandMark } from '@/components/base/brand-mark/brand-mark';

const FEATURES = ['checklist', 'log', 'selfHosted'] as const;

async function FeatureList() {
  const t = await getTranslations('auth.signIn.brand.features');

  return (
    <ul className="flex flex-col gap-6">
      {FEATURES.map((id) => (
        <li key={id} className="flex gap-4">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-800 text-accent">
            <IconCheck className="size-3.5" stroke={3} aria-hidden />
          </span>
          <div>
            <p className="text-body font-semibold text-brand-50">{t(`${id}.title`)}</p>
            <p className="mt-1 text-label text-brand-300">{t(`${id}.body`)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The sign-in page's navy left side: what the product is for. Only wide screens have room for it. */
export async function BrandPanel() {
  const t = await getTranslations('auth.signIn.brand');
  const tMeta = await getTranslations('meta');

  return (
    <aside className="hidden bg-brand-900 lg:flex lg:flex-col lg:justify-between lg:gap-12 lg:p-14 xl:p-20">
      <div className="flex items-center gap-3">
        <BrandMark size="lg" />
        <span className="text-title font-semibold tracking-tight text-brand-50">
          {tMeta('title')}
        </span>
      </div>
      <div className="flex max-w-xl flex-col gap-12">
        <div>
          <h2 className="text-stat leading-[1.05] font-semibold tracking-tight text-balance text-brand-50">
            {t('headline')}
          </h2>
          <p className="mt-5 max-w-md text-subtitle text-brand-200">{t('subline')}</p>
        </div>
        <FeatureList />
      </div>
      <p className="text-label text-brand-400">{t('footer')}</p>
    </aside>
  );
}
