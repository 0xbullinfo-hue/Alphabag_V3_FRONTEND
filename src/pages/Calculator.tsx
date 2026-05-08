import React, { useState } from 'react';
import { Rocket, Skull, AlertTriangle, Activity, Calculator as CalculatorIcon, ArrowRightLeft, Percent } from 'lucide-react';

type CalcMode = 'LEVERAGE' | 'SPOT' | 'DEGEN' | 'IL' | 'CONVERTER';
type Direction = 'LONG' | 'SHORT';

// Utility element for the comma-formatted inputs 
// (HTML inputs of type number don't support commas easily, 
//  we use a text input that strips non-digits/decimals but formats visually if needed, 
//  or standard type="text" but we parse floats. The images show plain numbers in inputs: "343", "5555", "333" but results have commas.)
// So standard inputs are fine, results must be properly formatted.

const ResultRow = ({ label, resultObj, isBoldLabel = false }: { label: string, resultObj: { value: string, status: string }, isBoldLabel?: boolean }) => {
    let colorClass = 'text-white font-semibold';
    if (resultObj.status === 'positive' && resultObj.value !== '—' && (label.includes('P&L') || label.includes('Profit') || label.includes('Value'))) colorClass = 'text-[#0ECB81] font-semibold';
    if (resultObj.status === 'negative') colorClass = 'text-[#F6465D] font-semibold';
    if (resultObj.value === '—' && label === 'Total Fees') colorClass = 'text-[#F6465D]';
    if (resultObj.value === '—' && label === 'Liquidation Price') colorClass = 'text-[#F6465D]';
    if (resultObj.value === '—' && colorClass.indexOf('F6465D') === -1) colorClass = 'text-[#ADB5BD] font-semibold';
    if (label === 'Multiplier') colorClass = 'text-[#0ECB81] font-semibold'; // Degen
    if (label === 'Target Value') colorClass = 'text-[#0ECB81] font-semibold'; // Degen
    if (label === 'ROI' && resultObj.status === 'positive') colorClass = 'text-[#0ECB81] font-semibold';

    return (
        <div className="flex justify-between items-center py-[12px] border-b border-[#232832] last:border-0 relative">
            <span className={`text-alphabag-muted text-[13px] ${isBoldLabel ? 'font-semibold text-white' : 'font-medium'}`}>{label}</span>
            <span className={colorClass}>{resultObj.value}</span>
        </div>
    );
};

const ResultTextRow = ({ label, value, valueColor = 'text-white font-semibold' }: { label: string, value: string, valueColor?: string }) => (
    <div className="flex justify-between items-center py-[12px] border-b border-[#232832] last:border-0">
        <span className="text-alphabag-muted text-[13px] font-medium">{label}</span>
        <span className={valueColor}>{value}</span>
    </div>
);

const InputField = ({ label, value, onChange, placeholder = '', borderClass = 'border-white/10', labelSub = '' }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <label className="text-alphabag-muted text-[12px] font-black uppercase tracking-[0.2em]">{label}</label>
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
            className={`bg-alphabag-black/50 border ${borderClass} text-white text-[15px] font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-alphabag-yellow/40 focus:ring-1 focus:ring-alphabag-yellow/20 transition-colors shadow-[inset_0_1px_10px_rgba(0,0,0,0.25)] text-left`}
            autoComplete="off"
        />
        {labelSub && <span className="text-alphabag-muted text-[11px] font-medium h-4">{labelSub}</span>}
    </div>
);

