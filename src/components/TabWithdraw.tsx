import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Transaction, FISH_SPECS } from '../types.ts';
import { formatNaira, getProRatedEarnings, getApiUrl } from '../utils.ts';
import { Lock, Landmark, CheckCircle, Clock, Check, Loader2, ArrowDownRight } from 'lucide-react';

interface TabWithdrawProps {
  user: User;
  transactions: Transaction[];
  simulatedDay: string;
  onWithdrawSuccess: () => void;
  addNotification: (msg: string) => void;
  holdings: any[];
}

export default function TabWithdraw({
  user,
  transactions,
  simulatedDay,
  onWithdrawSuccess,
  addNotification,
  holdings,
}: TabWithdrawProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [countdownString, setCountdownString] = React.useState('00d 00h 00m 00s');

  const withdrawTransactions = React.useMemo(() => {
    return transactions.filter(t => t.type === 'withdraw');
  }, [transactions]);

  // Compute total Sunday earnings available to withdraw
  const baseWeeklyPayout = holdings.reduce((sum, h) => {
    const earnt = getProRatedEarnings(h.fishType, h.stakedDay);
    return sum + (earnt * h.quantity);
  }, 0);

  // Apply streak bonus (+1% of weekly yields for every 4 consecutive Sundays)
  const hasStreakBonus = user.streakCount > 0 && user.streakCount % 4 === 0;
  const streakBonusVolume = hasStreakBonus ? Math.round(baseWeeklyPayout * 0.01) : 0;
  const totalWeeklyEarnings = baseWeeklyPayout + streakBonusVolume;

  const isSunday = simulatedDay.trim().toLowerCase() === 'sunday';

  // Compute countdown until Sunday dynamically based on both simulatedDay and system date
  React.useEffect(() => {
    if (isSunday) return;

    const dayMap: Record<string, number> = {
      monday: 6, tuesday: 5, wednesday: 4, thursday: 3, friday: 2, saturday: 1
    };
    const daysLeft = dayMap[simulatedDay.trim().toLowerCase()] ?? 1;

    // Simulate ticking minutes/seconds beautifully
    let secondsLeft = daysLeft * 24 * 3600;
    
    const interval = setInterval(() => {
      if (secondsLeft <= 0) {
        setCountdownString('00d 00h 00m 00s');
        clearInterval(interval);
        return;
      }
      secondsLeft -= 1;
      
      const d = Math.floor(secondsLeft / (24 * 3600));
      const h = Math.floor((secondsLeft % (24 * 3600)) / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;
      
      setCountdownString(
        `${d.toString().padStart(2, '0')}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [simulatedDay, isSunday]);

  const handleWithdraw = async () => {
    if (!isSunday) return;
    if (totalWeeklyEarnings <= 0) {
      setErrorMsg('You do not have any pending fish earnings to withdraw this Sunday.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch(getApiUrl(`/api/users/${user.telegram_id}/withdraw`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentDay: simulatedDay }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Withdrawal failed');
      }

      setSuccess(true);
      addNotification(resData.message || `💰 ₦${totalWeeklyEarnings} has been paid successfully!`);
      onWithdrawSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during payout process');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      <AnimatePresence mode="wait">
        {!isSunday ? (
          /* WEEKDAY: LOCKED SECURE screen */
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-brand-box border border-cyan-900/40 rounded-3xl p-8 text-center space-y-6 shadow-[0_4px_25px_rgba(2,21,26,0.3)] relative overflow-hidden"
          >
            {/* Ambient secure background halo */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />

            <div className="w-20 h-20 bg-rose-500/15 text-rose-400 border border-rose-555/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-sans">Withdrawal Vault Locked</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                Sunday payouts are calculated automatically at cycle culmination. Payout gate opens only on Sundays.
              </p>
            </div>

            {/* Countdown timer */}
            <div className="bg-brand-bg max-w-[240px] mx-auto py-3 px-4 border border-cyan-900/30 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Time to Sunday opens</span>
              <span className="text-xl font-black font-mono text-cyan-400 tracking-wider">
                {countdownString}
              </span>
            </div>

            <div className="border-t border-cyan-900/20 pt-4 flex items-center justify-center gap-2 text-rose-400 font-sans text-xs">
              <Clock className="w-4 h-4" />
              <span>Opens on Sunday (00:00 — 23:59)</span>
            </div>
          </motion.div>
        ) : (
          /* SUNDAY: UNLOCKED Vault screen */
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Available to withdraw balance display */}
            <div className="bg-brand-box border border-cyan-900/40 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute right-3 top-3 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/20 text-cyan-450 text-[10px] font-bold font-mono uppercase">
                Opens Sunday
              </div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">Weekly Farming Yield Awarded</span>
              <h3 className="text-4xl font-black text-cyan-400 font-mono tracking-tight">
                {formatNaira(totalWeeklyEarnings)}
              </h3>
              <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                Base harvest: {formatNaira(baseWeeklyPayout)} {hasStreakBonus && `| Streak boost applied (+${formatNaira(streakBonusVolume)})`}
              </p>
            </div>

            {/* Target banking details checklist from KYC onboarding */}
            <div className="bg-brand-box border border-cyan-900/30 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <Landmark className="w-5 h-5" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Registered Beneficiary Details (KYC)</h4>
              </div>

              <div className="bg-brand-bg p-4 rounded-xl border border-cyan-900/30 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-slate-400">
                  <span>Name:</span>
                  <span className="text-slate-200 font-bold">{user.name || 'Un-registered'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Phone:</span>
                  <span className="text-slate-200 font-mono">{user.phone || 'Un-registered'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bank Name:</span>
                  <span className="text-slate-200 font-bold">{user.bankName || 'Un-registered'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Account Number:</span>
                  <span className="text-slate-200 font-mono font-bold tracking-widest">{user.accountNumber || 'Un-registered'}</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 font-sans flex items-center gap-1.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-200">Withdrawal Processed Successfully!</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  Payout of <strong>{formatNaira(totalWeeklyEarnings)}</strong> has been disbursed to your {user.bankName} account via standard API channels.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25">
                    DISBURSED - PAID
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleWithdraw}
                disabled={isSubmitting || totalWeeklyEarnings <= 0}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all font-extrabold text-white text-sm rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/15 cursor-pointer disabled:opacity-50 disabled:grayscale"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <span>Disburse Harvest to Bank ({formatNaira(totalWeeklyEarnings)})</span>
                )}
              </button>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Historic record logs list */}
      <div className="space-y-3 pt-4">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Withdrawal History Ledger</h4>
        {withdrawTransactions.length === 0 ? (
          <div className="text-center py-6 bg-brand-box/50 border border-cyan-900/30 rounded-xl text-slate-500 text-xs italic">
            No sunday withdrawals processed. Lock opening takes place on Sundays!
          </div>
        ) : (
          <div className="space-y-2 font-sans font-mono text-xs">
            {withdrawTransactions.map((tx, idx) => (
              <div key={idx} className="bg-brand-box border border-cyan-900/30 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-300 text-xs font-semibold font-sans">Sunday bulk payout disbursement</span>
                  <span className="text-[10px] text-slate-500 block">{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-rose-400 font-extrabold text-sm block">-{formatNaira(tx.amount)}</span>
                  <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded-full uppercase">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
