import Link from "next/link";
import { Brand } from "@/components/brand";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="grid min-h-screen place-items-center px-4 py-10"><div className="w-full max-w-sm"><div className="mb-8 text-center"><Brand/></div><div className="surface p-6 sm:p-7"><h1 className="text-xl font-semibold">Log in</h1><p className="mt-1 text-sm text-zinc-500">Continue your IELTS practice.</p>{error&&<p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<form action="/api/auth/login" method="post" className="mt-5 space-y-4"><div><label className="label" htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required/></div><div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required/></div><button className="btn btn-primary w-full">Log in</button></form><p className="mt-5 text-center text-sm text-zinc-500">New here? <Link className="font-semibold text-zinc-900" href="/register">Create an account</Link></p></div></div></main>;
}
