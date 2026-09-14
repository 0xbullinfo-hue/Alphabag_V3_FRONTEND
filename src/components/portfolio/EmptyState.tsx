import { Plus, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-12 text-center">
      <div className="mb-4 rounded-full bg-neutral-800 p-3">
        <Icon className="h-6 w-6 text-neutral-400" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-400">{description}</p>
      <button
        type="button"
        onClick={onCta}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
      >
        <Plus className="h-4 w-4" aria-hidden /> {ctaLabel}
      </button>
    </div>
  );
}
