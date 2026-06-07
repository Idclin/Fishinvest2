import React from 'react';
import { motion } from 'motion/react';
import { User, FishHolding, FISH_SPECS, FishType } from '../types.ts';
import { formatNaira, getProRatedEarnings, getActiveDays, getApiUrl } from '../utils.ts';
import AnimatedPond from './AnimatedPond.tsx';
import { Trophy, HelpCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

interface TabPondProps {
  user: User;
  holdings: FishHolding[];
  simulatedDay: string;
  onFeedSuccess: () => void;
  addNotification: (msg: string) => void;
  setActiveTab: (tab: string) => void;
  marketCatalog?: any[];
}

export default function TabPond({
  user,
  holdings,
  simulatedDay,
  onFeedSuccess,
  addNotification,
  setActiveTab,
  marketCatalog = [],
}: TabPondProps) {
  const [isFeeding, setIsFeeding] = React.useState(false);
  const [feedError, setFeedError] = React.useState('');

  // Group holdings by fish type + staked day for accurate dashboard logs
  const groupedHoldings = React.useMemo(() => {
    const groups: Record<string, { fishType: FishType; quantity: number; stakedDay: string; earnings: number }> = {};
    
    holdings.forEach((h) => {
      const key = `${h.fishType}_${h.stakedDay}`;
      if (!groups[key]) {
        groups[key] = {
          fishType: h.fishType,
          quantity: 0,
          stakedDay: h.stakedDay,
          earnings: 0
        };
      }
      groups[key].quantity += h.quantity;
      // Pro-rated weekly payout calculation
      groups[key].earnings += getProRatedEarnings(h.fishType, h.stakedDay) * h.quantity;
    });

    return Object.values(groups);
  }, [holdings]);

  // Total weekly earnings sum
  const baseWeeklyPayout = holdings.reduce((sum, h) => {
    const earnt = getProRatedEarnings(h.fishType, h.stakedDay);
    return sum + (earnt * h.quantity);
  }, 0);

  // Streak bonus multiplier: every 4 Sundays = +1%
  const hasStreakBonus = user.streakCount > 0 && user.streakCount % 4 === 0;
  const streakBonusPct = hasStreakBonus ? 1 : 0;
  const streakBonusVolume = Math.round(baseWeeklyPayout * (streakBonusPct / 100));
  const totalWeeklyPayout = baseWeeklyPayout + streakBonusVolume;

  const currentStreakMod = user.streakCount % 4;

  const handleFeed = async () => {
    setIsFeeding(true);
    setFeedError('');
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      const response = await fetch(getApiUrl(`/api/users/${user.telegram_id}/check-in`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todayDate }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Check-in failed');
      }

      addNotification(resData.message || 'Check-in successful!');
      onFeedSuccess();
    } catch (err: any) {
      setFeedError(err.message || 'Error checking in');
    } finally {
      setIsFeeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Animated Floating Pond Screen */}
      <AnimatedPond holdings={groupedHoldings} marketCatalog={marketCatalog} />

      {/* Aggregate payout banner */}
      <div className="bg-brand-box border border-cyan-900/40 p-5 rounded-2xl space-y-3 shadow-[0_4px_20px_rgba(2,21,26,0.4)]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Estimated Sunday Payout</span>
            <span className="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">{formatNaira(totalWeeklyPayout)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Base: {formatNaira(baseWeeklyPayout)}</span>
            {hasStreakBonus && <span className="text-xs text-cyan-400 font-mono block">Streak Bonus: +{formatNaira(streakBonusVolume)}</span>}
          </div>
        </div>

        {/* Streak bonus progress track */}
        <div className="border-t border-cyan-900/20 pt-3 space-y-1.5 font-sans">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              🔥 Sunday Streak Count: <span className="text-orange-400 font-bold font-mono">{user.streakCount} weeks</span>
            </span>
            <span className="text-cyan-400 font-bold font-mono text-[10px] uppercase">
              {streakBonusPct > 0 ? 'Bonus active (+1% yield)' : `${4 - currentStreakMod} sundays left for +1% yield`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(currentStreakMod / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Profile & Level grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Level badge */}
        <div className="bg-brand-box border border-cyan-900/30 rounded-2xl p-4 flex flex-col justify-between space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Farmer Rank</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧑‍🌾</span>
            <span className="font-bold text-sm text-slate-200">{user.level || 'Beginner Farmer'}</span>
          </div>
        </div>

        {/* Feeding status/Feed points */}
        <div className="bg-brand-box border border-cyan-900/30 rounded-2xl p-4 flex flex-col justify-between space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Feed points</span>
          <div className="flex items-center gap-2">
            <span className="text-lg">🍪</span>
            <span className="font-mono font-bold text-base text-slate-200">{user.points || 0} pts</span>
          </div>
        </div>
      </div>

      {/* Saturday reminder text */}
      {simulatedDay.trim().toLowerCase() === 'saturday' && (
        <div className="bg-cyan-500/10 border border-cyan-400/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-cyan-300 block font-sans">Saturday Reminder!</strong>
            Don't forget — Sunday Bulk Withdrawals open tomorrow morning! All your farmed harvests will be synchronized and ready to transfer.
          </div>
        </div>
      )}

      {/* Feed Fish Daily Check-in Button */}
      <div className="bg-brand-box border border-cyan-900/40 p-4 rounded-xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-slate-200">Daily Feeding routine</h4>
            <p className="text-[11px] text-slate-400 font-medium">Feed your fish every 24h to claim +10 points!</p>
          </div>
          <button
            onClick={handleFeed}
            disabled={isFeeding}
            className="py-1.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            {isFeeding ? 'Feeding...' : 'Feed Your Fish'}
          </button>
        </div>
        {feedError && <p className="text-xs text-rose-400 font-mono">{feedError}</p>}
      </div>

      {/* Owned fish listings list */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Breeding Stock inventory</h4>
        {groupedHoldings.length === 0 ? (
          <div className="text-center py-8 bg-brand-box/50 border-2 border-dashed border-cyan-900/30 rounded-2xl text-slate-500 text-xs flex flex-col items-center gap-3">
            <p>You do not own any farming assets in this cycle yet.</p>
            <button
              onClick={() => setActiveTab('market')}
              className="py-1.5 px-3 bg-brand-bg hover:bg-brand-bg/85 border border-cyan-500/30 rounded-lg text-cyan-400 text-[11px] font-bold transition-all shadow-md"
            >
              Examine Fish Market
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedHoldings.map((h, index) => {
              const spec = FISH_SPECS[h.fishType] || (() => {
                const custom = marketCatalog.find((m: any) => m.name === h.fishType || m.id === h.fishType);
                if (!custom) return null;
                return {
                  displayName: custom.displayName,
                  image: custom.image || custom.photo_url || custom.photoUrl,
                  price: custom.price,
                  dailyProfit: custom.dailyProfit !== undefined ? custom.dailyProfit : custom.daily_profit,
                  weeklyProfit: custom.weeklyProfit !== undefined ? custom.weeklyProfit : custom.weekly_profit,
                };
              })();
              return (
                <div key={index} className="bg-brand-box border border-cyan-900/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-brand-bg border border-cyan-900/20 flex items-center justify-center p-1">
                      <img src={spec?.image} alt={spec?.displayName} referrerPolicy="no-referrer" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                        {spec?.displayName}
                        <span className="text-xs font-mono font-normal text-slate-400">({h.quantity} owned)</span>
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Staked: {h.stakedDay} ({getActiveDays(h.stakedDay)}d active)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-cyan-400 font-extrabold font-mono text-sm block">+{formatNaira(h.earnings)}</span>
                    <span className="text-[9px] text-slate-500 block">Sunday Return</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
