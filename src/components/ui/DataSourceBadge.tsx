import React from 'react';
import { Database, Radio, Shuffle } from 'lucide-react';
import { DATA_SOURCE_CONFIG, getConfiguredDataLabel } from '../../services/config';

interface DataSourceBadgeProps {
  source?: 'LIVE' | 'MOCK' | 'CACHED';
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

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source, className = '', actuallyMock = false }) => {
  const activeSource = actuallyMock ? 'MOCK' : (source || (DATA_SOURCE_CONFIG.MODE === 'AUTO' ? 'MOCK' : DATA_SOURCE_CONFIG.MODE));
  const label = activeSource === 'LIVE' ? 'Live API' : activeSource === 'CACHED' ? 'Cached (30s)' : 'Demo Sandbox';

  const base = 'text-[9px] font-semibold uppercase px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1.5 border';

  if (activeSource === 'LIVE') {
    return (
      <span className={`${base} bg-green-500/5 border-green-500/10 text-green-400 ${className}`}>
        <Radio size={11} className="animate-pulse" /> {label}
      </span>
    );
  }

  if (activeSource === 'CACHED') {
    return (
      <span className={`${base} bg-blue-500/5 border-blue-500/10 text-blue-400 ${className}`}>
        <RefreshCw size={11} /> {label}
      </span>
    );
  }

  return (
    <span className={`${base} bg-yellow-500/5 border-yellow-500/10 text-[#fcd535] ${className}`}>
      <Database size={11} /> {label}
    </span>
  );
};
