import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = '', ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`animate-pulse rounded-md bg-neutral-800 ${className}`}
      {...rest}
    />
  );
}
