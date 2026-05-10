
import React from 'react';
import { Button } from '../components/ui/Button';
import { Code, Copy } from 'lucide-react';

export const Widgets: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">Crypto Widgets</h1>
            <p className="text-alphabag-subtext mt-1">Embed live crypto prices and charts on your website.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Widget Preview */}
            <div className="space-y-6">
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Marquee Widget</h3>
                    {/* Simulated Widget */}
                    <div className="bg-alphabag-black border border-alphabag-gray rounded p-3 overflow-hidden whitespace-nowrap flex space-x-8">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">BTC</span>
                            <span className="text-alphabag-green">$64,230.50 (+2.5%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">ETH</span>
                            <span className="text-alphabag-red">$3,450.20 (-1.2%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">SOL</span>
                            <span className="text-alphabag-green">$145.60 (+5.4%)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Single Coin Card</h3>
                     {/* Simulated Widget */}
                    <div className="bg-white text-black rounded-lg p-4 w-64 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center font-bold">
                                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-6 h-6 mr-2"/>
                                Bitcoin
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">+2.5%</span>
                        </div>
                        <div className="text-2xl font-bold">$64,230.50</div>
                        <div className="text-xs text-gray-500 mt-1">Powered by Alphabag</div>
                    </div>
                </div>
            </div>

            {/* Config & Code */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6 h-fit">
                <h3 className="font-bold text-white mb-4 flex items-center">
                    <Code className="mr-2 text-alphabag-yellow" size={20} /> Embed Code
                </h3>
                <div className="bg-alphabag-black p-4 rounded-lg font-mono text-xs text-alphabag-subtext mb-4 break-all">
                    &lt;script src="https://alphabag.pro/widgets/main.js"&gt;&lt;/script&gt;<br/>
                    &lt;alphabag-ticker theme="dark" coins="BTC,ETH,SOL"&gt;&lt;/alphabag-ticker&gt;
                </div>
                <Button className="w-full">
                    <Copy size={16} className="mr-2" /> Copy Code
                </Button>
                
                <div className="mt-6 pt-6 border-t border-alphabag-gray">
                    <h4 className="font-bold text-white mb-2">Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-alphabag-subtext block mb-1">Theme</label>
                            <select className="w-full bg-alphabag-black border border-alphabag-gray rounded px-2 py-1 text-sm text-white">
                                <option>Dark</option>
                                <option>Light</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-alphabag-subtext block mb-1">Coins</label>
                            <input type="text" value="BTC,ETH,SOL" className="w-full bg-alphabag-black border border-alphabag-gray rounded px-2 py-1 text-sm text-white" readOnly />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
