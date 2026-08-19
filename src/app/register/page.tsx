import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterPage() {
  return <AuthShell title="Create your account" description="No email verification. Pick a username, set a strong password, and start on the Free plan."><Suspense fallback={<Skeleton className="h-96 w-full" />}><AuthForm mode="register" /></Suspense></AuthShell>;
}
