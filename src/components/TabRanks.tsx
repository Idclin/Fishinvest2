import React from 'react';
import { User } from '../types.ts';
import { formatNaira } from '../utils.ts';
import { Award, Trophy, Medal, Flame, Sparkles } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  level: string;
  walletBalance: number;
}

interface TabRanksProps {
  currentUser: User;
  leaderboard: LeaderboardUser[];
}

export default function TabRanks({ currentUser, leaderboard }: TabRanksProps) {
  // Map level to fish emoji
  const getFishEmoji = (level: string) => {
    switch (level) {
      case 'Master Farmer':
        return '🐳';
      case 'Pro Farmer':
        return '🦈';
      case 'Farmer':
        return '🐠';
      default:
        return '🐟';
    }
  };

  // Find current user index (or append dynamically if not inside fetched rankings)
  const sortedLeaderboard = React.useMemo(() => {
    const list = [...leaderboard];
    const exists = list.some(item => item.id === currentUser.telegram_id);
    
    if (!exists && currentUser.name) {
      list.push({
        id: currentUser.telegram_id,
        name: currentUser.name,
        points: currentUser.points,
        level: currentUser.level,
        walletBalance: currentUser.walletBalance
      });
    }

    // Sort: balance * 1.5 + points
    list.sort((a, b) => (b.walletBalance * 1.5 + b.points) - (a.walletBalance * 1.5 + a.points));
    return list;
  }, [leaderboard, currentUser]);

  const currentUserRankIndex = sortedLeaderboard.findIndex(item => item.id === currentUser.telegram_id);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent font-sans">
          Farmers Tournament Rankings
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Staking, daily check-ins, and successful Sunday payout streaks elevate your status in our oceanic farming tournament. Top farmers share legendary rewards.
        </p>
      </div>

      {/* Season 1 Prize Bento Card mockup */}
      <div className="bg-brand-box border border-cyan-900/40 p-5 rounded-2xl relative overflow-hidden shadow-[0_4px_25px_rgba(2,21,26,0.4)] space-y-4">
        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />

        <div className="flex items-center gap-2.5 text-amber-400">
          <Trophy className="w-5 h-5 animate-bounce shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-sans">Season 1 Tournament Active</span>
        </div>

        <div className="space-y-1.5 relative z-10">
          <h3 className="text-2xl font-black text-white flex items-center gap-1.5 font-sans">
            Bulk Prize Pool: <span className="bg-gradient-to-r from-yellow-400 to-amber-550 bg-clip-text text-transparent font-mono font-black">₦500,000</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
            Top 3 agricultural breeders share the ₦500,000 season bonanza. Standings are locked at the season completion countdown.
          </p>
        </div>

        {/* Progress track/Season countdown */}
        <div className="flex justify-between items-center text-xs border-t border-cyan-900/20 pt-3 relative z-10 font-sans">
          <span className="text-slate-400 font-semibold uppercase tracking-wider block">Remaining Timer</span>
          <span className="text-cyan-450 font-bold font-mono uppercase bg-cyan-500/15 border border-cyan-500/20 px-2.5 py-0.5 rounded-full shadow-inner">
            22 days left
          </span>
        </div>
      </div>

      {/* High-visibility leaderboard rankings */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Farmers Leaderboard</h4>

        <div className="space-y-2 font-sans font-mono text-xs">
          {sortedLeaderboard.map((item, idx) => {
            const isSelf = item.id === currentUser.telegram_id;
            const fishEmoji = getFishEmoji(item.level);

            // Badges for top 3 spots
            let badgeComponent = null;
            if (idx === 0) {
              badgeComponent = <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />;
            } else if (idx === 1) {
              badgeComponent = <Medal className="w-4 h-4 text-slate-300 shrink-0" />;
            } else if (idx === 2) {
              badgeComponent = <Medal className="w-4 h-4 text-amber-600 shrink-0" />;
            } else {
              badgeComponent = <span className="text-[10px] text-slate-500 font-bold w-4 text-center">{idx + 1}</span>;
            }

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isSelf
                    ? 'bg-cyan-500/10 border-cyan-400/40 relative font-bold'
                    : 'bg-brand-box border border-cyan-900/30 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Badge place */}
                  <div className="w-6 h-6 rounded-full bg-brand-bg flex items-center justify-center border border-cyan-900/20 shrink-0">
                    {badgeComponent}
                  </div>

                  {/* Fish Level Emojis */}
                  <span className="text-lg shrink-0">{fishEmoji}</span>

                  <div className="space-y-0.5 font-sans">
                    <span className={`text-slate-100 font-semibold block max-w-[130px] truncate ${isSelf && 'text-cyan-300'}`}>
                      {item.name} {isSelf && <span className="text-[9px] font-mono font-bold bg-cyan-400/20 px-1 py-0.2 rounded text-cyan-200">YOU</span>}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block uppercase">
                      {item.level} | {item.points} Feed Points
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-200 font-black font-mono block">{formatNaira(item.walletBalance)}</span>
                  <span className="text-[9px] text-slate-500 block font-normal font-sans">Agricultural Assets</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
