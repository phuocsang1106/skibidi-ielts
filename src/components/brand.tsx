import Link from "next/link";

export function ToiletIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3.5h9.2c1.1 0 2 .9 2 2V9H6V3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M5 9h14c0 3.8-1.9 6.6-5.3 7.6v2.1h2.1V21H9.2v-2.3h2.1v-2.1C7.8 15.7 5.4 13 5 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M17.2 6.2h1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight"><ToiletIcon size={22}/>{!compact && <span>Skibidi IELTS</span>}</Link>;
}
