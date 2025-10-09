import Brand from '@/components/Brand';

export default function SignInPlaceholder() {
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Brand />
        <h1 className="text-2xl font-bold">Sign in</h1>
      </div>
      <p className="mt-4 opacity-80">
        This is a placeholder screen. We’ll wire Supabase Auth in the next steps.
      </p>
    </div>
  );
}