export const Calculator: React.FC = () => {
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
                {/* Inputs */}
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20">
                    <div className="flex flex-col gap-3 mb-5">
                        <label className="text-alphabag-muted text-xs font-bold uppercase tracking-widest">DIRECTION</label>
                        <div className="flex gap-4">
                            <button onClick={() => setDirection('LONG')} className={`flex-1 py-3 rounded-xl flex justify-center items-center gap-2 text-[15px] font-bold transition-all ${direction === 'LONG' ? 'bg-[#102B21] text-[#0ECB81] border border-[#0ECB81] border-opacity-[0.25]' : 'bg-alphabag-black/50 text-alphabag-muted border border-white/10 hover:bg-white/5 hover:border-alphabag-yellow/40'}`}>
                                ↑ Long
                            </button>
                            <button onClick={() => setDirection('SHORT')} className={`flex-1 py-3 rounded-xl flex justify-center items-center gap-2 text-[15px] font-bold transition-all ${direction === 'SHORT' ? 'bg-[#2A1519] text-[#F6465D] border border-[#F6465D] border-opacity-30' : 'bg-alphabag-black/50 text-alphabag-muted border border-white/10 hover:bg-white/5 hover:border-alphabag-yellow/40'}`}>
                                ↓ Short
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <InputField label="Entry Price ($)" value={levEntry} onChange={setLevEntry} placeholder="" />
                        <InputField label="Margin ($)" value={levMargin} onChange={setLevMargin} placeholder="" />
                    </div>

                    <div className="flex flex-col gap-5 mb-10">
                        <div className="flex justify-between items-center">
                            <label className="text-alphabag-muted text-[13px] font-bold">Leverage</label>
                            <span className="text-[#FCD535] font-bold bg-[#FCD535] bg-opacity-[0.15] px-3 py-1.5 rounded-md text-[13px] tracking-wide">{levSlider}x</span>
                        </div>
                        <div className="relative pt-2">
                            <input type="range" min="1" max="125" value={levSlider} onChange={e => setLevSlider(Number(e.target.value))} className="w-full h-[3px] bg-alphabag-black/50 rounded-lg appearance-none cursor-pointer accent-alphabag-yellow" />
                        </div>
                        <div className="flex justify-between text-alphabag-muted text-[11px] font-semibold px-0.5 mt-[-6px]">
                            <span>1x</span><span>25x</span><span>50x</span><span>100x</span><span>125x</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="Take Profit ($)" value={levTP} onChange={setLevTP} placeholder="" borderClass={levTP ? 'border-alphabag-green/40' : 'border-white/10'} />
                        <InputField label="Stop Loss ($)" value={levSL} onChange={setLevSL} placeholder="" borderClass={levSL ? 'border-alphabag-red/40' : 'border-white/10'} />
                    </div>
                </div>

                {/* Results */}
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-alphabag-muted text-[11px] font-bold tracking-widest mb-4">RESULTS</h3>
                        <div className="flex flex-col">
                            <ResultRow label="Position Size" resultObj={formatCurrency(positionSize)} />
                            <ResultRow label="Margin Used" resultObj={formatCurrency(margin)} />
                            <ResultTextRow label="Leverage" value={hasCalc ? `${levSlider}x` : '—'} valueColor={hasCalc ? "text-white font-semibold" : "text-[#ADB5BD]"} />
                            <ResultTextRow label="Liquidation Price" value={hasCalc ? `$${formatNum(liqPrice, 2)}` : '—'} valueColor={hasCalc ? "text-[#F6465D] font-semibold" : "text-[#ADB5BD]"} />

                            {/* TP / SL Rows */}
                            <ResultRow
                                label={`TP P&L @ ${tp > 0 ? '$' + formatNum(tp) : '—'}`}
                                resultObj={tp > 0 && hasCalc ? formatPnL(tpPnL, true, ` (+${formatNum(tpROE, 1)}%)`) : { value: '—', status: 'neutral' }}
                            />
                            <ResultRow
                                label={`SL P&L @ ${sl > 0 ? '$' + formatNum(sl) : '—'}`}
                                resultObj={sl > 0 && hasCalc ? formatPnL(slPnL, false, ` (-${formatNum(Math.abs(slROE), 1)}%)`) : { value: '—', status: 'neutral' }}
                            />
                        </div>
                    </div>

                    {isSlBelowLiq && (
                        <div className="mt-6 glass-panel bg-[#2A1519]/90 border border-[#4A252A] rounded-xl p-4 flex items-center gap-3">
                            <AlertTriangle size={16} className="text-[#F6465D]" />
                            <span className="text-[#F6465D] text-[13px] font-medium">Your SL is below the liquidation price — you'd be liquidated first!</span>
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
        let netROE = 0;
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
                netROE = (net / totalCost) * 100;
            } else {
                totalFees = totalCost * fee;
                net = -totalFees;
                netROE = (net / totalCost) * 100;
            }
            breakEven = buy * (1 + fee) / (1 - fee);
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
                {/* Inputs */}
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20">
                    <div className="grid grid-cols-2 gap-6 mb-5">
                        <InputField label="Buy Price ($)" value={spotBuy} onChange={setSpotBuy} placeholder="" />
                        <InputField label="Sell Price ($)" value={spotSell} onChange={setSpotSell} placeholder="" />
                    </div>
                    <div className="grid grid-cols-2 gap-6 mb-7">
                        <InputField label="Amount (coins)" value={spotAmount} onChange={setSpotAmount} placeholder="" />
                        <InputField label="Trading Fee (%)" value={spotFee} onChange={setSpotFee} placeholder="" />
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="text-alphabag-muted text-[13px] font-bold">Fee Presets</label>
                        <div className="flex flex-wrap gap-2.5">
                            {['Binance 0.1%', 'Coinbase 0.6%', 'Kraken 0.26%', 'Custom'].map(preset => {
                                const val = preset === 'Custom' ? '' : preset.split(' ')[1].replace('%', '');
                                const isActive = preset === 'Custom' ? (spotFee !== '0.1' && spotFee !== '0.6' && spotFee !== '0.26') : spotFee === val;
                                return (
                                    <button
                                        key={preset}
                                        onClick={() => { if (val) setSpotFee(val); }}
                                        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${isActive ? 'bg-alphabag-black/70 text-white border border-alphabag-yellow/40' : 'bg-transparent text-alphabag-muted border border-white/10 hover:bg-white/5 hover:border-alphabag-yellow/40'}`}
                                    >
                                        {preset}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-alphabag-muted text-[11px] font-bold tracking-widest mb-4">RESULTS</h3>
                        <div className="flex flex-col">
                            <ResultRow label="Total Cost" resultObj={formatCurrency(totalCost)} />
                            <ResultRow label="Total Revenue" resultObj={formatCurrency(totalRev)} />
                            <ResultTextRow label="Total Fees" value={hasCalc ? `$${formatNum(totalFees)}` : '—'} valueColor={hasCalc ? "text-[#F6465D] font-semibold" : "text-[#ADB5BD]"} />
                            <ResultRow label="Gross P&L" resultObj={gross !== 0 && hasCalc ? formatPnL(gross) : { value: '—', status: 'neutral' }} />
                            <ResultRow label="Net P&L (after fees)" resultObj={net !== 0 && hasCalc ? formatPnL(net, true, ` (+${formatNum(netROE)}%)`) : { value: '—', status: 'neutral' }} />
                            <ResultRow label="Break-even Price" resultObj={formatCurrency(breakEven)} />
                        </div>
                    </div>

                    {net > 0 && hasCalc && (
                        <div className="mt-8 bg-[#102B21] border border-[#1E3A2F] rounded-xl p-6 shadow-inner shadow-black/20">
                            <div className="text-[28px] font-bold text-[#0ECB81] mb-1">
                                +${formatNum(net)}
                            </div>
                            <div className="text-[#0ECB81] opacity-70 text-[13px] font-medium">
                                +{formatNum(netROE)}% net return
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20">
                    <div className="flex items-center gap-2.5 mb-6">
                        <Percent size={18} className="text-alphabag-yellow" />
                        <h2 className="text-white font-bold text-[15px]">IL Risk Assessment</h2>
                    </div>
                    <div className="space-y-6">
                        <InputField label="Asset A Price Change (%)" value={ilPriceA} onChange={setIlPriceA} placeholder="e.g. 50" />
                        <InputField label="Asset B Price Change (%)" value={ilPriceB} onChange={setIlPriceB} placeholder="e.g. 10" />
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20 flex flex-col justify-center items-center text-center">
                    <h3 className="text-alphabag-muted text-[11px] font-bold tracking-widest mb-4">ESTIMATED LOSS</h3>
                    <div className={`text-4xl font-black ${ilPercent > 5 ? 'text-[#F6465D]' : 'text-alphabag-yellow'}`}>
                        {ilPercent.toFixed(2)}%
                    </div>
                    <p className="text-[10px] text-alphabag-muted mt-2 max-w-[200px]">Compared to holding both assets outside the pool.</p>
                </div>
            </div>
        );
    };

    const renderConverterPanel = () => {
        const amount = Number(convAmount);
        const result = (amount * (rates[convFrom] || 0)) / (rates[convTo] || 1);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20">
                    <div className="flex items-center gap-2.5 mb-6">
                        <ArrowRightLeft size={18} className="text-alphabag-yellow" />
                        <h2 className="text-white font-bold text-[15px]">Instant Rate Converter</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-[1fr_100px] gap-3">
                            <InputField label="From" value={convAmount} onChange={setConvAmount} />
                            <div className="flex flex-col gap-1">
                                <label className="text-alphabag-muted text-[12px] font-black uppercase tracking-[0.2em]">Token</label>
                                <select value={convFrom} onChange={e => setConvFrom(e.target.value)} className="bg-alphabag-black/50 border border-white/10 text-white rounded-xl h-11 px-3 outline-none focus:border-alphabag-yellow/40 focus:ring-1 focus:ring-alphabag-yellow/20">
                                    {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-[1fr_100px] gap-3">
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-alphabag-muted text-[12px] font-black uppercase tracking-[0.2em]">Converted Value</label>
                                <div className="bg-alphabag-black/50 border border-white/10 text-white text-[15px] font-medium rounded-xl px-4 py-2.5 h-11 flex items-center">
                                    {result.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-alphabag-muted text-[12px] font-black uppercase tracking-[0.2em]">Token</label>
                                <select value={convTo} onChange={e => setConvTo(e.target.value)} className="bg-alphabag-black/50 border border-white/10 text-white rounded-xl h-11 px-3 outline-none focus:border-alphabag-yellow/40 focus:ring-1 focus:ring-alphabag-yellow/20">
                                    {Object.keys(rates).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20 flex flex-col justify-center items-center text-center">
                    <h3 className="text-alphabag-muted text-[11px] font-bold tracking-widest mb-2">QUICK RATE</h3>
                    <div className="text-2xl font-black text-alphabag-yellow">
                        1 {convFrom} ≈ {(rates[convFrom] / rates[convTo]).toLocaleString(undefined, { maximumFractionDigits: 4 })} {convTo}
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
            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-8">
                    {/* Inputs */}
                    <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20">
                        <div className="flex items-center gap-2.5 mb-6">
                            <Rocket size={18} className="text-[#D8B4FE]" />
                            <h2 className="text-white font-bold text-[15px]">Degen Entry Calculator</h2>
                        </div>

                        <div className="flex flex-col gap-7">
                            <InputField label="Investment ($)" value={degenInv} onChange={setDegenInv} placeholder="" />
                            <div className="grid grid-cols-2 gap-6">
                                <InputField label="Entry Market Cap ($)" value={degenEntryMC} onChange={setDegenEntryMC} placeholder="" labelSub={formatCompactMCcap(degenEntryMC)} />
                                <InputField label="Target Market Cap ($)" value={degenTargetMC} onChange={setDegenTargetMC} placeholder="" labelSub={formatCompactMCcap(degenTargetMC)} />
                            </div>

                            <div className="flex flex-col gap-4 mt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-alphabag-muted font-semibold text-[13px] flex items-center gap-2">
                                        <Skull size={15} className="text-[#F6465D]" /> Rug / Loss Probability
                                    </label>
                                    <span className="font-bold text-[#0ECB81] bg-[#0ECB81]/10 px-2.5 py-1 rounded-md text-[13px] tracking-wide">
                                        {degenRugProb}%
                                    </span>
                                </div>
                                <div className="relative pt-1">
                                    <input type="range" min="0" max="100" value={degenRugProb} onChange={e => setDegenRugProb(Number(e.target.value))} className="w-full h-[4px] bg-alphabag-black/50 rounded-lg appearance-none cursor-pointer accent-alphabag-yellow" />
                                </div>
                                <div className="flex justify-between text-alphabag-muted text-[11px] font-semibold mt-1 px-0.5">
                                    <span>Safe</span>
                                    <span>Risky</span>
                                    <span className="flex items-center gap-1.5 text-[#D8B4FE]"><Rocket size={12} className="text-[#D8B4FE]" /> Degen</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="glass-panel p-5 rounded-xl transition-all hover:border-white/20 flex flex-col justify-between">
                        <div>
                            <h3 className="text-alphabag-muted text-[11px] font-bold tracking-widest mb-4">RESULTS</h3>
                            <div className="flex flex-col">
                                <ResultTextRow label="Multiplier" value={hasCalc ? `${formatNum(multiplier, 1)}x` : '—'} valueColor={hasCalc ? "text-[#0ECB81] font-semibold" : "text-[#ADB5BD]"} />
                                <ResultRow label="Target Value" resultObj={hasCalc ? { value: formatKMBValue(targetVal), status: 'positive' } : { value: '—', status: 'neutral' }} />
                                <ResultRow label="Profit" resultObj={hasCalc ? formatPnL(profit, true, '', true) : { value: '—', status: 'neutral' }} />
                                <ResultTextRow label="ROI" value={hasCalc ? `+${formatNum(roi, 1)}%` : '—'} valueColor={hasCalc ? "text-[#0ECB81] font-semibold" : "text-[#ADB5BD]"} />
                                <ResultRow label="Expected Value (EV)" resultObj={hasCalc ? formatPnL(ev, true, '', true) : { value: '—', status: 'neutral' }} />
                            </div>
                        </div>

                        {ev > 0 && hasCalc && (
                            <div className="mt-8 bg-[#1E1630] border border-[#311C4C] rounded-xl p-5 shadow-inner shadow-black/20">
                                <div className="flex items-center gap-3">
                                    <Rocket size={18} className="text-[#D8B4FE]" />
                                    <span className="text-[#D8B4FE] font-bold text-[15px]">+EV trade — go for it!</span>
                                </div>
                                <div className="text-[#A78BFA] opacity-70 text-[12px] font-medium mt-1">
                                    Adjusted for {degenRugProb}% rug probability
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Moonbag Scenarios */}
                <div className="glass-panel p-5 lg:p-6 w-full overflow-hidden mt-2 rounded-xl transition-all hover:border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-[#F97316]" />
                        <h2 className="text-white font-bold text-[14px]">Moonbag Scenarios <span className="text-alphabag-muted font-medium ml-1"> — if ${formatNum(inv || 1000, 0)} 🚀</span></h2>
                    </div>

                    <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {[2, 5, 10, 50, 100, 1000].map(mult => {
                            const baseInv = inv || 1000;
                            const scenarioTarget = baseInv * mult;
                            const scenarioProfit = scenarioTarget - baseInv;
                            return (
                                <div key={mult} className="glass-panel border border-white/10 rounded-xl p-5 flex-1 min-w-[140px] flex flex-col items-center justify-center text-center shadow-inner shadow-black/10">
                                    <div className="text-[#A78BFA] font-bold text-[15px] mb-2">{mult}x</div>
                                    <div className="text-white font-bold text-[15px] mb-1">{formatKMBValue(scenarioTarget)}</div>
                                    <div className="text-alphabag-muted text-[11px] font-semibold">+{formatKMBValue(scenarioProfit)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto px-4 md:px-8">
            <div className="relative mb-10 overflow-hidden rounded-[2rem] bg-alphabag-black/50 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-br from-alphabag-yellow/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
                <div className="relative p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-alphabag-yellow/10 rounded-lg border border-alphabag-yellow/20">
                                    <CalculatorIcon className="text-alphabag-yellow" size={20} />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative">
                                    Alpha <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Calculator</span>
                                </h1>
                            </div>
                            <p className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest pl-1">
                                Precise trade modeling • futures, spot, degen, and risk tools
                            </p>
                        </div>
                        <div className="bg-alphabag-yellow/10 border border-alphabag-yellow/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-glow-yellow/5">
                            <span className="text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.2em] relative top-px">Premium Analytics</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="glass-panel p-2 rounded-2xl w-full mb-6 border-white/10 overflow-hidden">
                <div className="flex gap-2 px-1 py-1">
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
                            className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-200 whitespace-nowrap ${
                                mode === t.id
                                    ? 'bg-alphabag-yellow text-alphabag-black shadow-[0_0_20px_rgba(252,213,53,0.35)] scale-[1.02]'
                                    : 'bg-black/30 border border-white/[0.06] text-alphabag-subtext hover:text-white hover:bg-white/[0.06] hover:border-white/10'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>



            {mode === 'LEVERAGE' && renderLeveragePanel()}
            {mode === 'SPOT' && renderSpotPanel()}
            {mode === 'DEGEN' && renderDegenPanel()}
            {mode === 'IL' && renderILPanel()}
            {mode === 'CONVERTER' && renderConverterPanel()}
        </div>
    );
};
