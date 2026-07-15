import React from 'react';
import { Database, Radio, Shuffle } from 'lucide-react';
import { DATA_SOURCE_CONFIG, getConfiguredDataLabel } from '../../services/config';

interface DataSourceBadgeProps {
  className?: string;
  /**
   * Pass true when the caller knows THIS specific data actually came from
   * a mock/fallback source (e.g. any portfolioItems[].isMockData or
   * transactions[].isMockData is true), regardless of the global
   * VITE_DATA_MODE build config. Without this, the badge only reflects a
   * static config flag and can show "Live API" while the numbers on
   * screen are fabricated fallback data.
   */
  actuallyMock?: boolean;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ className = '', actuallyMock = false }) => {
  const mode = DATA_SOURCE_CONFIG.MODE;
  const label = actuallyMock ? 'Demo Data' : getConfiguredDataLabel();

  const base = 'text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider inline-flex items-center gap-1.5';

  if (actuallyMock) {
    return (
      <span className={`${base} bg-alphabag-yellow/10 text-alphabag-yellow ${className}`}>
        <Database size={11} /> {label}
      </span>
    );
  }

  if (mode === 'LIVE') {
    return (
      <span className={`${base} bg-green-500/10 text-green-400 ${className}`}>
        <Radio size={11} /> {label}
      </span>
    );
  }

  if (mode === 'AUTO') {
    return (
      <span className={`${base} bg-blue-500/10 text-blue-400 ${className}`}>
        <Shuffle size={11} /> {label}
      </span>
    );
  }

  return (
    <span className={`${base} bg-alphabag-yellow/10 text-alphabag-yellow ${className}`}>
      <Database size={11} /> {label}
    </span>
  );
};
