import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, FishHolding, Transaction, FISH_SPECS } from './types.ts';
import { formatNaira } from './utils.ts';

// Dynamic Sub-components
import OnboardingFlow from './components/OnboardingFlow.tsx';
import TabMarket from './components/TabMarket.tsx';
import TabPond from './components/TabPond.tsx';
import TabDeposit from './components/TabDeposit.tsx';
import TabWithdraw from './components/TabWithdraw.tsx';
import TabInvite from './components/TabInvite.tsx';
import TabRanks from './components/TabRanks.tsx';
import AdminPanel from './components/AdminPanel.tsx';

// Icons
import { Compass, Database, Landmark, Heart, Users, Trophy, Bell, HelpCircle, Activity, ShieldCheck } from 'lucide-react';

export default function App() {
  const [simulatedId, setSimulatedId] = useState(() => {
    const existing = localStorage.getItem('fishinvest_user_id');
    if (existing) return existing;
    const newId = `tel_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('fishinvest_user_id', newId);
    return newId;
  });
  const [simulatedName, setSimulatedName] = useState('Clinton N.');
  const [simulatedDay, setSimulatedDay] = useState(() => {
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return DAYS_OF_WEEK[new Date().getDay()];
  });

  const [user, setUser] = useState<User | null>(null);
  const [holdings, setHoldings] = useState<FishHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralLogs, setReferralLogs] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [activeTab, setActiveTab ] = useState('market');
  const [notificationLog, setNotificationLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Parse deep-link referral URL query parameter if present
  const [referredByQuery, setReferredByQuery] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferredByQuery(ref);
      addNotification(`🔗 Launching with referral code: ${ref}`);
    }
  }, []);

  const addNotification = (msg: string) => {
    setNotificationLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const clearNotificationLogs = () => setNotificationLog([]);

  const [marketCatalog, setMarketCatalog] = useState<any[]>([]);

  // Real-time synchronization of users, holdings, transactions, and catalogs via restful polling
  const loadUserData = async () => {
    if (!simulatedId) return;

    try {
      // 1. Fetch user profile data
      const userRes = await fetch(`/api/users/${simulatedId}`);
      if (userRes.ok) {
        const uData = await userRes.json();
        setUser(uData);
      } else {
        setUser(null);
      }

      // 2. Fetch active holdings pond and transaction history mapping
      const syncRes = await fetch(`/api/users/${simulatedId}/sync`);
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setHoldings(syncData.holdings || []);
        setTransactions(syncData.transactions || []);

        const refList = (syncData.transactions || []).filter((tx: Transaction) => tx.type === 'referral');
        setReferralLogs(refList);
      }

      // 3. Fetch dynamic market catalog
      const catRes = await fetch('/api/market-fish');
      if (catRes.ok) {
        const catData = await catRes.json();
        setMarketCatalog(catData.fish || []);
      }

      // 4. Fetch leaderboard rankings
      const leaderRes = await fetch('/api/leaderboard');
      if (leaderRes.ok) {
        const leaderData = await leaderRes.json();
        setLeaderboard(leaderData);
      }
    } catch (err) {
      console.error('Error synchronizing real-time datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!simulatedId) return;

    // Initial load
    setLoading(true);
    loadUserData();

    // Setup active real-time rest-polling interval matching requirements
    const interval = setInterval(() => {
      loadUserData();
    }, 2500);

    return () => clearInterval(interval);
  }, [simulatedId]);

  const handleOnboardCompleted = (updatedUser: User) => {
    setUser(updatedUser);
    addNotification('✅ Welcome verified! Your Dedicated Providus Bank virtual account has been created.');
    loadUserData();
  };

  // Render proper tab panel contents
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'market':
        return (
          <TabMarket
            walletBalance={user.walletBalance}
            telegramId={simulatedId}
            simulatedDay={simulatedDay}
            onPurchaseSuccess={loadUserData}
            setActiveTab={setActiveTab}
            addNotification={addNotification}
            marketCatalog={marketCatalog}
          />
        );
      case 'pond':
        return (
          <TabPond
            user={user}
            holdings={holdings}
            simulatedDay={simulatedDay}
            onFeedSuccess={loadUserData}
            addNotification={addNotification}
            setActiveTab={setActiveTab}
          />
        );
      case 'deposit':
        return (
          <TabDeposit
            user={user}
            transactions={transactions}
            onDepositSuccess={loadUserData}
            addNotification={addNotification}
          />
        );
      case 'withdraw':
        return (
          <TabWithdraw
            user={user}
            transactions={transactions}
            simulatedDay={simulatedDay}
            onWithdrawSuccess={loadUserData}
            addNotification={addNotification}
            holdings={holdings}
          />
        );
      case 'invite':
        return (
          <TabInvite
            user={user}
            referralLogs={referralLogs}
            addNotification={addNotification}
          />
        );
      case 'ranks':
        return (
          <TabRanks
            currentUser={user}
            leaderboard={leaderboard}
          />
        );
      default:
        return null;
    }
  };

  if (showAdminPanel) {
    return <AdminPanel onBackToApp={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Real-time Administrative Suspension Blocking Screen */}
      {user && user.status === 'suspended' && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/15 text-rose-500 border border-rose-500/30 rounded-full flex items-center justify-center text-4xl animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            🛑
          </div>
          <div className="space-y-3 max-w-sm">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Farmer Account Suspended</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your FishInvest operator account context has been frozen by the administration system review team. Breeding stakes and Sunday payouts are currently locked.
            </p>
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-rose-500/20 text-[10px] text-cyan-400 font-mono leading-relaxed">
              Please contact the dashboard system operators at <span className="font-bold underline text-white">idehenclintonn@gmail.com</span> for manual verification and KYC clearance.
            </div>
          </div>
          
          <button
            onClick={() => setShowAdminPanel(true)}
            className="px-5 py-2.5 bg-brand-box border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/10 active:scale-95 transition-transform text-xs cursor-pointer font-bold"
          >
            🔑 Log into Admin Panel
          </button>
        </div>
      )}
      
      {/* Floating Animated Bubbles background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-20 right-5 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Low-profile Admin Console operators key shortcut */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowAdminPanel(true)}
          className="bg-brand-box/95 p-2 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/15 active:scale-95 transition-all text-[11px] font-bold font-sans cursor-pointer flex items-center gap-1 shadow-lg shadow-cyan-500/5"
          title="Open Admin System Panel"
        >
          <span>🔑 Admin System</span>
        </button>
      </div>

      {loading && !user ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs text-cyan-400 font-mono">Initializing Marine Node...</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-xl w-full mx-auto px-4 pt-6 pb-24 z-10 relative">
          
          {/* Header Dashboard section (only shown if onboarded) */}
          {user && user.name && (
            <header className="flex items-center justify-between mb-6 p-4 bg-brand-box/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl shadow-[0_0_15px_rgba(56,189,248,0.1)] font-sans">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  🐟
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-white tracking-tight">FishInvest</h1>
                  <span className="text-[10px] font-mono text-cyan-400 inline-block uppercase bg-cyan-500/15 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                    {user.level}
                  </span>
                </div>
              </div>
              
              <div className="text-right mr-20">
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Current Day</div>
                <div className="text-xs font-black font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg inline-block">
                  {simulatedDay}
                </div>
              </div>
            </header>
          )}

          {/* Core Body content */}
          <main className="flex-1">
            {user && !user.name ? (
              /* Enforces Onboarding Requirement */
              <div className="py-4">
                <OnboardingFlow
                  telegramId={simulatedId}
                  onboardedUser={handleOnboardCompleted}
                  referredByQueryParam={referredByQuery}
                />
              </div>
            ) : (
              /* Active Tab Render */
              <div className="transition-all duration-300">
                {renderTabContent()}
              </div>
            )}
          </main>

          {/* Bottom navigation bar */}
          {user && user.name && (
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-xl w-full bg-brand-box/95 border-t border-cyan-900/50 p-2.5 grid grid-cols-6 text-center z-40 backdrop-blur-md rounded-t-3xl shadow-[0_-5px_25px_rgba(2,21,26,0.6)]">
              
              {/* Market */}
              <button
                onClick={() => setActiveTab('market')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'market' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">🏪</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Market</span>
              </button>

              {/* My Pond */}
              <button
                onClick={() => setActiveTab('pond')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'pond' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">🌊</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Pond</span>
              </button>

              {/* Deposit */}
              <button
                onClick={() => setActiveTab('deposit')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'deposit' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Deposit</span>
              </button>

              {/* Withdraw */}
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'withdraw' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">💰</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Payout</span>
              </button>

              {/* Invite */}
              <button
                onClick={() => setActiveTab('invite')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'invite' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-450 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">🎣</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Invite</span>
              </button>

              {/* Ranks */}
              <button
                onClick={() => setActiveTab('ranks')}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all rounded-xl border ${
                  activeTab === 'ranks' 
                    ? 'text-cyan-400 bg-brand-bg/60 border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <span className="text-lg">🏆</span>
                <span className="text-[9px] tracking-wider uppercase font-bold font-sans">Ranks</span>
              </button>

            </nav>
          )}

        </div>
      )}

    </div>
  );
}
