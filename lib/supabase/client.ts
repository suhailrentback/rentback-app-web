// WEB: lib/supabase/client.ts
// Wave 1.1 stub — satisfies TypeScript and keeps Vercel green.
// We will replace this with the real Supabase client in Wave 1.2.

type SignInWithOtpArgs = {
  email: string;
  options?: Record<string, any>;
};

type SignInWithOtpResult = {
  data: null;
  error: { message: string } | null;
};

type SignOutResult = {
  error: { message: string } | null;
};

type SupabaseAuthStub = {
  signInWithOtp(args: SignInWithOtpArgs): Promise<SignInWithOtpResult>;
  signOut(): Promise<SignOutResult>;
};

type SupabaseClientStub = {
  auth: SupabaseAuthStub;
};

/**
 * Exported API expected by components:
 *   const sb = supabaseClient();
 *   await sb.auth.signInWithOtp({ email })
 */
export function supabaseClient(): SupabaseClientStub {
  const notReady = 'Auth not wired yet (Wave 1.2).';

  const auth: SupabaseAuthStub = {
    async signInWithOtp(_args) {
      if (typeof window !== 'undefined') {
        // Non-blocking notice to avoid silent clicks in dev.
        // No visual change unless the user clicks the button.
        console.warn(notReady);
      }
      return { data: null, error: { message: notReady } };
    },
    async signOut() {
      return { error: null };
    },
  };

  return { auth };
}

// Optional convenience export if someone imports a ready client elsewhere.
// (Does not change behavior; kept for compatibility.)
export const supabase = supabaseClient();
