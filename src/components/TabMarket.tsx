import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FISH_SPECS, FishType } from '../types.ts';
import { formatNaira, getApiUrl } from '../utils.ts';
import { ShoppingBag, ChevronRight, Calculator, Check, AlertCircle } from 'lucide-react';

interface TabMarketProps {
  walletBalance: number;
  telegramId: string;
  simulatedDay: string;
  onPurchaseSuccess: () => void;
  setActiveTab: (tab: string) => void;
  addNotification: (msg: string) => void;
  marketCatalog: any[];
}

export default function TabMarket({
  walletBalance,
  telegramId,
  simulatedDay,
  onPurchaseSuccess,
  setActiveTab,
  addNotification,
  marketCatalog,
}: TabMarketProps) {
  const [selectedFish, setSelectedFish] = React.useState<any | null>(null);
  const [qty, setQty] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState(false);

  const handleOpenBuyModal = (spec: any) => {
    setErrorMsg('');
    setQty(1);
    setSelectedFish(spec);
  };

  const incrementQty = () => setQty(prev => prev + 1);
  const decrementQty = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

  // Daily yield pro-rated rule: Daily Profit × Days Remaining
  const getProRatedDailyEarnings = (spec: any): number => {
    const day = simulatedDay.trim().toLowerCase();
    const dayMap: Record<string, string> = {
      mon: 'monday', monday: 'monday',
      tue: 'tuesday', tuesday: 'tuesday',
      wed: 'wednesday', wednesday: 'wednesday',
      thu: 'thursday', thursday: 'thursday',
      fri: 'friday', friday: 'friday',
      sat: 'saturday', saturday: 'saturday',
      sun: 'sunday', sunday: 'sunday'
    };
    const DayKey = dayMap[day] || 'monday';
    const daysMap: Record<string, number> = {
      monday: 6, tuesday: 5, wednesday: 4, thursday: 3, friday: 2, saturday: 1, sunday: 0
    };
    const daysRemaining = daysMap[DayKey] ?? 0;
    return Math.round((spec.dailyProfit || 0) * daysRemaining);
  };

  const activeDays = React.useMemo(() => {
    const dayMap: Record<string, number> = {
      monday: 6, tuesday: 5, wednesday: 4, thursday: 3, friday: 2, saturday: 1, sunday: 0
    };
    return dayMap[simulatedDay.trim().toLowerCase()] ?? 6;
  }, [simulatedDay]);

  const handleBuy = async () => {
    if (!selectedFish) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch(getApiUrl(`/api/users/${telegramId}/buy`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fishType: selectedFish.name || selectedFish.id,
          quantity: qty,
          currentDay: simulatedDay
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to complete fish purchase');
      }

      // Add actual alert logs
      if (resData.notifications) {
        resData.notifications.forEach((note: string) => addNotification(note));
      }

      setSuccessMsg(true);
      onPurchaseSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    setSuccessMsg(false);
    setSelectedFish(null);
    setActiveTab('pond'); // Redirect to My Pond tab
  };

  const computedList = React.useMemo(() => {
    if (marketCatalog && marketCatalog.length > 0) {
      return marketCatalog.map((item) => ({
        id: item.id || item.name,
        name: item.name || item.id,
        displayName: item.displayName,
        price: item.price,
        dailyProfit: item.dailyProfit !== undefined ? item.dailyProfit : item.daily_profit,
        weeklyProfit: item.weeklyProfit !== undefined ? item.weeklyProfit : item.weekly_profit,
        image: item.image || item.photo_url || item.photoUrl,
        color: item.color || (item.name === 'meluza' ? '#38bdf8' : item.name === 'schoolbian' ? '#4ade80' : item.name === 'catfish' ? '#fb923c' : '#06b6d4'),
        tag: item.tag || 'PREMIUM',
        status: item.status || 'Active',
        limited: !!(item.limited !== undefined ? item.limited : item.is_limited),
        unitsLimit: item.unitsLimit !== undefined ? item.unitsLimit : item.units_limit,
        unitsSold: item.unitsSold !== undefined ? item.unitsSold : item.units_sold,
        description: item.description
      })).filter(spec => spec.status === 'Active');
    }

    // Default fallback list converting FISH_SPECS map to list
    return Object.keys(FISH_SPECS).map((key) => {
      const spec = FISH_SPECS[key as keyof typeof FISH_SPECS];
      return {
        id: spec.name,
        name: spec.name,
        displayName: spec.displayName,
        price: spec.price,
        dailyProfit: spec.dailyProfit,
        weeklyProfit: spec.weeklyProfit,
        image: spec.image,
        color: spec.color,
        tag: 'PREMIUM',
        status: 'Active',
        limited: false,
        unitsLimit: 0,
        unitsSold: 0,
        description: 'Premium organic breed farming specification'
      };
    });
  }, [marketCatalog]);

  return (
    <div className="space-y-6 pb-20">
      {/* Wallet overview card */}
      <div className="bg-brand-box border border-cyan-900/40 p-5 rounded-2xl flex items-center justify-between shadow-[0_4px_20px_rgba(2,21,26,0.4)]">
        <div>
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Available Balance</span>
          <span className="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">{formatNaira(walletBalance)}</span>
        </div>
        <button
          onClick={() => setActiveTab('deposit')}
          className="py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95"
        >
          <span>Fund Wallet</span>
          <span className="text-[10px]">✨</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent font-sans">
          Choose Breeding Farm Stock
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Staking is open from Mon to Sat. Active yields are computed daily, pro-rated to hours remaining, and paid out with streak multipliers. No new staking is done on Sunday.
        </p>
      </div>

      {simulatedDay.trim().toLowerCase() === 'sunday' && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-rose-400 block font-sans">Purchases Locked on Sunday</strong>
            Sundays are dedicated strictly to Sunday Bulk payout dispersals! Come back on Monday to place new stakes for the new cycle.
          </div>
        </div>
      )}

      {/* Fish listings cards */}
      <div className="grid grid-cols-1 gap-4">
        {computedList.map((spec) => {
          const earns = getProTestedEarns(spec);
          const activeDaysCount = activeDays;
          
          return (
            <div
              key={spec.id}
              onClick={() => simulatedDay.trim().toLowerCase() !== 'sunday' && handleOpenBuyModal(spec)}
              className={`bg-brand-box/90 border border-cyan-900/30 rounded-2xl p-4 flex items-center gap-5 relative overflow-hidden group transition-all duration-300 ${
                simulatedDay.trim().toLowerCase() === 'sunday' 
                  ? 'opacity-65 cursor-not-allowed' 
                  : 'hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] cursor-pointer active:scale-[0.99]'
              }`}
            >
              {/* Highlight background lines */}
              <div 
                className="absolute right-0 top-0 w-32 h-full opacity-[0.03] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.06]"
                style={{
                  background: `radial-gradient(circle, ${spec.color} 0%, transparent 80%)`
                }}
              />

              {/* Fish Thumbnail with border */}
              <div
                className="w-20 h-20 rounded-xl bg-brand-bg border p-1 rounded-2xl flex items-center justify-center shrink-0"
                style={{ borderColor: `${spec.color}33` }}
              >
                <img
                  src={spec.image}
                  alt={spec.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Specs and content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-100 font-sans">{spec.displayName}</span>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${spec.color}15`, color: spec.color }}
                  >
                    {spec.tag || 'PREMIUM'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-400 font-sans">
                  <div>Price: <span className="font-bold text-slate-200 font-mono">{formatNaira(spec.price)}</span></div>
                  <div>Daily: <span className="font-bold text-slate-200 font-mono">{formatNaira(spec.dailyProfit, true)}</span></div>
                  <div className="col-span-2 text-cyan-400 font-medium">
                    This Week Payout: <span className="font-bold text-emerald-400 font-mono">{formatNaira(earns)}</span> ({activeDaysCount}d active)
                  </div>
                </div>
              </div>

              {simulatedDay.trim().toLowerCase() !== 'sunday' && (
                <div className="w-8 h-8 rounded-full bg-brand-bg/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 flex items-center justify-center text-slate-400 transition-colors border border-cyan-900/20">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Buy dialog Modal inside AnimatePresence */}
      <AnimatePresence>
        {selectedFish && !successMsg && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFish(null)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full max-w-md bg-brand-box border border-cyan-900/50 rounded-t-3xl sm:rounded-2xl p-6 relative z-10 shadow-2xl space-y-5 text-slate-200"
            >
              {/* Product brief */}
              <div className="flex items-center gap-4 border-b border-cyan-900/20 pb-4">
                <div className="w-16 h-16 rounded-xl bg-brand-bg p-1 border border-cyan-900/30 flex items-center justify-center">
                  <img
                    src={selectedFish.image}
                    alt={selectedFish.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans text-white">{selectedFish.displayName}</h3>
                  <p className="text-xs text-slate-400 font-mono">Cost Per Unit: {formatNaira(selectedFish.price)}</p>
                </div>
              </div>

              {/* Quantity selector */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Select Quantity</span>
                <div className="flex items-center justify-between bg-brand-bg p-3 rounded-xl border border-cyan-900/30">
                  <button
                    onClick={decrementQty}
                    className="w-10 h-10 border border-cyan-900/30 hover:border-cyan-500/50 bg-brand-box flex items-center justify-center text-xl text-slate-300 rounded-lg active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <span className="text-2xl font-black font-mono text-cyan-400">{qty}</span>
                  <button
                    onClick={incrementQty}
                    className="w-10 h-10 border border-cyan-900/30 hover:border-cyan-500/50 bg-brand-box flex items-center justify-center text-xl text-slate-300 rounded-lg active:scale-95 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Financial calculator summary */}
              <div className="bg-brand-bg/50 p-4 rounded-xl border border-cyan-900/30 text-xs space-y-2.5 font-sans">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Capital Required:</span>
                  <span className="text-white font-bold font-mono">{formatNaira(selectedFish.price * qty)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pro-rated weekly profit:</span>
                  <span className="text-emerald-400 font-bold font-mono">+{formatNaira(getProRatedDailyEarnings(selectedFish) * qty)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Simulated Days remaining:</span>
                  <span className="text-cyan-400 font-bold font-mono">{activeDays} Days</span>
                </div>
                <div className="border-t border-cyan-900/30 my-2 pt-2 flex items-center justify-between">
                  <span>Balance After Purchase:</span>
                  <span className={`font-bold font-mono ${walletBalance >= (selectedFish.price * qty) ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {formatNaira(walletBalance - (selectedFish.price * qty))}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5 p-2 bg-rose-500/10 rounded-lg border border-rose-500/25">
                  <span className="text-sm">⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFish(null)}
                  className="py-3 bg-brand-bg hover:bg-brand-bg/80 border border-cyan-900/30 rounded-xl text-xs text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={isSubmitting || walletBalance < (selectedFish.price * qty)}
                  className="py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/15 disabled:opacity-50 disabled:grayscale transition-all"
                >
                  {isSubmitting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>Stake Now</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

            {/* Success Modal screen */}
            <AnimatePresence>
              {successMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="absolute inset-0 bg-brand-bg" />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm bg-brand-box border border-cyan-900/50 rounded-2xl p-6 relative z-10 text-center space-y-5 shadow-2xl"
                  >
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
                      🎉
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-white">Farming Started Successfully!</h3>
                      <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                        Your fish is farming! You will earn daily rewards, and Sunday payouts unlock every Sunday.
                      </p>
                    </div>
                    <button
                      onClick={handleSuccessDone}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/10"
                    >
                      Go to My Pond
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
    </div>
  );

  function getProTestedEarns(key: FishType) {
    return getProRatedDailyEarnings(key);
  }
}
