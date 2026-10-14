import { Activity,DollarSign,Percent,TrendingDown,TrendingUp } from 'lucide-react';
import React,{ useEffect,useState } from 'react';

type CalcMode = 'FUTURES' | 'DEGEN';
type Direction = 'LONG' | 'SHORT';

export const PublicCalculator: React.FC = () => {
    const [mode, setMode] = useState<CalcMode>('FUTURES');
    const [direction, setDirection] = useState<Direction>('LONG');
    const [investment, setInvestment] = useState<string>('1000');
    const [entryPrice, setEntryPrice] = useState<string>('60000');
    const [exitPrice, setExitPrice] = useState<string>('65000');
    const [leverage, setLeverage] = useState<number>(10);
    const [fees, setFees] = useState<string>('0.1'); // %

    const [result, setResult] = useState({
        pnl: 0,
        roe: 0,
        totalValue: 0,
        liqPrice: 0,
        breakEven: 0
    });

    useEffect(() => {
        calculate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, direction, investment, entryPrice, exitPrice, leverage, fees]);

    const calculate = () => {
        if (!investment || !entryPrice || !exitPrice) {
            setResult({ pnl: 0, roe: 0, totalValue: 0, liqPrice: 0, breakEven: 0 });
            return;
        }

        const inv = parseFloat(investment);
        const entry = parseFloat(entryPrice);
        const exit = parseFloat(exitPrice);
        const feePercent = (parseFloat(fees) || 0) / 100;

        if (isNaN(inv) || isNaN(entry) || isNaN(exit)) return;

        let pnl = 0;
        let roe = 0;
        let totalValue = 0;
        let liqPrice = 0;
        let breakEven = 0;

        if (mode === 'DEGEN') {
            const entryFeeAmt = inv * feePercent;
            const effectiveInv = inv - entryFeeAmt;
            const amount = effectiveInv / entry;

            const grossReturn = amount * exit;
            const exitFeeAmt = grossReturn * feePercent;
            const netReturn = grossReturn - exitFeeAmt;

            pnl = netReturn - inv;
            roe = (pnl / inv) * 100;
            totalValue = netReturn;
            breakEven = entry / ((1 - feePercent) * (1 - feePercent));
        } else if (mode === 'FUTURES') {
            const positionSize = inv * leverage;
            const priceDeltaPercent = (exit - entry) / entry;

            let rawPnL = 0;
            if (direction === 'LONG') {
                rawPnL = positionSize * priceDeltaPercent;
            } else {
                rawPnL = positionSize * (-priceDeltaPercent);
            }

            const totalFees = (positionSize + (positionSize + rawPnL)) * feePercent;

            pnl = rawPnL - totalFees;
            roe = (pnl / inv) * 100;
            totalValue = inv + pnl;

            if (direction === 'LONG') {
                liqPrice = entry * (1 - (1 / leverage) + 0.005);
            } else {
                liqPrice = entry * (1 + (1 / leverage) - 0.005);
            }

            if (direction === 'LONG') {
                breakEven = entry * (1 + (feePercent * 2 * leverage));
            } else {
                breakEven = entry * (1 - (feePercent * 2 * leverage));
            }
        }

        setResult({ pnl, roe, totalValue, liqPrice, breakEven });
    };

    return (
        <div className="bg-alphabag-black/50 border border-alphabag-gray/50 rounded-lg p-1 shadow-2xl overflow-hidden relative z-10 w-full text-left">
            <div className="grid grid-cols-2 bg-alphabag-black/80 p-1 rounded-t-lg border-b border-alphabag-gray">
                {(['FUTURES', 'DEGEN'] as CalcMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); if (m !== 'FUTURES') setLeverage(1); }}
                        className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-all rounded-md ${mode === m
                            ? 'bg-alphabag-yellow text-black'
                            : 'text-alphabag-subtext hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <div className="p-4 grid grid-cols-1 gap-2">
                <div className="space-y-2">
                    {mode === 'FUTURES' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDirection('LONG')}
                                className={`py-2 rounded-md border flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${direction === 'LONG'
                                    ? 'bg-alphabag-green/20 border-alphabag-green text-alphabag-green'
                                    : 'border-alphabag-gray text-alphabag-subtext hover:border-alphabag-gray/80'
                                    }`}
                            >
                                <TrendingUp size={14} /> Long
                            </button>
                            <button
                                onClick={() => setDirection('SHORT')}
                                className={`py-2 rounded-md border flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${direction === 'SHORT'
                                    ? 'bg-alphabag-red/20 border-alphabag-red text-alphabag-red'
                                    : 'border-alphabag-gray text-alphabag-subtext hover:border-alphabag-gray/80'
                                    }`}
                            >
                                <TrendingDown size={14} /> Short
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext pl-1">Inv ($)</label>
                            <div className="relative group">
                                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext group-focus-within:text-alphabag-yellow transition-colors" />
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={investment}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setInvestment(v);
                                    }}
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md py-2 pl-8 pr-3 text-white font-mono font-bold focus:border-alphabag-yellow outline-none transition-colors text-xs num tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext pl-1">Fees (%)</label>
                            <div className="relative group">
                                <Percent size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext group-focus-within:text-alphabag-yellow transition-colors" />
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={fees}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setFees(v);
                                    }}
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md py-2 pl-8 pr-3 text-white font-mono font-bold focus:border-alphabag-yellow outline-none transition-colors text-xs num tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext pl-1">Entry ($)</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext group-focus-within:text-alphabag-yellow font-bold text-[11px]">@</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={entryPrice}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setEntryPrice(v);
                                    }}
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md py-2 pl-8 pr-3 text-white font-mono font-bold focus:border-alphabag-yellow outline-none transition-colors text-xs num tabular-nums"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext pl-1">Exit ($)</label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext group-focus-within:text-alphabag-yellow font-bold text-[11px]">@</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={exitPrice}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setExitPrice(v);
                                    }}
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md py-2 pl-8 pr-3 text-white font-mono font-bold focus:border-alphabag-yellow outline-none transition-colors text-xs num tabular-nums"
                                />
                            </div>
                        </div>
                    </div>

                    {mode === 'FUTURES' && (
                        <div className="bg-alphabag-black/30 p-4 rounded-md border border-alphabag-gray/50 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext">Isolate Leverage</label>
                                <span className="text-alphabag-yellow font-bold text-lg font-mono num">{leverage}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="125"
                                step="1"
                                value={leverage}
                                onChange={(e) => setLeverage(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-alphabag-gray rounded-md appearance-none cursor-pointer accent-alphabag-yellow"
                            />
                        </div>
                    )}
                </div>

                {/* Results block */}
                <div className="bg-alphabag-dark/80 border border-alphabag-gray rounded-lg p-4 relative overflow-hidden h-full flex flex-col justify-center min-h-[140px]">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                        <Activity size={80} />
                    </div>

                    <div className="space-y-2 relative z-10 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext mb-0.5">Estimated PnL</p>
                                <div className={`text-3xl font-bold tracking-tight num ${result.pnl >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {result.pnl >= 0 ? '+' : ''}${result.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className={`text-base font-bold mb-0.5 num ${result.roe >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                {result.roe > 0 ? '+' : ''}{result.roe.toFixed(2)}% ROE
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-alphabag-gray/30">
                            {mode === 'FUTURES' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-alphabag-red font-bold uppercase tracking-wide">Liquidation</span>
                                    <span className="text-alphabag-red font-mono font-bold text-xs num">${result.liqPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-alphabag-subtext font-medium">Break-Even</span>
                                <span className="text-white font-mono font-bold text-xs num">${result.breakEven.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
