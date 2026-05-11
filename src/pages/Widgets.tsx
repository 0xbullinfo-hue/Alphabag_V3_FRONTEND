
import React from 'react';
import { Button } from '../components/ui/Button';
import { Code, Copy } from 'lucide-react';

export const Widgets: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">Crypto <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-1">Widgets</span></h1>
            <p className="text-alphabag-subtext text-[13px] mt-0.5 opacity-60">Embed live transmissions on your external nodes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Widget Preview */}
            <div className="space-y-4">
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white mb-3">Marquee Widget</h3>
                    {/* Simulated Widget */}
                    <div className="bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 overflow-hidden whitespace-nowrap flex space-x-6">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-[12px]">BTC</span>
                            <span className="text-alphabag-green text-[12px] font-mono">$64,230.50</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-[12px]">ETH</span>
                            <span className="text-alphabag-red text-[12px] font-mono">$3,450.20</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-[12px]">SOL</span>
                            <span className="text-alphabag-green text-[12px] font-mono">$145.60</span>
                        </div>
                    </div>
                </div>

                <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white mb-3">Single Coin Card</h3>
                     {/* Simulated Widget */}
                    <div className="bg-white text-black rounded-lg p-3 w-56 shadow-lg">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center font-bold text-sm">
                                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-5 h-5 mr-1.5"/>
                                Bitcoin
                            </div>
                            <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">+2.5%</span>
                        </div>
                        <div className="text-xl font-black">$64,230.50</div>
                        <div className="text-[8px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Powered by AlphaBAG</div>
                    </div>
                </div>
            </div>

            {/* Config & Code */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4 h-fit">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white mb-3 flex items-center">
                    <Code className="mr-2 text-alphabag-yellow" size={14} /> Embed Code
                </h3>
                <div className="bg-alphabag-black p-3 rounded-lg font-mono text-[10px] text-alphabag-subtext mb-3 break-all border border-white/5 opacity-80">
                    &lt;script src="https://alphabag.pro/widgets/main.js"&gt;&lt;/script&gt;<br/>
                    &lt;alphabag-ticker theme="dark" coins="BTC,ETH,SOL"&gt;&lt;/alphabag-ticker&gt;
                </div>
                <Button className="w-full h-9 text-[10px] font-black uppercase tracking-widest">
                    <Copy size={14} className="mr-1.5" /> Copy Code
                </Button>
                
                <div className="mt-4 pt-4 border-t border-alphabag-gray/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-2.5">Configuration</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] text-alphabag-subtext uppercase font-black tracking-widest block mb-1 opacity-60">Theme</label>
                            <select className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-alphabag-yellow/50">
                                <option>Dark</option>
                                <option>Light</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] text-alphabag-subtext uppercase font-black tracking-widest block mb-1 opacity-60">Coins</label>
                            <input type="text" value="BTC,ETH,SOL" className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg px-2 py-1 text-[11px] text-white outline-none focus:border-alphabag-yellow/50" readOnly />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
