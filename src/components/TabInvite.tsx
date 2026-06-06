import React from 'react';
import { User, Transaction } from '../types.ts';
import { formatNaira } from '../utils.ts';
import { Share2, Copy, Send, Check, Users, Sparkles, Award } from 'lucide-react';

interface TabInviteProps {
  user: User;
  referralLogs: any[]; // referrals collection documents matching referrerId
  addNotification: (msg: string) => void;
}

export default function TabInvite({
  user,
  referralLogs,
  addNotification,
}: TabInviteProps) {
  const [copied, setCopied] = React.useState(false);

  const referralUrl = `https://t.me/fishinvestbot?ref=${user.telegram_id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    addNotification('📋 Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🎣 Invest in real fish with FishInvest! Buy virtual fish and earn daily pro-rated profit. Weekly Saturday reminders and Sunday automatic cash-outs! Join here:`
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`;
    window.open(url, '_blank');
  };

  // Compute invite totals
  const totalInvited = referralLogs.length;
  const activeReferrals = referralLogs.length; // Counted since logs are only written on first stake purchase
  const totalEarningsAmt = referralLogs.reduce((sum, log) => sum + (log.bonusAmount || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent font-sans">
          Invite Friends, Earn NGN
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Get rewarded for building our marine breeding network. Refer allies and earn 10% of their first purchase instantly credited straight to your balance.
        </p>
      </div>

      {/* Invitation Deep-link card */}
      <div className="bg-brand-box border border-cyan-900/40 p-4 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(2,21,26,0.4)]">
        <div className="space-y-1 border-b border-cyan-900/20 pb-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Your Unique Invite Link</span>
          <span className="text-xs font-mono text-cyan-400 break-all select-all font-semibold block">
            {referralUrl}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 py-3 px-4 bg-brand-bg hover:bg-brand-bg/80 border border-cyan-900/30 rounded-xl font-semibold text-xs text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Copy className="w-4 h-4 text-cyan-450" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShareTelegram}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Share on Telegram</span>
          </button>
        </div>
      </div>

      {/* Aggregate Invite Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Friends count */}
        <div className="bg-brand-box p-4 border border-cyan-900/30 rounded-xl text-center space-y-1 shadow-sm">
          <Users className="w-4.5 h-4.5 mx-auto text-slate-400" />
          <span className="text-[9px] text-slate-400 uppercase block font-medium">Friends Invited</span>
          <span className="font-mono font-bold text-base text-white">{totalInvited}</span>
        </div>

        {/* Active referrers */}
        <div className="bg-brand-box p-4 border border-cyan-900/30 rounded-xl text-center space-y-1 shadow-sm font-sans">
          <Sparkles className="w-4.5 h-4.5 mx-auto text-cyan-400 animate-pulse" />
          <span className="text-[9px] text-slate-400 uppercase block font-medium">Active referrals</span>
          <span className="font-mono font-bold text-base text-cyan-400">{activeReferrals}</span>
        </div>

        {/* Earned NGN */}
        <div className="bg-brand-box p-4 border border-cyan-900/30 rounded-xl text-center space-y-1 shadow-sm font-sans">
          <Award className="w-4.5 h-4.5 mx-auto text-orange-400" />
          <span className="text-[9px] text-slate-400 uppercase block font-medium">Referral Earnings</span>
          <span className="font-mono font-bold text-xs text-cyan-400 truncate block">{formatNaira(totalEarningsAmt)}</span>
        </div>
      </div>

      {/* 3 Steps Pipeline Explained */}
      <div className="bg-brand-box border border-cyan-900/45 p-5 rounded-2xl space-y-4 shadow-xl">
        <h4 className="font-sans font-bold text-sm text-white uppercase tracking-wider">How Invitation Matrix Works</h4>
        
        <div className="space-y-4 font-sans text-xs">
          
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-bg border border-cyan-900/30 flex items-center justify-center font-bold text-cyan-400 shrink-0">
              1
            </span>
            <div className="space-y-0.5">
              <h5 className="font-semibold text-slate-250">Share your Referral link</h5>
              <p className="text-slate-400 leading-relaxed">Let them launch the FishInvest Telegram Mini App using your custom handle deep-link.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-bg border border-cyan-900/30 flex items-center justify-center font-bold text-cyan-400 shrink-0">
              2
            </span>
            <div className="space-y-0.5">
              <h5 className="font-semibold text-slate-250">Referee Completes KYC</h5>
              <p className="text-slate-400 leading-relaxed">Your friend fulfills the bank account security verification. This unlocks the market.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-bg border border-cyan-900/30 flex items-center justify-center font-bold text-cyan-400 shrink-0">
              3
            </span>
            <div className="space-y-0.5">
              <h5 className="font-semibold text-slate-250">They Start Harvesting</h5>
              <p className="text-slate-400 leading-relaxed">As soon as they buy their first virtual fish (such as a Meluza and more), you earn 10% of their staking volume instantly!</p>
            </div>
          </div>

        </div>
      </div>

      {/* Invitations Ledger table logs */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-sans">Active Invites List</h4>
        {referralLogs.length === 0 ? (
          <div className="text-center py-6 bg-brand-box/50 border border-cyan-900/30 rounded-xl text-slate-500 text-xs italic">
            You haven't referred anyone yet. Share your deep link to get started!
          </div>
        ) : (
          <div className="space-y-2 font-sans font-mono text-xs">
            {referralLogs.map((log, idx) => (
              <div key={idx} className="bg-brand-box border border-cyan-900/20 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-300 text-xs font-semibold font-sans">{log.refereeName}</span>
                  <span className="text-[10px] text-slate-550 block">Invited {new Date(log.paidAt).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-extrabold text-sm block">+{formatNaira(log.bonusAmount)}</span>
                  <span className="text-[9px] text-cyan-400 font-bold block uppercase bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
                    Paid
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
