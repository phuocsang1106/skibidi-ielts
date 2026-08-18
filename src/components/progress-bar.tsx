export function ProgressBar({ value, max }: { value: number; max: number }) {
  const safeMax = Math.max(0, max);
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const percent = safeMax > 0 ? Math.min(100, Math.round((safeValue / safeMax) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={`${percent}% complete`}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      className="h-1.5 overflow-hidden rounded-full bg-gray-100"
    >
      <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
    </div>
  );
}
