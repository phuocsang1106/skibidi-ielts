"use client";

import { useActionState } from "react";
import { changePasswordAction, type AuthActionState } from "@/lib/auth/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(changePasswordAction, {});
  return <form action={action} className="surface max-w-xl p-5"><h2 className="font-semibold">Change password</h2>{state.error && <div className="error-box mt-4 text-sm" role="alert">{state.error}</div>}{!state.error && !pending && state && Object.keys(state).length === 0 ? null : null}<div className="mt-5"><label className="label" htmlFor="currentPassword">Current password</label><input className="input" id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required minLength={8} /></div><div className="mt-4"><label className="label" htmlFor="newPassword">New password</label><input className="input" id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} /></div><div className="mt-4"><label className="label" htmlFor="confirmPassword">Confirm new password</label><input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></div><button className="btn-primary mt-5" disabled={pending}>{pending ? "Saving…" : "Change password"}</button></form>;
}
