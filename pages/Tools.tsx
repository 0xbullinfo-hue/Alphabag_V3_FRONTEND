
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Calculator, ArrowRightLeft, Percent, DollarSign, ShieldAlert, FileText, Trash2, Download } from 'lucide-react';


type Tab = 'PROFIT' | 'IL' | 'CONVERTER';

export const Tools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('PROFIT');

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Crypto Utilities</h1>
                <p className="text-alphabag-subtext mt-1 text-sm font-medium"> essential toolkit for secure & profitable trading</p>
            </div>

            <div className="flex space-x-2 border-b border-alphabag-gray mb-6 overflow-x-auto custom-scrollbar pb-2">
                {[
                    { id: 'PROFIT', label: 'Profit Calc', icon: DollarSign },
                    { id: 'IL', label: 'IL Calculator', icon: Percent },
                    { id: 'CONVERTER', label: 'Converter', icon: ArrowRightLeft },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center whitespace-nowrap uppercase tracking-tight ${activeTab === tab.id ? 'border-alphabag-yellow text-alphabag-yellow bg-alphabag-yellow/5' : 'border-transparent text-alphabag-subtext hover:text-white hover:bg-alphabag-gray/50'}`}
                    >
                        <tab.icon size={16} className="mr-2" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="max-w-4xl">
                {activeTab === 'PROFIT' && <ProfitCalculator />}
                {activeTab === 'IL' && <ILCalculator />}
                {activeTab === 'CONVERTER' && <Converter />}
            </div>
        </div>
    );
};

const ProfitCalculator = () => {
    const [invested, setInvested] = useState(1000);
    const [entryPrice, setEntryPrice] = useState(50000);
    const [exitPrice, setExitPrice] = useState(65000);
    const [fee, setFee] = useState(0.1);

    const amount = invested / entryPrice;
    const grossReturn = amount * exitPrice;
    const totalFees = (invested * (fee / 100)) + (grossReturn * (fee / 100));
    const netReturn = grossReturn - totalFees;
    const profit = netReturn - invested;
    const roi = (profit / invested) * 100;

    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Profit & Loss Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Investment ($)</label>
                    <input type="number" value={invested} onChange={(e) => setInvested(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Fee (%)</label>
                    <input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Entry Price ($)</label>
                    <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Exit Price ($)</label>
                    <input type="number" value={exitPrice} onChange={(e) => setExitPrice(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
            </div>

            <div className="bg-alphabag-black/50 rounded-lg p-4 border border-alphabag-gray">
                <div className="flex justify-between mb-2">
                    <span className="text-alphabag-subtext">Total Profit</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                        ${profit.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-alphabag-subtext">ROI</span>
                    <span className={`font-bold ${roi >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                        {roi.toFixed(2)}%
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-alphabag-subtext">Total Exit Value</span>
                    <span className="font-bold text-white">${netReturn.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

const ILCalculator = () => {
    const [priceA, setPriceA] = useState(0); // % change
    const [priceB, setPriceB] = useState(0); // % change

    // Simplified IL formula logic for display
    // IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
    const ratioA = 1 + (priceA / 100);
    const ratioB = 1 + (priceB / 100);
    const priceRatio = ratioA / ratioB;
    const il = (2 * Math.sqrt(priceRatio) / (1 + priceRatio)) - 1;
    const ilPercent = Math.abs(il * 100);

    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Impermanent Loss Calculator</h3>
            <p className="text-xs text-alphabag-subtext mb-4">Estimate potential loss from providing liquidity to an AMM compared to holding.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Asset A Price Change (%)</label>
                    <input type="number" value={priceA} onChange={(e) => setPriceA(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
                <div>
                    <label className="text-xs text-alphabag-subtext block mb-1">Asset B Price Change (%)</label>
                    <input type="number" value={priceB} onChange={(e) => setPriceB(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white" />
                </div>
            </div>

            <div className="bg-alphabag-black/50 rounded-lg p-4 border border-alphabag-gray text-center">
                <span className="text-alphabag-subtext block mb-1">Impermanent Loss</span>
                <span className="text-3xl font-bold text-alphabag-red">{ilPercent.toFixed(2)}%</span>
            </div>
        </div>
    );
};

const Converter = () => {
    const [amount, setAmount] = useState(1);
    const [fromToken, setFromToken] = useState('ETH');
    const [toToken, setToToken] = useState('USDT');

    // Mock rates
    const rates: Record<string, number> = {
        'ETH': 3450,
        'BTC': 64200,
        'SOL': 145,
        'BNB': 580,
        'USDT': 1,
        'USDC': 1,
        'XRP': 0.62,
        'ADA': 0.45,
        'AVAX': 35,
        'DOGE': 0.12
    };

    const result = (amount * (rates[fromToken] || 0)) / (rates[toToken] || 1);

    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Crypto Converter</h3>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                <div className="flex-1 w-full">
                    <label className="text-xs text-alphabag-subtext block mb-1">From</label>
                    <div className="flex space-x-2">
                        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white font-bold text-lg" />
                        <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-white font-bold">
                            {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <ArrowRightLeft className="text-alphabag-subtext mt-4 hidden md:block" />
                <div className="flex-1 w-full">
                    <label className="text-xs text-alphabag-subtext block mb-1">To</label>
                    <div className="flex space-x-2">
                        <input type="number" readOnly value={result.toFixed(6)} className="w-full bg-alphabag-black border border-alphabag-gray rounded p-2 text-white font-bold text-lg" />
                        <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-white font-bold">
                            {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <p className="text-xs text-alphabag-subtext text-center">
                1 {fromToken} ≈ {(rates[fromToken] / rates[toToken]).toFixed(6)} {toToken}
            </p>
        </div>
    );
};


