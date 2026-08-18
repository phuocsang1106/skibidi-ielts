import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/app");
  return <main className="container-page flex min-h-screen flex-col items-center justify-center py-12"><Link href="/" className="mb-8 font-semibold">Skibidi IELTS</Link><AuthForm mode="login" action={loginAction} /></main>;
}
