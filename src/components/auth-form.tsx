"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/lib/auth/actions";

export function AuthForm({
  mode,
  action
}: {
  mode: "login" | "register";
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const register = mode === "register";
  return (
    <form action={formAction} className="surface w-full max-w-sm p-6">
      <h1 className="text-2xl font-semibold">{register ? "Create account" : "Log in"}</h1>
      <p className="muted mt-2 text-sm">{register ? "Username and password only." : "Use your Skibidi IELTS username."}</p>
      {state.error && <div className="error-box mt-5 text-sm" role="alert">{state.error}</div>}
      <div className="mt-6">
        <label className="label" htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" required minLength={3} maxLength={24} />
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={8} />
      </div>
      {register && <div className="mt-4"><label className="label" htmlFor="confirmPassword">Confirm password</label><input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></div>}
      <button className="btn-primary mt-6 w-full" disabled={pending}>{pending ? (register ? "Creating…" : "Logging in…") : (register ? "Create account" : "Log in")}</button>
      <p className="muted mt-5 text-center text-sm">{register ? <>Already have an account? <Link className="font-medium text-gray-900" href="/login">Log in</Link></> : <>New here? <Link className="font-medium text-gray-900" href="/register">Create account</Link></>}</p>
    </form>
  );
}
