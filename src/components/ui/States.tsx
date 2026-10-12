/** Consistent empty / error / loading primitives. Never show $0.00 for unknown. */
import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#202630] ${className}`} aria-hidden />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-[#2B313A] bg-[#181A20] px-6 py-10 text-center">
      <p className="text-xs font-semibold text-alphabag-text">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-alphabag-subtext leading-relaxed">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-alphabag-red">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1.5 text-xs underline text-rose-300 hover:text-white">
          Try again
        </button>
      )}
    </div>
  );
}

/** Renders an em-dash for missing values instead of a misleading $0.00. */
export function Money({ value, className = '' }: { value?: number | null; provenance?: unknown; className?: string }) {
  if (value == null || Number.isNaN(value)) {
    return <span className={`text-alphabag-subtext/50 ${className}`} title="No data available">—</span>;
  }
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return (
    <span className={`num ${className}`}>
      {value < 0 ? '-' : ''}${abs.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
    </span>
  );
}