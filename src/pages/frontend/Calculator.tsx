import React, { useState } from 'react';
import { Rocket, Skull, AlertTriangle, Activity, Calculator as CalculatorIcon, ArrowRightLeft, Percent } from 'lucide-react';

type CalcMode = 'LEVERAGE' | 'SPOT' | 'DEGEN' | 'IL' | 'CONVERTER';
type Direction = 'LONG' | 'SHORT';

// Utility element for the comma-formatted inputs 
// (HTML inputs of type number don't support commas easily, 
//  we use a text input that strips non-digits/decimals but formats visually if needed, 
//  or standard type="text" but we parse floats. The images show plain numbers in inputs: "343", "5555", "333" but results have commas.)
// So standard inputs are fine, results must be properly formatted.

const ResultRow = ({ label, resultObj, isBoldLabel = false, minimal = false }: { label: string, resultObj: { value: string, status: string }, isBoldLabel?: boolean, minimal?: boolean }) => {
    let colorClass = 'text-alphabag-text font-semibold text-sm';
    if (resultObj.status === 'positive' && resultObj.value !== '—' && (label.includes('P&L') || label.includes('Profit') || label.includes('Value'))) colorClass = 'text-[#0ecb81] font-bold text-[15px]';
    if (resultObj.status === 'negative') colorClass = 'text-[#f6465d] font-bold text-[15px]';
    if (resultObj.value === '—' && label === 'Total Fees') colorClass = 'text-[#f6465d] text-sm';
    if (resultObj.value === '—' && label === 'Liquidation Price') colorClass = 'text-[#f6465d] text-sm';
    if (resultObj.value === '—' && colorClass.indexOf('f6465d') === -1) colorClass = 'text-alphabag-subtext font-semibold text-sm';
    if (label === 'Multiplier') colorClass = 'text-[#0ecb81] font-bold text-[15px]'; 
    if (label === 'Target Value') colorClass = 'text-[#0ecb81] font-bold text-[15px]'; 
    if (label === 'ROI' && resultObj.status === 'positive') colorClass = 'text-[#0ecb81] font-bold text-[15px]';

    return (
        <div className={`flex justify-between items-center border-b border-alphabag-gray/40 last:border-0 relative ${minimal ? 'py-2' : 'py-3'}`}>
            <span className={`text-alphabag-subtext text-xs ${isBoldLabel ? 'font-semibold text-alphabag-text text-sm' : 'font-medium'}`}>{label}</span>
            <span className={colorClass}>{resultObj.value}</span>
        </div>
    );
};

const ResultTextRow = ({ label, value, valueColor = 'text-alphabag-text font-semibold text-sm', minimal = false }: { label: string, value: string, valueColor?: string, minimal?: boolean }) => (
    <div className={`flex justify-between items-center border-b border-alphabag-gray/40 last:border-0 ${minimal ? 'py-2' : 'py-3'}`}>
        <span className="text-alphabag-subtext text-xs font-medium">{label}</span>
        <span className={valueColor}>{value}</span>
    </div>
);

const InputField = ({ label, value, onChange, placeholder = '', borderClass = 'border-alphabag-gray', labelSub = '', minimal = false }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <label className="text-alphabag-subtext text-xs font-semibold">{label}</label>
        <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    onChange(v);
                }
            }}
            placeholder={placeholder}
            className={`bg-alphabag-dark border ${borderClass} text-alphabag-text text-sm font-semibold rounded-md focus:outline-none focus:border-[#fcd535] focus:ring-1 focus:ring-[#fcd535]/20 transition-colors text-left ${minimal ? 'px-3 py-1.5' : 'px-3.5 py-2.5'}`}
            autoComplete="off"
        />
        {labelSub && <span className="text-alphabag-subtext/60 text-[11px] font-medium h-4 mt-0.5">{labelSub}</span>}
    </div>
);

