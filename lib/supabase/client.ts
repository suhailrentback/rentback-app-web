// WEB: lib/supabase/client.ts
// Wave 1.1 stub — object-shaped client to match current AuthForm usage.
// Purpose: Keep Vercel green without real Supabase wiring (Wave 1.2 will replace).

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

export type SupabaseClientStub = {
  auth: SupabaseAuthStub;
};

const notReadyMsg = 'Auth not wired yet (Wave 1.2).';

const auth: SupabaseAuthStub = {
  async signInWithOtp(_args) {
    if (typeof window !== 'undefined') {
      console.warn(notReadyMsg);
      // Optional UX: you can show a toast here if you have a global toaster
      // but we avoid any UI changes in Wave 1.1.
    }
    return { data: null, error: { message: notReadyMsg } };
  },
  async signOut() {
    return { error: null };
  },
};

/**
 * The object your components expect:
 *   supabaseClient.auth.signInWithOtp(...)
 */
export const supabaseClient: SupabaseClientStub = { auth };

// Transitional aliases in case any code uses other names.
// (Safe to keep; Wave 1.2 will replace with the real client.)
export const supabase = supabaseClient;
export default supabaseClient;
