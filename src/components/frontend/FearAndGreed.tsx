
import React, { useEffect, useState } from 'react';
import { fetchFearAndGreed } from '../../services/mockData';
import { MarketSentiment } from '../../types';

export const FearAndGreed: React.FC = () => {
  const [data, setData] = useState<MarketSentiment | null>(null);

  useEffect(() => {
    fetchFearAndGreed().then(setData);
  }, []);

  if (!data) return <div className="animate-pulse h-32 bg-alphabag-dark rounded-xl"></div>;

  // Calculate rotation for gauge (0 to 180 degrees)
  const rotation = (data.value / 100) * 180;

  return (
    <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6 flex flex-col items-center justify-between relative overflow-hidden">
      <h3 className="font-bold text-white mb-4">Fear & Greed Index</h3>
      
      <div className="relative w-48 h-24 mb-2 overflow-hidden">
        {/* Gauge Background */}
        <div className="absolute top-0 left-0 w-full h-48 rounded-full border-[12px] border-alphabag-gray/30 box-border"></div>
        {/* Color Segments (simplified visual representation) */}
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-full h-full rounded-t-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20"></div>
        </div>
        
        {/* Needle */}
        <div 
            className="absolute bottom-0 left-1/2 w-1 h-24 bg-white origin-bottom transform transition-transform duration-1000 ease-out z-10"
            style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
        >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>

      <div className="text-center z-10 mt-2">
        <div className={`text-4xl font-bold ${data.value > 50 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
            {data.value}
        </div>
        <div className="text-white font-medium uppercase tracking-wider text-sm mt-1">{data.classification}</div>
        <div className="text-alphabag-subtext text-xs mt-2">Next update in {data.nextUpdate}</div>
      </div>
    </div>
  );
};
