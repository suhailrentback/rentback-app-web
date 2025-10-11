// app/sign-in/page.tsx
import AuthForm from '../../components/AuthForm';
import Brand from '../../components/Brand';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="max-w-md mx-auto pt-10 space-y-6">
      <div className="flex items-center gap-2 text-sm opacity-70">
        <Brand />
        <span>— secure access</span>
      </div>
      <h1 className="text-2xl font-bold">Sign in</h1>
      <AuthForm />
    </div>
  );
}
