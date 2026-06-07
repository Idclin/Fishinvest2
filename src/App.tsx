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
import { Compass, Database, Landmark, Heart, Users, Trophy, Bell, HelpCircle, Activity, ShieldCheck, LogOut } from 'lucide-react';
import UserAuth from './components/UserAuth.tsx';

export default function App() {
  const [simulatedId, setSimulatedId] = useState<string | null>(() => {
    return localStorage.getItem('fishinvest_user_id') || null;
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

  // Administrative Hidden Gate States
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return localStorage.getItem('fishinvest_admin_unlocked') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [headerClickCount, setHeaderClickCount] = useState(0);

  // Parse deep-link referral URL query parameter if present
  const [referredByQuery, setReferredByQuery] = useState<string | null>(null);

  useEffect(() => {
    // Hidden keystroke shortcut: Alt+Shift+A or Ctrl+Shift+A to reveal credential check
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.shiftKey && e.key.toLowerCase() === 'a') || 
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setShowAdminLoginModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (headerClickCount === 0) return;
    const timer = setTimeout(() => setHeaderClickCount(0), 3000);
    return () => clearTimeout(timer);
  }, [headerClickCount]);

  const handleLogoClick = () => {
    setHeaderClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowAdminLoginModal(true);
        addNotification("🔒 Operator system credentials requested");
        return 0;
      }
      return next;
    });
  };

  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminSubmitting(true);
    setAdminLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Identity verification failed');
      }
      localStorage.setItem('fishinvest_admin_unlocked', 'true');
      setIsAdminUnlocked(true);
      setShowAdminLoginModal(false);
      setShowAdminPanel(true);
      setAdminEmail('');
      setAdminPassword('');
    } catch (err: any) {
      setAdminLoginError(err.message);
    } finally {
      setIsAdminSubmitting(false);
    }
  };

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

  // Real-time synchronization of users, holdings, transactions, and catalogs via resilient restful polling
  const loadUserData = async () => {
    if (!simulatedId) return;

    const fetchJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null; // Ignore HTML or non-JSON fallback pages
        }
        return await res.json();
      } catch (err) {
        return null;
      }
    };

    try {
      // 1. Fetch user profile data
      const uData = await fetchJson(`/api/users/${simulatedId}`);
      if (uData) {
        setUser(uData);
      }

      // 2. Fetch active holdings pond and transaction history mapping
      const syncData = await fetchJson(`/api/users/${simulatedId}/sync`);
      if (syncData) {
        setHoldings(syncData.holdings || []);
        setTransactions(syncData.transactions || []);

        const refList = (syncData.transactions || []).filter((tx: Transaction) => tx.type === 'referral');
        setReferralLogs(refList);
      }

      // 3. Fetch dynamic market catalog
      const catData = await fetchJson('/api/market-fish');
      if (catData && Array.isArray(catData.fish)) {
        const mapped = catData.fish.map((item: any) => ({
          ...item,
          id: item.$id || item.id || item.name,
          displayName: item.displayName || item.display_name || item.name,
          price: item.price,
          dailyProfit: item.dailyProfit !== undefined ? item.dailyProfit : item.daily_profit,
          weeklyProfit: item.weeklyProfit !== undefined ? item.weeklyProfit : item.weekly_profit,
          image: item.image || item.photo_url || item.photoUrl,
          limited: !!(item.limited !== undefined ? item.limited : item.is_limited),
          unitsLimit: item.unitsLimit !== undefined ? item.unitsLimit : item.units_limit,
          unitsSold: item.unitsSold !== undefined ? item.unitsSold : item.units_sold,
        }));
        setMarketCatalog(mapped);
      }

      // 4. Fetch leaderboard rankings
      const leaderData = await fetchJson('/api/leaderboard');
      if (leaderData) {
        setLeaderboard(leaderData);
      }
    } catch (err) {
      console.error('Error synchronizing real-time datasets:', err);
    } finally {
      if (simulatedId) {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fishinvest_user_id');
    localStorage.removeItem('fishinvest_admin_unlocked');
    setSimulatedId(null);
    setUser(null);
    setIsAdminUnlocked(false);
    addNotification('🔒 Security session ended. Logged out.');
  };

  useEffect(() => {
    if (!simulatedId) return;

    if (simulatedId === 'admin_owner') {
      localStorage.setItem('fishinvest_admin_unlocked', 'true');
      setIsAdminUnlocked(true);
    }

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
            marketCatalog={marketCatalog}
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

  if (!simulatedId) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col font-sans relative overflow-x-hidden justify-center items-center">
        {/* Floating Animated Bubbles background decoration */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-20 right-5 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        
        <UserAuth 
          referredByQueryParam={referredByQuery} 
          onAuthSuccess={(u: any) => {
            localStorage.setItem('fishinvest_user_id', u.telegram_id);
            setSimulatedId(u.telegram_id);
            setUser(u);
            if (u.telegram_id === 'admin_owner' || u.email === 'idehenclintonn@gmail.com') {
              localStorage.setItem('fishinvest_admin_unlocked', 'true');
              setIsAdminUnlocked(true);
              setShowAdminPanel(true);
            }
            addNotification(`🛡️ Authorized successfully: ${u.name || u.email}`);
          }} 
        />
      </div>
    );
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
            onClick={() => {
              if (isAdminUnlocked) {
                setShowAdminPanel(true);
              } else {
                setShowAdminLoginModal(true);
              }
            }}
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

      {/* Hidden Admin Console operators shortcut - Only visible once credentials verified */}
      {isAdminUnlocked && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowAdminPanel(true)}
            className="bg-brand-box/95 p-2 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/15 active:scale-95 transition-all text-[11px] font-bold font-sans cursor-pointer flex items-center gap-1 shadow-lg shadow-cyan-500/5 animate-bounce"
            title="Open Admin System Panel"
          >
            <span>🔑 Admin System</span>
          </button>
        </div>
      )}

      {/* Secret Admin Credentials Verification Modal */}
      <AnimatePresence>
        {showAdminLoginModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-brand-box border border-cyan-500/30 max-w-xs w-full rounded-2xl p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
              
              <div className="text-center space-y-1 my-3">
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mx-auto text-lg shadow-inner">
                  🔑
                </div>
                <h3 className="text-sm font-black text-white tracking-tight pt-1">Authorized Access Lock</h3>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Provide authorized administrator operator credentials to unlock system access buttons.
                </p>
              </div>

              <form onSubmit={handleAdminVerifySubmit} className="space-y-3 pt-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">ID/Email</label>
                  <input 
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="E.g., name@domain.com"
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Security Key</label>
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {adminLoginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 rounded-lg p-2.5 leading-snug">
                    {adminLoginError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminLoginModal(false);
                      setAdminLoginError('');
                    }}
                    className="py-2 bg-brand-bg hover:bg-slate-900 text-slate-400 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdminSubmitting}
                    className="py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-black text-[10px] active:scale-95 transition-all text-center cursor-pointer"
                  >
                    {isAdminSubmitting ? 'Verifying...' : 'Unlock Console'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div 
                onClick={handleLogoClick}
                className="flex items-center gap-3 cursor-pointer select-none"
                title="Tap 5 times for security console access"
              >
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
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Current Day</div>
                  <div className="text-xs font-black font-mono text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg inline-block">
                    {simulatedDay}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black font-sans shadow"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-bold">Logout</span>
                </button>
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
