import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return <AuthShell title="Welcome back" description="Login with your username and password to continue learning."><Suspense fallback={<Skeleton className="h-72 w-full" />}><AuthForm mode="login" /></Suspense></AuthShell>;
}
