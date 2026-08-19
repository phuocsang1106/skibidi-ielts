"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronUp, LogOut, Settings, Tag, UserRound } from "lucide-react";

export function UserMenu({ username, placement = "up" }: { username: string; placement?: "up" | "down" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const popupPosition = placement === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]";

  return (
    <div className="relative" ref={ref}>
      {open ? (
        <div className={`absolute ${popupPosition} left-0 right-0 z-40 min-w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg`}>
          <Link onClick={() => setOpen(false)} href="/app/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"><Settings size={16} />Settings</Link>
          <Link onClick={() => setOpen(false)} href="/app/pricing" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"><Tag size={16} />Pricing</Link>
          <form action="/api/auth/logout" method="post"><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-50"><LogOut size={16} />Log out</button></form>
        </div>
      ) : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="focus-ring flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-zinc-100" aria-expanded={open} aria-haspopup="menu">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white"><UserRound size={16} /></span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{username}</span>
        <ChevronUp size={15} className={`${placement === "down" ? "rotate-180" : ""} ${open ? "opacity-60" : ""}`} />
      </button>
    </div>
  );
}
