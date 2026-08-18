import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/app");
  return <main className="container-page flex min-h-screen flex-col items-center justify-center py-12"><Link href="/" className="mb-8 font-semibold">Skibidi IELTS</Link><AuthForm mode="register" action={registerAction} /></main>;
}
