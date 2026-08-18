import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return <div><h1 className="text-2xl font-semibold">Settings</h1><p className="muted mt-2">Signed in as {user.username}</p><div className="mt-7"><ChangePasswordForm /></div><section className="surface mt-5 max-w-xl p-5"><h2 className="font-semibold">Session</h2><form action={logoutAction} className="mt-4"><button className="btn-secondary">Log out</button></form></section></div>;
}
