import React from 'react';

interface PremiumBadgeProps {
  isAlpha: boolean;
  isChecking?: boolean;
  className?: string;
}

/**
 * Shows the current Free or Alpha membership status.
 * 
 * States:
 * - Checking: "Verifying..." with spinner
 * - Alpha: "ALPHA" (yellow badge)
 * - Free: "FREE" (gray badge)
 */
export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  isAlpha,
  isChecking = false,
  className = ''
}) => {
  if (isChecking) {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 animate-pulse ${className}`}>
        <div className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
        Verifying...
      </span>
    );
  }

  if (isAlpha) {
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 ${className}`}>
        ALPHA
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 ${className}`}>
      FREE
    </span>
  );
};
