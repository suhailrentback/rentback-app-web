// components/SkipLink.tsx
'use client';

import { useI18n } from '@/lib/i18n/index';

export default function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
    >
      {t('a11y.skip')}
    </a>
  );
}
