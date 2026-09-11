/** Consistent empty / error / loading primitives. Never show $0.00 for unknown. */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-800/60 ${className}`} aria-hidden />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center">
      <p className="text-sm font-medium text-neutral-200">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-neutral-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm">
      <p className="text-red-300">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-2 text-xs underline text-red-300/80">Try again</button>}
    </div>
  );
}

/** Renders an em-dash for missing values instead of a misleading $0.00. */
export function Money({ value, className = '' }: { value?: number | null; provenance?: unknown; className?: string }) {
  if (value == null || Number.isNaN(value)) {
    return <span className={`text-neutral-600 ${className}`} title="No data available">—</span>;
  }
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {value < 0 ? '-' : ''}${abs.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
    </span>
  );
}