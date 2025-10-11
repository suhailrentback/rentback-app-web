// app/sign-in/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Brand } from '@/components/Brand';

type Mode = 'magic' | 'otp';
type Lang = 'en' | 'ur';

const copy: Record<Lang, {
  title: string; subtitle: string; email: string;
  getLink: string; or: string; tryOtp: string; otpLabel: string; verify: string;
  backToMagic: string; trouble: string; privacy: string; demo: string;
  toastStub: string; signIn: string;
}> = {
  en: {
    title: 'Sign in',
    subtitle: 'RentBack — secure access',
    email: 'Email address',
    getLink: 'Send magic link',
    or: 'or',
    tryOtp: 'Use OTP instead',
    otpLabel: '6-digit code',
    verify: 'Verify & continue',
    backToMagic: 'Back to Magic Link',
    trouble: 'Trouble signing in?',
    privacy: 'By continuing you agree to our Terms & Privacy.',
    demo: 'Continue in Demo Mode',
    toastStub: 'This is a UI-only stub. Auth is wired next.',
    signIn: 'Sign in',
  },
  ur: {
    title: 'سائن اِن',
    subtitle: 'رینٹ بیک — محفوظ رسائی',
    email: 'ای میل ایڈریس',
    getLink: 'میجک لنک بھیجیں',
    or: 'یا',
    tryOtp: 'او ٹی پی استعمال کریں',
    otpLabel: '6 ہندسوں کا کوڈ',
    verify: 'تصدیق کریں اور جاری رکھیں',
    backToMagic: 'واپس میجک لنک پر',
    trouble: 'سائن اِن میں مسئلہ؟',
    privacy: 'جاری رکھتے ہوئے آپ ہماری شرائط اور پرائیویسی سے متفق ہیں۔',
    demo: 'ڈیمو موڈ میں جاری رکھیں',
    toastStub: 'یہ صرف UI ہے — اگلے مرحلے میں auth جوڑیں گے۔',
    signIn: 'سائن اِن',
  },
};

export default function SignInPage() {
  // Use the global language stored in localStorage by the header
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    try {
      const l = localStorage.getItem('rb-lang');
      if (l === 'en' || l === 'ur') setLang(l);
    } catch {}
  }, []);
  const t = copy[lang];

  const sp = useSearchParams();
  const errorFromUrl = sp.get('error');

  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const dir = useMemo(() => (lang === 'ur' ? 'rtl' : 'ltr'), [lang]);

  function stub(e: React.FormEvent) {
    e.preventDefault();
    alert(t.toastStub);
  }

  return (
    <div className="min-h-[70vh] grid place-items-center" style={{ direction: dir }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Brand />
            <span className="text-xs px-2 py-1 rounded bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              {t.signIn}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm opacity-80">{t.subtitle}</p>

          {errorFromUrl && (
            <div className="mt-4 rounded-lg border border-red-300/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
              {decodeURIComponent(errorFromUrl)}
            </div>
          )}

          {mode === 'magic' ? (
            <form onSubmit={stub} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="block mb-1">{t.email}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="you@example.com"
                />
              </label>

              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {t.getLink}
              </button>

              <div className="text-center text-xs opacity-70">
                {t.or}{' '}
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className="underline underline-offset-4 hover:opacity-100"
                >
                  {t.tryOtp}
                </button>
              </div>

              <p className="text-xs opacity-70">{t.privacy}</p>
            </form>
          ) : (
            <form onSubmit={stub} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="block mb-1">{t.email}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm">
                <span className="block mb-1">{t.otpLabel}</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 outline-none tracking-widest text-center focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="••••••"
                />
              </label>

              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {t.verify}
              </button>

              <div className="text-center text-xs">
                <button
                  type="button"
                  onClick={() => setMode('magic')}
                  className="underline underline-offset-4 hover:opacity-100 opacity-80"
                >
                  {t.backToMagic}
                </button>
              </div>

              <p className="text-xs opacity-70">{t.privacy}</p>
            </form>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs opacity-70">
          <Link href="/help" className="hover:opacity-100">
            {t.trouble}
          </Link>
          <Link href="/demo" className="hover:opacity-100">
            {t.demo}
          </Link>
        </div>
      </div>
    </div>
  );
}
