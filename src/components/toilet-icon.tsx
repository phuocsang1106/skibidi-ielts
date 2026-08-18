export function ToiletIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6.5" y="3" width="8" height="5" rx="1.2" />
      <path d="M8 8v2.2c0 3.7 2.5 6.3 6 6.3h1.5" />
      <path d="M8 10.2h9.2c.4 0 .7.3.7.7 0 3.1-2.4 5.6-5.5 5.6H11" />
      <path d="M12.5 16.5v3.2M9.7 19.7h6" />
    </svg>
  );
}
