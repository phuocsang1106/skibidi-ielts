"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { ToiletIcon } from "@/components/toilet-icon";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19c.8-3.3 3.1-5 6.5-5s5.7 1.7 6.5 5" />
    </svg>
  );
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" /></svg>;
}
function BookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h9a3 3 0 0 1 3 3V19H8a3 3 0 0 0-3 3V4.5Z" /><path d="M5 19h11.5A2.5 2.5 0 0 1 19 21.5" /></svg>;
}
function PenIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>;
}
function HistoryIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2" /><path d="M4.9 5.5A8 8 0 1 1 4 9" /><path d="M4 4v5h5" /></svg>;
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5.5 5.5v5.7c0 4.2 2.7 7.7 6.5 9.3 3.8-1.6 6.5-5.1 6.5-9.3V5.5L12 3Z" /></svg>;
}

const primaryItems = [
  { href: "/app", label: "Dashboard", icon: HomeIcon },
  { href: "/app/vocabulary", label: "Vocabulary", icon: BookIcon },
  { href: "/app/writing", label: "Writing", icon: PenIcon },
  { href: "/app/history", label: "History", icon: HistoryIcon },
];

export function AppNav({ username, role }: { username: string; role: "USER" | "ADMIN" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => href === "/app" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <aside className="app-sidebar">
        <Link href="/" className="app-brand" aria-label="Go to Skibidi IELTS landing page">
          <ToiletIcon className="app-brand-icon" />
          <span>Skibidi IELTS</span>
        </Link>
        <nav className="app-nav" aria-label="Main navigation">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {role === "ADMIN" && (
            <Link href="/app/admin" className={pathname.startsWith("/app/admin") ? "active" : ""}>
              <ShieldIcon />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="account-wrap">
          {open && (
            <div className="account-menu" role="menu">
              <Link href="/app/settings" role="menuitem" onClick={() => setOpen(false)}>Settings</Link>
              <Link href="/pricing" role="menuitem" onClick={() => setOpen(false)}>Pricing</Link>
              <div className="account-menu-separator" />
              <form action={logoutAction}><button type="submit" role="menuitem">Log out</button></form>
            </div>
          )}
          <button
            type="button"
            className="account-button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="account-main">
              <span className="account-avatar"><UserIcon /></span>
              <span className="account-name">{username}</span>
            </span>
            <span className="account-chevron" aria-hidden="true">{open ? "▲" : "▼"}</span>
          </button>
        </div>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-brand"><ToiletIcon className="app-brand-icon" /><span>Skibidi IELTS</span></Link>
        <Link href="/app/settings" className="mobile-account" aria-label="Account settings"><UserIcon /></Link>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/app" className={pathname === "/app" ? "active" : ""}>Home</Link>
        <Link href="/app/vocabulary" className={pathname.startsWith("/app/vocabulary") ? "active" : ""}>Vocabulary</Link>
        <Link href="/app/writing" className={pathname.startsWith("/app/writing") ? "active" : ""}>Writing</Link>
      </nav>
    </>
  );
}
