import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div style={{ maxWidth: 760 }}>
      <h1 className="page-title">Settings</h1>
      <section className="product-card" style={{ marginTop: 26 }}>
        <h2 className="section-title">Account</h2>
        <div className="muted" style={{ marginTop: 14, fontSize: 12 }}>Username</div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 680 }}>{user.username}</div>
      </section>
      <div style={{ marginTop: 14 }}><ChangePasswordForm /></div>
      <section className="product-card" style={{ marginTop: 14 }}>
        <h2 className="section-title">Session</h2>
        <form action={logoutAction} style={{ marginTop: 16 }}><button className="btn-secondary">Log out</button></form>
      </section>
    </div>
  );
}
