import Link from "next/link";

const nav = [
  ["Dashboard", "/app"],
  ["Vocabulary", "/app/vocabulary"],
  ["Writing", "/app/writing"],
  ["History", "/app/history"]
] as const;

export function AppNav({ username, admin }: { username: string; admin: boolean }) {
  return <>
    <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-gray-200 bg-white md:flex md:flex-col">
      <Link href="/app" className="border-b border-gray-100 px-5 py-5 font-semibold">Skibidi IELTS</Link>
      <nav className="flex-1 p-3" aria-label="Application navigation">{nav.map(([label, href]) => <Link key={href} href={href} className="block rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">{label}</Link>)}{admin && <Link href="/app/admin" className="mt-2 block rounded-md px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50">Admin</Link>}</nav>
      <div className="border-t border-gray-100 p-4"><div className="truncate text-sm font-medium">{username}</div><Link href="/app/settings" className="mt-1 block text-sm text-gray-500 hover:text-black">Settings</Link></div>
    </aside>
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white md:hidden"><div className="flex h-14 items-center justify-between px-4"><Link href="/app" className="font-semibold">Skibidi IELTS</Link><div className="flex items-center gap-4 text-sm"><Link href="/app/history">History</Link><Link href="/app/settings">Settings</Link>{admin && <Link href="/app/admin">Admin</Link>}</div></div></header>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-gray-200 bg-white md:hidden" aria-label="Primary mobile navigation"><Link className="flex min-h-14 items-center justify-center text-sm font-medium" href="/app">Home</Link><Link className="flex min-h-14 items-center justify-center text-sm font-medium" href="/app/vocabulary">Vocabulary</Link><Link className="flex min-h-14 items-center justify-center text-sm font-medium" href="/app/writing">Writing</Link></nav>
  </>;
}
