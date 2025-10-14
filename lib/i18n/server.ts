// lib/i18n/server.ts
import { cookies } from 'next/headers';
import type { Locale } from './dictionaries';

export function getLangFromCookies(): Locale {
  const val = cookies().get('rb_lang')?.value;
  return val === 'ur' ? 'ur' : 'en';
}
