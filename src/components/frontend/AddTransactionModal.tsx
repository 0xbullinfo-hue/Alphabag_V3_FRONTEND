import { Calendar,Search,TrendingUp,X } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { MOCK_COINS } from '../../services/mockData';
import { Button } from '../ui/Button';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState<'BUY' | 'SELL' | 'TRANSFER'>('BUY');
  const [coin, setCoin] = useState('Bitcoin (BTC)');
  const [customAssetName, setCustomAssetName] = useState('');
  const [customAssetSymbol, setCustomAssetSymbol] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [, setIsPriceLive] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const isCustomAsset = coin === 'Custom Asset (MANUAL)';
  const isSubmitDisabled = !amount || !price || (isCustomAsset && (!customAssetName.trim() || !customAssetSymbol.trim()));

  useEffect(() => {
    if (isCustomAsset) {
      setPrice('');
      setIsPriceLive(false);
      return;
    }

    const symbolMatch = coin.match(/\(([^)]+)\)/);
    const symbol = symbolMatch ? symbolMatch[1] : '';
    const mock = MOCK_COINS.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
    
    if (mock) {
        setPrice(mock.current_price.toString());
        setIsPriceLive(false);
    } else {
        setIsPriceLive(false);
    }
  }, [coin, isCustomAsset]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) {
      setSubmitMessage('Please complete all required fields before saving.');
      return;
    }

    if (isCustomAsset) {
      onAdd({
        type,
        coin: customAssetName.trim(),
        symbol: customAssetSymbol.trim().toUpperCase(),
        buyPrice: price,
        amount,
        date
      });
    } else {
      const match = coin.match(/^(.*)\s\(([^)]+)\)$/);
      const name = match ? match[1].trim() : coin;
      const symbol = match ? match[2].trim().toUpperCase() : coin.toUpperCase();
      onAdd({ type, coin: name, symbol, buyPrice: price, amount, date });
    }

    setSubmitMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-alphabag-black/85">
      <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg w-full max-w-md max-h-[90vh] shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-4 border-b border-alphabag-gray">
            <h3 className="text-xl font-bold text-white">Add Transaction</h3>
            <button onClick={onClose} className="text-alphabag-subtext hover:text-white"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-78px)] custom-scrollbar">
            <div className="flex bg-alphabag-black rounded-md p-1 border border-alphabag-gray">
                {['BUY', 'SELL', 'TRANSFER'].map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t as any)}
                        className={`flex-1 py-1.5 text-sm font-bold rounded ${
                            type === t 
                            ? (t === 'BUY' ? 'bg-alphabag-green text-black' : t === 'SELL' ? 'bg-alphabag-red text-white' : 'bg-alphabag-yellow text-black')
                            : 'text-alphabag-subtext hover:text-white'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Search Asset</label>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-alphabag-subtext" />
                    <select 
                        value={coin}
                        onChange={(e) => setCoin(e.target.value)}
                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-md pl-9 pr-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none appearance-none"
                    >
                        {MOCK_COINS.map(c => (
                            <option key={c.id} value={`${c.name} (${c.symbol.toUpperCase()})`}>
                                {c.name} ({c.symbol.toUpperCase()})
                            </option>
                        ))}
                        <option value="Custom Asset (MANUAL)">+ Custom Asset</option>
                    </select>
                </div>
            </div>

            {isCustomAsset && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Asset Name</label>
                  <input
                    type="text"
                    value={customAssetName}
                    onChange={(e) => setCustomAssetName(e.target.value)}
                    placeholder="e.g. Alpha Token"
                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md px-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Ticker</label>
                  <input
                    type="text"
                    value={customAssetSymbol}
                    onChange={(e) => setCustomAssetSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. ALPHA"
                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-md px-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Buy Price (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-alphabag-subtext">$</span>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d*\.?\d*$/.test(v)) setPrice(v);
                            }}
                            placeholder="0.00"
                            className="w-full bg-alphabag-black border border-alphabag-gray rounded-md pl-6 pr-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none num tabular-nums"
                        />
                        {!isCustomAsset && (
                             <div className="absolute right-3 top-2.5 flex items-center text-[11px] bg-alphabag-yellow/10 text-alphabag-yellow px-1 rounded font-bold uppercase">
                                <TrendingUp size={10} className="mr-0.5" /> Suggested
                             </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Amount</label>
                    <input 
                        type="text" 
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
                        }}
                        placeholder="0.00"
                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-md px-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none num tabular-nums"
                    />
                </div>
            </div>

            <div className="bg-alphabag-black/50 p-3 rounded-md border border-alphabag-gray/50 text-[11px] text-alphabag-subtext leading-relaxed">
                This entry sets your cost basis for this asset. Enter the price you actually paid — Alphabag will compare it against the live market price to calculate real gain/loss.
            </div>

            <div>
                <label className="block text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Date</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-2.5 text-alphabag-subtext" />
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-md pl-9 pr-3 py-2 text-white text-sm focus:border-alphabag-yellow focus:outline-none" 
                    />
                </div>
            </div>

            {submitMessage && (
              <div className="rounded-md border border-alphabag-yellow/30 bg-alphabag-yellow/10 px-3 py-2 text-xs text-alphabag-yellow">
                {submitMessage}
              </div>
            )}

            <div className="pt-4">
                <Button type="submit" disabled={isSubmitDisabled} className="w-full py-3 font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">Save Transaction</Button>
            </div>
        </form>
      </div>
    </div>
  );
};
