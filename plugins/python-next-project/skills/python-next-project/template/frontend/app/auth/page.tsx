import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AppLogo } from "@/components/app-logo";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center gap-2">
          <AppLogo className="size-7" />
          <span className="text-sm font-semibold tracking-tight">myapp</span>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
