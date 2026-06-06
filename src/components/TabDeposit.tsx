import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Transaction } from '../types.ts';
import { formatNaira } from '../utils.ts';
import { CreditCard, Copy, Check, ChevronRight, Activity, Zap, Loader2 } from 'lucide-react';

interface TabDepositProps {
  user: User;
  transactions: Transaction[];
  onDepositSuccess: () => void;
  addNotification: (msg: string) => void;
}

export default function TabDeposit({
  user,
  transactions,
  onDepositSuccess,
  addNotification,
}: TabDepositProps) {
  const [copied, setCopied] = React.useState(false);
  const [isFunding, setIsFunding] = React.useState<number | null>(null);

  const depositTransactions = React.useMemo(() => {
    return transactions.filter(t => t.type === 'deposit');
  }, [transactions]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(user.virtualAccountNumber);
    setCopied(true);
    addNotification('📋 Providus virtual account number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Triggers simulator deposit credit route (Simulates Bank API webhook)
  const handleQuickDeposit = async (amount: number) => {
    setIsFunding(amount);
    try {
      const response = await fetch(`/api/users/${user.telegram_id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to trigger simulated deposit');
      }

      addNotification(resData.message || `✅ Successfully deposited ₦${amount}!`);
      onDepositSuccess();
    } catch (err: any) {
      alert(err.message || 'Deposit simulation failed');
    } finally {
      setIsFunding(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Dynamic current card balance */}
      <div className="bg-brand-box border border-cyan-900/40 p-5 rounded-2xl space-y-1 shadow-[0_4px_20px_rgba(2,21,26,0.4)] relative overflow-hidden">
        <div className="absolute right-[-20px] bottom-[-20px] text-cyan-550/5 select-none text-[120px] font-sans">
          ₦
        </div>
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Wallet Balance</span>
        <h3 className="text-4xl font-black text-cyan-400 font-mono tracking-tight">
          {formatNaira(user.walletBalance)}
        </h3>
        <p className="text-[10px] text-slate-400 font-sans pt-1">
          Each deposit is credited automatically via the Providus Bank automated web service.
        </p>
      </div>

      {/* Your Dedicated Virtual Account Card */}
      <div className="bg-brand-box/90 border border-cyan-900/30 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400">
          <CreditCard className="w-5 h-5 text-cyan-400 shrink-0" />
          <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wider">Your Virtual Bank Transfer Account</h4>
        </div>

        <div className="bg-brand-bg p-4 rounded-xl border border-cyan-900/30 space-y-3 font-sans relative">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Bank Provider</span>
              <span className="text-xs font-bold text-slate-200">Providus Bank Plc</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Beneficiary name</span>
              <span className="text-xs font-bold text-slate-200 max-w-[140px] truncate block">{user.name || 'Unregistered Farmer'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-cyan-900/20 flex justify-between items-end">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Account Number</span>
              <span className="text-lg font-black font-mono text-cyan-300 tracking-widest">{user.virtualAccountNumber}</span>
            </div>
            <button
              onClick={handleCopyAccount}
              className="p-2 rounded-lg bg-brand-box hover:bg-brand-box/80 transition-colors border border-cyan-900/40 flex items-center justify-center gap-1.5 text-xs text-cyan-400 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="font-semibold text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Transfer any amount to this Providus Bank account. The funds are routed instantly to your farming wallet balance (Nigeria local bank rates apply). Minimum deposit is ₦1,500.
        </p>
      </div>

      {/* Quick deposit simulator triggers */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Zap className="w-4 h-4 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Simulate Naira Bank Transfer (Sandbox)</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 font-sans">
          {[1500, 5000, 10000, 20000, 50000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickDeposit(amount)}
              disabled={isFunding !== null}
              className="py-3 px-4 bg-brand-box hover:bg-brand-box/80 border border-cyan-900/30 hover:border-cyan-500/50 transition-all rounded-xl text-left flex items-center justify-between text-xs text-slate-200 relative overflow-hidden group cursor-pointer disabled:opacity-50"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Transfer Amount</span>
                <span className="font-bold text-base font-mono group-hover:text-cyan-400 transition-colors">+{formatNaira(amount)}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center border border-cyan-900/10">
                {isFunding === amount ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-450 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ledger lists (deposits checklist) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-4 h-4" />
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Deposit History</h4>
        </div>

        {depositTransactions.length === 0 ? (
          <div className="text-center py-6 bg-brand-box/50 border border-cyan-900/30 rounded-xl text-slate-500 text-xs italic">
            No deposits credited yet. Try transferring NGN using the sandbox tools above!
          </div>
        ) : (
          <div className="space-y-2 font-sans font-mono text-xs">
            {depositTransactions.map((tx, idx) => (
              <div key={idx} className="bg-brand-box border border-cyan-900/30 p-3.5 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-slate-300 text-xs font-semibold">Providus Bank Transfer Credit</span>
                  <span className="text-[10px] text-slate-500 block">{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-extrabold text-sm block">+{formatNaira(tx.amount)}</span>
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
