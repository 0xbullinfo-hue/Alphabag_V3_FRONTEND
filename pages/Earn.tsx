
import React, { useEffect, useState } from 'react';
import { fetchEarnOpportunities } from '../services/mockData';
import { EarnOpportunity } from '../types';
import { Button } from '../components/ui/Button';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export const Earn: React.FC = () => {
  const [opps, setOpps] = useState<EarnOpportunity[]>([]);

  useEffect(() => {
    fetchEarnOpportunities().then(setOpps);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-white">DeFi Earn</h1>
            <p className="text-alphabag-subtext mt-1">Discover high-yield staking and lending opportunities across chains.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-alphabag-dark to-alphabag-yellow/5 border border-alphabag-gray rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-alphabag-subtext text-sm">Highest APY</p>
                        <h3 className="text-2xl font-bold text-alphabag-green mt-1">12.5%</h3>
                        <p className="text-white font-medium mt-1">USDT on Curve</p>
                    </div>
                    <div className="bg-alphabag-green/10 p-2 rounded-lg text-alphabag-green">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>
             <div className="bg-gradient-to-br from-alphabag-dark to-blue-500/5 border border-alphabag-gray rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-alphabag-subtext text-sm">Most Popular</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">$12.0B</h3>
                        <p className="text-white font-medium mt-1">ETH on Lido</p>
                    </div>
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-alphabag-black/40 text-alphabag-subtext text-xs uppercase tracking-wider font-medium">
                    <tr>
                        <th className="p-4 pl-6">Asset</th>
                        <th className="p-4">Protocol</th>
                        <th className="p-4">Chain</th>
                        <th className="p-4 text-right">TVL</th>
                        <th className="p-4 text-right">APY</th>
                        <th className="p-4 text-center">Risk</th>
                        <th className="p-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-alphabag-gray/50 text-sm">
                    {opps.map((opp) => (
                        <tr key={opp.id} className="hover:bg-alphabag-gray/20 transition-colors">
                            <td className="p-4 pl-6">
                                <div className="flex items-center space-x-3">
                                    <img src={opp.icon} alt={opp.asset} className="w-8 h-8 rounded-full" />
                                    <span className="font-bold text-white">{opp.asset}</span>
                                </div>
                            </td>
                            <td className="p-4 text-white font-medium">{opp.protocol}</td>
                            <td className="p-4 text-alphabag-subtext">{opp.chain}</td>
                            <td className="p-4 text-right text-alphabag-subtext">${(opp.tvl/1000000).toFixed(1)}M</td>
                            <td className="p-4 text-right font-bold text-alphabag-green">{opp.apy}%</td>
                            <td className="p-4 text-center">
                                <span className={`
                                    text-xs px-2 py-1 rounded font-medium
                                    ${opp.risk === 'LOW' ? 'bg-green-500/10 text-green-500' : 
                                      opp.risk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 
                                      'bg-red-500/10 text-red-500'}
                                `}>
                                    {opp.risk}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <Button size="sm">Invest</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