export const Calculator: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
    const mainGridClass = minimal ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-4";
    const inputCardClass = minimal 
        ? "relative flex flex-col gap-3" 
        : "bg-alphabag-darkgray border border-alphabag-gray hover:border-[#fcd535]/30 transition-all group relative overflow-hidden rounded-xl p-5 shadow-2xl";
    const resultCardClass = minimal 
        ? "relative flex flex-col justify-between gap-1.5 mt-2 pt-2 border-t border-alphabag-gray/40" 
        : "bg-alphabag-darkgray border border-alphabag-gray hover:border-[#fcd535]/30 transition-all group relative overflow-hidden rounded-xl p-5 shadow-2xl flex flex-col justify-between";
    const [mode, setMode] = useState<CalcMode>('LEVERAGE');


    // Leverage State
    const [direction, setDirection] = useState<Direction>('LONG');
    const [levEntry, setLevEntry] = useState('');
    const [levMargin, setLevMargin] = useState('');
    const [levSlider, setLevSlider] = useState(10);
    const [levTP, setLevTP] = useState('');
    const [levSL, setLevSL] = useState('');

    // Spot State
    const [spotBuy, setSpotBuy] = useState('');
    const [spotSell, setSpotSell] = useState('');
    const [spotAmount, setSpotAmount] = useState('');
    const [spotFee, setSpotFee] = useState('0.1');

    // Degen State
    const [degenInv, setDegenInv] = useState('');
    const [degenEntryMC, setDegenEntryMC] = useState('');
    const [degenTargetMC, setDegenTargetMC] = useState('');
    const [degenRugProb, setDegenRugProb] = useState(30);

    // IL State
    const [ilPriceA, setIlPriceA] = useState('');
    const [ilPriceB, setIlPriceB] = useState('');

    // Converter State
    const [convAmount, setConvAmount] = useState('1');
    const [convFrom, setConvFrom] = useState('ETH');
    const [convTo, setConvTo] = useState('USDT');

    const [rates, setRates] = useState<Record<string, number>>({
        'ETH': 3450, 'BTC': 64200, 'SOL': 145, 'BNB': 580,
        'USDT': 1, 'USDC': 1, 'XRP': 0.62, 'ADA': 0.45,
        'AVAX': 35, 'DOGE': 0.12
    });

    React.useEffect(() => {
        const fetchLivePrices = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/price');
                const data = await response.json();
                
                // Binance symbols typically end with USDT
                const symbolsToMap: Record<string, string> = {
                    'BTCUSDT': 'BTC',
                    'ETHUSDT': 'ETH',
                    'SOLUSDT': 'SOL',
                    'BNBUSDT': 'BNB',
                    'XRPUSDT': 'XRP',
                    'ADAUSDT': 'ADA',
                    'AVAXUSDT': 'AVAX',
                    'DOGEUSDT': 'DOGE'
                };

                const newRates = { ...rates };
                data.forEach((item: any) => {
                    if (symbolsToMap[item.symbol]) {
                        newRates[symbolsToMap[item.symbol]] = parseFloat(item.price);
                    }
                });
                
                setRates(newRates);
            } catch (error) {
                console.error("Failed to fetch live prices:", error);
            }
        };

        fetchLivePrices();
        const interval = setInterval(fetchLivePrices, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const formatNum = (val: number, decimals: number = 2) => {
        return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    const formatCurrency = (val: number, isDashOnZero = true, decimals = 2) => {
        if (isDashOnZero && (!val || isNaN(val) || val === 0)) return { value: '—', status: 'neutral' };
        if (isNaN(val)) return { value: '—', status: 'neutral' };
        return {
            value: '$' + formatNum(val, decimals),
            status: 'positive'
        };
    };

    // Specifically for numbers that compress to K, M, B (like 200.0K)
    const formatCompactMCcap = (valStr: string) => {
        const val = Number(valStr);
        if (!val || isNaN(val)) return '';
        if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B mcap';
        if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M mcap';
        if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K mcap';
        return val.toString() + ' mcap';
    };

    const formatKMBValue = (val: number) => {
        if (!val || isNaN(val)) return '$0.00';
        if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return '$' + (val / 1e3).toFixed(2) + 'K';
        return '$' + val.toFixed(2);
    };

    const formatPnL = (val: number, includePlus = true, addPercentStr = '', asKMB = false) => {
        if (isNaN(val) || val === 0) return { value: '—', status: 'neutral' };
        const numStr = asKMB ? formatKMBValue(Math.abs(val)) : '$' + formatNum(Math.abs(val));
        const prefix = val > 0 ? (includePlus ? '+' : '') : '-';
        const fullStr = `${prefix}${numStr}${addPercentStr}`;
        return {
            value: fullStr,
            status: val > 0 ? 'positive' : 'negative'
        };
    };



    const renderLeveragePanel = () => {
        const entry = Number(levEntry);
        const margin = Number(levMargin);
        const tp = Number(levTP);
        const sl = Number(levSL);

        let positionSize = 0;
        let liqPrice = 0;
        let tpPnL = 0;
        let tpROE = 0;
        let slPnL = 0;
        let slROE = 0;

        let hasCalc = false;
        let isSlBelowLiq = false;

        if (entry > 0 && margin > 0) {
            hasCalc = true;
            positionSize = margin * levSlider;

            // Binance logic approx for liquidations
            if (direction === 'LONG') {
                liqPrice = entry * (1 - 1 / levSlider + 0.005);
                if (tp > entry) {
                    tpPnL = positionSize * ((tp - entry) / entry);
                    tpROE = (tpPnL / margin) * 100;
                }
                if (sl > 0 && sl < entry) {
                    slPnL = positionSize * ((sl - entry) / entry);
                    slROE = (slPnL / margin) * 100;
                    if (sl <= liqPrice) isSlBelowLiq = true;
                }
            } else {
                liqPrice = entry * (1 + 1 / levSlider - 0.005);
                if (tp > 0 && tp < entry) {
                    tpPnL = positionSize * ((entry - tp) / entry);
                    tpROE = (tpPnL / margin) * 100;
                }
                if (sl > entry) {
                    slPnL = positionSize * ((entry - sl) / entry);
                    slROE = (slPnL / margin) * 100;
                    if (sl >= liqPrice) isSlBelowLiq = true;
                }
            }
        }

        return (
            <div className={mainGridClass}>
                {/* Inputs */}
                <div className={inputCardClass}>
                    {!minimal && <div className="absolute -top-10 -right-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-alphabag-subtext text-xs font-semibold">Direction</label>
                            <div className="flex gap-3">
                                <button onClick={() => setDirection('LONG')} className={`flex-1 py-1.5 rounded-md flex justify-center items-center gap-1.5 text-xs font-bold transition-all ${direction === 'LONG' ? 'bg-[#102B21] text-[#0ECB81] border border-[#0ECB81]/30' : 'bg-alphabag-dark text-alphabag-subtext border border-alphabag-gray hover:bg-[#2b3139]'}`}>
                                    ↑ Long
                                </button>
                                <button onClick={() => setDirection('SHORT')} className={`flex-1 py-1.5 rounded-md flex justify-center items-center gap-1.5 text-xs font-bold transition-all ${direction === 'SHORT' ? 'bg-[#2A1519] text-[#F6465D] border border-[#F6465D]/30' : 'bg-alphabag-dark text-alphabag-subtext border border-alphabag-gray hover:bg-[#2b3139]'}`}>
                                    ↓ Short
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField label="Entry Price ($)" value={levEntry} onChange={setLevEntry} placeholder="" minimal={minimal} />
                            <InputField label="Margin ($)" value={levMargin} onChange={setLevMargin} placeholder="" minimal={minimal} />
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-center">
                                <label className="text-alphabag-subtext text-xs font-semibold">Leverage</label>
                                <span className="text-alphabag-yellow font-bold bg-alphabag-yellow/10 px-2 py-0.5 rounded border border-alphabag-yellow/20 text-xs">{levSlider}x</span>
                            </div>
                            <div className="relative pt-1">
                                <input type="range" min="1" max="125" value={levSlider} onChange={e => setLevSlider(Number(e.target.value))} className="w-full h-[3px] bg-black/40 rounded appearance-none cursor-pointer accent-[#fcd535] border border-white/5" />
                            </div>
                            <div className="flex justify-between text-alphabag-subtext text-[10px] font-semibold px-1 mt-[-2px]">
                                <span>1x</span><span>25x</span><span>50x</span><span>100x</span><span>125x</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Take Profit ($)" value={levTP} onChange={setLevTP} placeholder="" borderClass={levTP ? 'border-[#0ecb81]/40' : 'border-alphabag-gray'} minimal={minimal} />
                            <InputField label="Stop Loss ($)" value={levSL} onChange={setLevSL} placeholder="" borderClass={levSL ? 'border-[#f6465d]/40' : 'border-alphabag-gray'} minimal={minimal} />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className={resultCardClass}>
                    {!minimal && <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10 w-full">
                        <div className="flex flex-col">
                            <ResultRow label="Position Size" resultObj={formatCurrency(positionSize)} minimal={minimal} />
                            <ResultRow label="Margin Used" resultObj={formatCurrency(margin)} minimal={minimal} />
                            <ResultTextRow label="Leverage" value={hasCalc ? `${levSlider}x` : '—'} valueColor={hasCalc ? "text-alphabag-text font-bold text-sm" : "text-alphabag-subtext text-sm"} minimal={minimal} />
                            <ResultTextRow label="Liquidation Price" value={hasCalc ? `$${formatNum(liqPrice, 2)}` : '—'} valueColor={hasCalc ? "text-[#f6465d] font-bold text-sm" : "text-alphabag-subtext text-sm"} minimal={minimal} />

                            <div className="mt-2 pt-2 border-t border-alphabag-gray/40 space-y-1">
                                <ResultRow
                                    label={`TP P&L @ ${tp > 0 ? '$' + formatNum(tp) : '—'}`}
                                    resultObj={tp > 0 && hasCalc ? formatPnL(tpPnL, true, ` (+${formatNum(tpROE, 1)}%)`) : { value: '—', status: 'neutral' }}
                                    minimal={minimal}
                                />
                                <ResultRow
                                    label={`SL P&L @ ${sl > 0 ? '$' + formatNum(sl) : '—'}`}
                                    resultObj={sl > 0 && hasCalc ? formatPnL(slPnL, false, ` (-${formatNum(Math.abs(slROE), 1)}%)`) : { value: '—', status: 'neutral' }}
                                    minimal={minimal}
                                />
                            </div>
                        </div>
                    </div>

                    {isSlBelowLiq && (
                        <div className="mt-4 bg-[#2A1519]/90 border border-[#4A252A] rounded-lg p-3 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#f6465d] shrink-0" />
                            <span className="text-[#f6465d] text-xs font-semibold">SL is below liquidation price — you'd be liquidated first!</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSpotPanel = () => {
        const buy = Number(spotBuy);
        const sell = Number(spotSell);
        const amount = Number(spotAmount);
        const fee = Number(spotFee) / 100;

        let totalCost = 0;
        let totalRev = 0;
        let totalFees = 0;
        let gross = 0;
        let net = 0;
        let netROEPercent = 0;
        let breakEven = 0;

        let hasCalc = false;

        if (buy > 0 && amount > 0) {
            hasCalc = true;
            totalCost = buy * amount;
            if (sell > 0) {
                totalRev = sell * amount;
                totalFees = (totalCost + totalRev) * fee;
                gross = totalRev - totalCost;
                net = gross - totalFees;
                netROEPercent = (net / totalCost) * 100;
            } else {
                totalFees = totalCost * fee;
                net = -totalFees;
                netROEPercent = (net / totalCost) * 100;
            }
            breakEven = buy * (1 + fee) / (1 - fee);
        }

        return (
            <div className={mainGridClass}>
                {/* Inputs */}
                <div className={inputCardClass}>
                    {!minimal && <div className="absolute -top-10 -right-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField label="Buy Price ($)" value={spotBuy} onChange={setSpotBuy} placeholder="" minimal={minimal} />
                            <InputField label="Sell Price ($)" value={spotSell} onChange={setSpotSell} placeholder="" minimal={minimal} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField label="Amount (coins)" value={spotAmount} onChange={setSpotAmount} placeholder="" minimal={minimal} />
                            <InputField label="Trading Fee (%)" value={spotFee} onChange={setSpotFee} placeholder="" minimal={minimal} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-alphabag-subtext text-xs font-semibold pl-1">Fee Presets</label>
                            <div className="flex flex-wrap gap-2">
                                {['Binance 0.1%', 'Coinbase 0.6%', 'Kraken 0.26%', 'Custom'].map(preset => {
                                    const val = preset === 'Custom' ? '' : preset.split(' ')[1].replace('%', '');
                                    const isActive = preset === 'Custom' ? (spotFee !== '0.1' && spotFee !== '0.6' && spotFee !== '0.26') : spotFee === val;
                                    return (
                                        <button
                                            key={preset}
                                            onClick={() => { if (val) setSpotFee(val); }}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isActive ? 'bg-[#fcd535] text-black shadow-md' : 'bg-alphabag-dark text-alphabag-subtext border border-alphabag-gray hover:bg-[#2b3139]'}`}
                                        >
                                            {preset}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className={resultCardClass}>
                    {!minimal && <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10 w-full">
                        <div className="flex flex-col">
                            <ResultRow label="Total Cost" resultObj={formatCurrency(totalCost)} minimal={minimal} />
                            <ResultRow label="Total Revenue" resultObj={formatCurrency(totalRev)} minimal={minimal} />
                            <ResultTextRow label="Total Fees" value={hasCalc ? `$${formatNum(totalFees)}` : '—'} valueColor={hasCalc ? "text-[#f6465d] font-bold text-sm" : "text-alphabag-subtext text-sm"} minimal={minimal} />
                            <ResultRow label="Gross P&L" resultObj={gross !== 0 && hasCalc ? formatPnL(gross) : { value: '—', status: 'neutral' }} minimal={minimal} />
                            <div className="mt-2 pt-2 border-t border-alphabag-gray/40">
                                <ResultRow label="Net P&L (after fees)" resultObj={net !== 0 && hasCalc ? formatPnL(net, true, ` (+${formatNum(netROEPercent)}%)`) : { value: '—', status: 'neutral' }} minimal={minimal} />
                                <ResultRow label="Break-even Price" resultObj={formatCurrency(breakEven)} minimal={minimal} />
                            </div>
                        </div>
                    </div>

                    {net > 0 && hasCalc && (
                        <div className={`bg-[#102B21] border border-[#1E3A2F] rounded-lg shadow-inner ${minimal ? 'p-3 mt-4' : 'p-6 mt-8'}`}>
                            <div className={`font-bold text-[#0ECB81] mb-1 ${minimal ? 'text-xl' : 'text-[28px]'}`}>
                                +${formatNum(net)}
                            </div>
                            <div className="text-[#0ecb81] opacity-70 text-xs font-semibold">
                                +{formatNum(netROEPercent)}% net return
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };



    const renderILPanel = () => {
        const ratioA = 1 + (Number(ilPriceA) / 100);
        const ratioB = 1 + (Number(ilPriceB) / 100);
        const priceRatio = ratioA / ratioB;
        if (isNaN(priceRatio)) return null;
        const il = (2 * Math.sqrt(priceRatio) / (1 + priceRatio)) - 1;
        const ilPercent = Math.abs(il * 100);

        return (
            <div className={mainGridClass}>
                <div className={inputCardClass}>
                    {!minimal && <div className="absolute -top-10 -right-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Percent size={16} className="text-alphabag-yellow" />
                            <h2 className="text-alphabag-text font-bold text-sm">IL Risk Assessment</h2>
                        </div>
                        <div className="space-y-4">
                            <InputField label="Asset A Price Change (%)" value={ilPriceA} onChange={setIlPriceA} placeholder="e.g. 50" minimal={minimal} />
                            <InputField label="Asset B Price Change (%)" value={ilPriceB} onChange={setIlPriceB} placeholder="e.g. 10" minimal={minimal} />
                        </div>
                    </div>
                </div>
                <div className={`${resultCardClass} flex flex-col justify-center items-center text-center py-6`}>
                    {!minimal && <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className={`font-bold tracking-tight ${minimal ? 'text-4xl' : 'text-5xl'} ${ilPercent > 5 ? 'text-[#f6465d]' : 'text-alphabag-yellow'}`}>
                            {ilPercent.toFixed(2)}%
                        </div>
                        <p className="text-[10px] text-alphabag-subtext mt-2 max-w-[200px] font-semibold uppercase tracking-wider">Estimated Loss</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderConverterPanel = () => {
        const amount = Number(convAmount);
        const result = (amount * (rates[convFrom] || 0)) / (rates[convTo] || 1);

        return (
            <div className={mainGridClass}>
                <div className={inputCardClass}>
                    {!minimal && <div className="absolute -top-10 -right-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <ArrowRightLeft size={16} className="text-alphabag-yellow" />
                            <h2 className="text-alphabag-text font-bold text-sm">Instant Converter</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-[1fr_80px] gap-2">
                                <InputField label="From" value={convAmount} onChange={setConvAmount} minimal={minimal} />
                                <div className="flex flex-col gap-1">
                                    <label className="text-alphabag-subtext text-xs font-semibold pl-1">Token</label>
                                    <select value={convFrom} onChange={e => setConvFrom(e.target.value)} className="bg-alphabag-dark border border-alphabag-gray text-alphabag-text rounded-md h-9 px-2 outline-none focus:border-[#fcd535] text-xs font-semibold">
                                        {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_80px] gap-2">
                                <div className="flex flex-col gap-1 w-full">
                                    <label className="text-alphabag-subtext text-xs font-semibold pl-1">Converted Value</label>
                                    <div className="bg-alphabag-dark border border-alphabag-gray text-alphabag-text text-sm font-semibold rounded-md px-3 h-9 flex items-center">
                                        {result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-alphabag-subtext text-xs font-semibold pl-1">Token</label>
                                    <select value={convTo} onChange={e => setConvTo(e.target.value)} className="bg-alphabag-dark border border-alphabag-gray text-alphabag-text rounded-md h-9 px-2 outline-none focus:border-[#fcd535] text-xs font-semibold">
                                        {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`${resultCardClass} flex flex-col justify-center items-center text-center py-6`}>
                    {!minimal && <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                    <div className="relative z-10">
                        <div className={`font-bold text-alphabag-yellow tracking-tight ${minimal ? 'text-lg' : 'text-3xl'}`}>
                            1 {convFrom} ≈ {(rates[convFrom] / rates[convTo]).toLocaleString(undefined, { maximumFractionDigits: 4 })} {convTo}
                        </div>
                        <p className="text-[10px] text-alphabag-subtext mt-2 font-semibold uppercase tracking-wider">Quick Conversion Rate</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderDegenPanel = () => {
        const inv = Number(degenInv);
        const entryMC = Number(degenEntryMC);
        const targetMC = Number(degenTargetMC);
        const rugProb = degenRugProb / 100;

        let multiplier = 0;
        let targetVal = 0;
        let profit = 0;
        let roi = 0;
        let ev = 0;

        let hasCalc = false;

        if (inv > 0 && entryMC > 0 && targetMC > 0) {
            hasCalc = true;
            multiplier = targetMC / entryMC;
            targetVal = inv * multiplier;
            profit = targetVal - inv;
            roi = (profit / inv) * 100;
            ev = (targetVal * (1 - rugProb)) - inv;
        }

        return (
            <div className="flex flex-col gap-4">
                <div className={mainGridClass}>
                    {/* Inputs */}
                    <div className={inputCardClass}>
                        {!minimal && <div className="absolute -top-10 -right-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Rocket size={16} className="text-[#D8B4FE]" />
                                <h2 className="text-alphabag-text font-bold text-sm">Degen Entry Calculator</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <InputField label="Investment ($)" value={degenInv} onChange={setDegenInv} placeholder="" minimal={minimal} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Entry Market Cap ($)" value={degenEntryMC} onChange={setDegenEntryMC} placeholder="" labelSub={formatCompactMCcap(degenEntryMC)} minimal={minimal} />
                                    <InputField label="Target Market Cap ($)" value={degenTargetMC} onChange={setDegenTargetMC} placeholder="" labelSub={formatCompactMCcap(degenTargetMC)} minimal={minimal} />
                                </div>

                                <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-alphabag-subtext text-xs font-semibold flex items-center gap-2">
                                            <Skull size={14} className="text-[#f6465d]" /> Rug / Loss Probability
                                        </label>
                                        <span className="font-bold text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2 py-0.5 rounded text-xs">
                                            {degenRugProb}%
                                        </span>
                                    </div>
                                    <div className="relative pt-1">
                                        <input type="range" min="0" max="100" value={degenRugProb} onChange={e => setDegenRugProb(Number(e.target.value))} className="w-full h-[3px] bg-black/40 rounded appearance-none cursor-pointer accent-[#fcd535] border border-white/5" />
                                    </div>
                                    <div className="flex justify-between text-alphabag-subtext text-[10px] font-semibold mt-1 px-1">
                                        <span>Safe (0%)</span>
                                        <span>High Risk (100%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className={resultCardClass}>
                        {!minimal && <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>}
                        <div className="relative z-10 w-full">
                            <div className="flex flex-col">
                                <ResultRow label="Investment" resultObj={formatCurrency(inv)} minimal={minimal} />
                                <ResultTextRow label="Target Multiple" value={hasCalc ? `${multiplier.toFixed(2)}x` : '—'} valueColor={hasCalc ? "text-[#D8B4FE] font-bold text-sm" : "text-alphabag-subtext text-sm"} minimal={minimal} />
                                <ResultRow label="Target Value" resultObj={formatCurrency(targetVal)} minimal={minimal} />
                                <ResultRow label="Net Profit" resultObj={profit !== 0 && hasCalc ? formatPnL(profit, true, ` (+${formatNum(roi, 0)}%)`) : { value: '—', status: 'neutral' }} minimal={minimal} />

                                <div className="mt-4 pt-3 border-t border-alphabag-gray/40">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-alphabag-subtext text-xs font-semibold">Expected Value (EV)</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ev > 0 ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-[#f6465d]/15 text-[#f6465d]'}`}>
                                                {ev > 0 ? 'Positive EV' : 'Negative EV'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold tracking-tight ${minimal ? 'text-2xl' : 'text-4xl'} ${ev > 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                        {ev !== 0 && hasCalc ? (ev > 0 ? '+' : '') + formatCurrency(ev, false).value : '—'}
                                    </div>
                                    <p className="text-[10px] text-alphabag-subtext/70 mt-1 font-medium">Average outcome including risk.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Moonbag Scenarios */}
                {!minimal && (
                    <div className="glass-panel bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-alphabag-yellow/30 transition-all group relative overflow-hidden rounded-xl p-6 shadow-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity size={18} className="text-alphabag-yellow" />
                            <h2 className="text-white font-black text-[14px] uppercase tracking-tighter">Moonbag Scenarios <span className="text-alphabag-muted font-medium ml-1"> — based on ${formatNum(inv || 1000, 0)} entry</span></h2>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {[2, 5, 10, 50, 100, 1000].map(mult => {
                                const baseInv = inv || 1000;
                                const scenarioTarget = baseInv * mult;
                                const scenarioProfit = scenarioTarget - baseInv;
                                return (
                                    <div key={mult} className="bg-black/30 border border-white/10 rounded-xl p-5 flex-1 min-w-[140px] flex flex-col items-center justify-center text-center hover:border-alphabag-yellow/40 transition-all shadow-inner">
                                        <div className="text-alphabag-yellow font-black text-[18px] mb-2">{mult}x</div>
                                        <div className="text-white font-black text-[15px] mb-1">{formatKMBValue(scenarioTarget)}</div>
                                        <div className="text-alphabag-green text-[10px] font-black uppercase tracking-widest">+{formatKMBValue(scenarioProfit)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`w-full space-y-5 animate-in fade-in duration-700 ${minimal ? '' : 'pb-12 px-4 md:px-8'}`}>
            {/* Page Header */}
            {!minimal && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-alphabag-gray gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                                <CalculatorIcon size={20} />
                            </div>
                            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Alpha Calculator</h1>
                        </div>
                        <p className="text-alphabag-subtext text-sm font-medium">Futures, spot, degen, impermanent loss and conversion tools</p>
                    </div>
                    <div className="bg-[#2b3139] px-3 py-1.5 rounded-md text-[11px] text-[#fcd535] font-semibold uppercase tracking-wider">
                        Premium Analytics
                    </div>
                </div>
            )}

            {/* Tab Bar */}
            <div className="bg-alphabag-black border border-alphabag-gray rounded-lg p-1 flex gap-1">
                {[
                    { id: 'LEVERAGE', label: 'Leverage' },
                    { id: 'SPOT', label: 'Spot' },
                    { id: 'DEGEN', label: 'Degen' },
                    { id: 'IL', label: 'IL Risk' },
                    { id: 'CONVERTER', label: 'Converter' }
                ].map((t: any) => (
                    <button
                        key={t.id}
                        onClick={() => setMode(t.id)}
                        className={`flex-1 py-2.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                            mode === t.id
                                ? 'bg-[#fcd535] text-[#181a20]'
                                : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#2b3139]'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>



            {mode === 'LEVERAGE' && renderLeveragePanel()}
            {mode === 'SPOT' && renderSpotPanel()}
            {mode === 'DEGEN' && renderDegenPanel()}
            {mode === 'IL' && renderILPanel()}
            {mode === 'CONVERTER' && renderConverterPanel()}
        </div>
    );
};
