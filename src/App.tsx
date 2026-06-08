import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, FishHolding, Transaction, FISH_SPECS } from './types.ts';
import { formatNaira, getApiUrl, resolveImageUrl } from './utils.ts';

// Dynamic Sub-components
import OnboardingFlow from './components/OnboardingFlow.tsx';
import TabMarket from './components/TabMarket.tsx';
import TabPond from './components/TabPond.tsx';
import TabDeposit from './components/TabDeposit.tsx';
import TabWithdraw from './components/TabWithdraw.tsx';
import TabInvite from './components/TabInvite.tsx';
import TabRanks from './components/TabRanks.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

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
  interface AppToast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'fish' | 'profit';
    timestamp: Date;
  }
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
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
      const res = await fetch(getApiUrl('/api/admin/login'), {
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

  useEffect(() => {
    // If inside Telegram WebApp, execute seamless dynamic authenticated logins
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
          const tgUser = tg.initDataUnsafe.user;
          const tgUserId = String(tgUser.id);
          const firstName = tgUser.first_name || '';
          const lastName = tgUser.last_name || '';
          const username = tgUser.username || '';
          const startParam = tg.initDataUnsafe.start_param || '';

          addNotification("📱 Telegram WebApp detected. Initializing secure console...");

          fetch(getApiUrl('/api/auth/telegram'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: tgUserId,
              firstName,
              lastName,
              username,
              referredBy: startParam || referredByQuery
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              localStorage.setItem('fishinvest_user_id', data.user.telegram_id);
              setSimulatedId(data.user.telegram_id);
              setUser(data.user);
              if (data.isAdmin || data.user.telegram_id === '8655517474' || data.user.telegram_id === '6395906533' || data.user.email === 'idehenclintonn@gmail.com' || (data.user.email && data.user.email.toLowerCase().includes('onefootball76'))) {
                localStorage.setItem('fishinvest_admin_unlocked', 'true');
                setIsAdminUnlocked(true);
                setShowAdminPanel(true);
              }
              addNotification(`🛡️ Authorized as Telegram User: ${data.user.name}`);
            }
          })
          .catch(err => {
            console.error('Error conducting Telegram WebApp auto-login:', err);
            addNotification('⚠️ Dynamic verification failed. Active input permitted.');
          });
        }
      } catch (tgErr) {
        console.error('Error initializing Telegram WebApp SDK:', tgErr);
      }
    }
  }, [referredByQuery]);

  const addNotification = (msg: string, type: 'info' | 'success' | 'warning' | 'error' | 'fish' | 'profit' = 'info') => {
    let resolvedType = type;
    const msgLower = msg.toLowerCase();
    if (msgLower.includes('pond') || msgLower.includes('profit') || msgLower.includes('earnings') || msgLower.includes('payout') || msgLower.includes('deposit')) {
      resolvedType = 'profit';
    } else if (msgLower.includes('fish') || msgLower.includes('limited') || msgLower.includes('released') || msgLower.includes('breed') || msgLower.includes('meluza') || msgLower.includes('catfish')) {
      resolvedType = 'fish';
    } else if (msgLower.includes('success') || msgLower.includes('successfully') || msgLower.includes('authorized') || msgLower.includes('welcome')) {
      resolvedType = 'success';
    } else if (msgLower.includes('warning') || msgLower.includes('conflict') || msgLower.includes('fail') || msgLower.includes('error') || msgLower.includes('glitch')) {
      resolvedType = 'warning';
    }

    const newToast: AppToast = {
      id: Math.random().toString(),
      message: msg,
      type: resolvedType,
      timestamp: new Date()
    };

    setToasts((prev) => [...prev, newToast]);
    setNotificationLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setUnreadCount((prev) => prev + 1);

    // Auto delete after 5500ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5500);
  };

  const clearNotificationLogs = () => setNotificationLog([]);

  // Periodic background simulated notification injector
  useEffect(() => {
    if (!user || !user.name) return;

    const interval = setInterval(() => {
      // 15% chance to trigger a notification every 60 seconds
      if (Math.random() > 0.15) return;

      const mockAlerts = [
        {
          message: "🌊 Pond profits are fully matured! Double check your active yields in the Pond tab.",
          type: "profit" as const
        },
        {
          message: "🏪 Limited-Edition Golden Imperial Koi has been released in the Market catalog! Limited stocks remain.",
          type: "fish" as const
        },
        {
          message: "📈 Active daily feed streak maintained. Sunday payout tier boosted by 1.5%!",
          type: "success" as const
        },
        {
          message: "🌊 Marine temperature conditions are optimal! Fish growth rates stabilized at 100%.",
          type: "info" as const
        },
        {
          message: "🏪 Market Spec Release: Deepwater Meluza pricing updated. High Sunday staking demands registered.",
          type: "fish" as const
        },
        {
          message: "🔔 Network safety check complete: Dedicated Providus Virtual Bank accounts synchronized.",
          type: "success" as const
        }
      ];

      const chosen = mockAlerts[Math.floor(Math.random() * mockAlerts.length)];
      addNotification(chosen.message, chosen.type);
    }, 60000);

    // Also trigger initial welcome simulation after 4.5 seconds to show the user the feature right away!
    const startupTimeout = setTimeout(() => {
      addNotification("🌊 Welcome to FishInvest! Staked marine assets are successfully generating daily passive earnings.", "success");
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(startupTimeout);
    };
  }, [user]);

  const [marketCatalog, setMarketCatalog] = useState<any[]>([]);
  const [appIconUrl, setAppIconUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/app-icon'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.url) {
          setAppIconUrl(data.url);
          let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = data.url;
        }
      })
      .catch((err) => console.error('Error loading app icon:', err));
  }, []);

  // Real-time synchronization of users, holdings, transactions, and catalogs via resilient restful polling
  const loadUserData = async () => {
    if (!simulatedId) return;

    const fetchJson = async (url: string) => {
      try {
        const res = await fetch(getApiUrl(url));
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
        const mappedHoldings = (syncData.holdings || []).map((h: any) => ({
          id: h.$id || h.id || '',
          userId: h.user_id || h.userId || '',
          fishType: h.fish_id || h.fishType || 'meluza',
          quantity: Number(h.quantity || 0),
          stakedDay: h.staked_day || h.stakedDay || 'monday',
          stakedAt: h.staked_at || h.stakedAt || '',
          cycleId: h.cycle_id || h.cycleId || '',
        }));
        setHoldings(mappedHoldings);
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
      <ErrorBoundary>
        <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col font-sans relative overflow-x-hidden justify-center items-center">
          {/* Floating Animated Bubbles background decoration */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-20 right-5 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
          </div>
          
          <UserAuth 
            referredByQueryParam={referredByQuery} 
            appIconUrl={appIconUrl}
            onAuthSuccess={(u: any) => {
              localStorage.setItem('fishinvest_user_id', u.telegram_id);
              setSimulatedId(u.telegram_id);
              setUser(u);
              if (u.telegram_id === 'admin_owner' || u.telegram_id === '6395906533' || u.email === 'idehenclintonn@gmail.com' || (u.email && u.email.toLowerCase().includes('onefootball76'))) {
                localStorage.setItem('fishinvest_admin_unlocked', 'true');
                setIsAdminUnlocked(true);
                setShowAdminPanel(true);
              }
              addNotification(`🛡️ Authorized successfully: ${u.name || u.email}`);
            }} 
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 overflow-hidden flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] relative">
                  <span>🐟</span>
                  {appIconUrl && (
                    <img 
                      src={resolveImageUrl(appIconUrl)} 
                      alt="FishInvest" 
                      className="w-full h-full object-cover absolute inset-0 z-10" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
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

                {/* Visual Notification Bell */}
                <button
                  onClick={() => {
                    setShowNotificationCenter(true);
                    setUnreadCount(0);
                  }}
                  className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center relative shadow"
                  title="Notification Center & Simulations"
                >
                  <Bell className="w-3.5 h-3.5 animate-pulse" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-slate-900 rounded-full animate-ping" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-slate-900 rounded-full" />
                  )}
                </button>

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

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none max-w-sm w-full flex flex-col items-end gap-2.5 px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            let bg = "bg-brand-box/95 border-cyan-500/30 shadow-cyan-950/20";
            let iconText = "🐟";
            let colorAccent = "border-l-4 border-l-cyan-400";
            
            if (toast.type === 'profit') {
              bg = "bg-brand-box/95 border-emerald-500/30 shadow-emerald-950/20";
              iconText = "🌊";
              colorAccent = "border-l-4 border-l-emerald-400";
            } else if (toast.type === 'fish') {
              bg = "bg-brand-box/95 border-blue-500/30 shadow-blue-950/20";
              iconText = "🏪";
              colorAccent = "border-l-4 border-l-blue-400";
            } else if (toast.type === 'success') {
              bg = "bg-brand-box/95 border-teal-500/30 shadow-teal-950/20";
              iconText = "✅";
              colorAccent = "border-l-4 border-l-teal-400";
            } else if (toast.type === 'warning') {
              bg = "bg-brand-box/95 border-rose-500/30 shadow-rose-950/20";
              iconText = "⚠️";
              colorAccent = "border-l-4 border-l-rose-400";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg ${bg} ${colorAccent} max-w-sm w-full`}
              >
                <div className="text-xl shrink-0 leading-none">{iconText}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] font-sans font-extrabold text-slate-100 leading-snug">
                    {toast.message}
                  </p>
                  <span className="text-[8px] font-mono text-slate-500 block">
                    just now
                  </span>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-500 hover:text-slate-350 active:scale-95 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Visual Notification Hub Drawer */}
      <AnimatePresence>
        {showNotificationCenter && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm">
            <div 
              className="absolute inset-0" 
              onClick={() => setShowNotificationCenter(false)} 
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative max-w-lg w-full bg-brand-bg border-t border-cyan-500/20 rounded-t-[32px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] text-left"
            >
              <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto my-3 shrink-0" />

              <div className="px-6 pb-4 border-b border-cyan-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔔</span>
                  <div>
                    <h2 className="text-sm font-black text-white">Notification Alert Control</h2>
                    <span className="text-[9px] font-mono text-slate-400">Trigger simulated events & inspect activity logs</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationCenter(false)}
                  className="w-8 h-8 rounded-full bg-brand-box border border-cyan-900/40 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold active:scale-90 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="text-cyan-400">⚡</span>
                    Testing Console: Trigger Simulations
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        addNotification("🌊 Pond profits are fully matured! Double check your active yields in the Pond tab.", "profit");
                        addNotification("✅ Simulated Pond profits ready alert initiated! Check the banner popups.", "success");
                      }}
                      className="p-3 bg-brand-box/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-left active:scale-[0.98] transition-all cursor-pointer group hover:bg-emerald-500/5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🌊</span>
                        <span className="text-xs font-extrabold text-neutral-100 group-hover:text-emerald-300 transition-colors">Pond Profits Ready</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Fires an alert informing that stakers have harvested yields and need to cash out.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        addNotification("🏪 Limited-Edition Golden Imperial Koi has been cataloged! Only 50 units open for stakes.", "fish");
                        addNotification("✅ Simulated market release alert successfully dispatched!", "success");
                        setTimeout(() => {
                          addNotification("🔥 High-demand staking alert: Grab Koi stocks before Sunday closure!", "warning");
                        }, 1800);
                      }}
                      className="p-3 bg-brand-box/60 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl text-left active:scale-[0.98] transition-all cursor-pointer group hover:bg-blue-500/5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">🏪</span>
                        <span className="text-xs font-extrabold text-neutral-100 group-hover:text-blue-300 transition-colors">Limited Fish Release</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Fires a system broad alert about newly cataloged rare and premium fish specimens.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        addNotification("📈 Daily feed check-in registered! Active streak multiplier incremented.", "success");
                      }}
                      className="p-3 bg-brand-box/60 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl text-left active:scale-[0.98] transition-all cursor-pointer group hover:bg-cyan-500/5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">📈</span>
                        <span className="text-xs font-extrabold text-neutral-100 group-hover:text-cyan-300 transition-colors">Streak Multiplier Upgrade</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Simulates user daily feeding streak and level up incentives active notification.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        addNotification("ℹ️ Payment validated: Provident dynamic virtual credit verified. Enjoy high yields!", "info");
                      }}
                      className="p-3 bg-brand-box/60 border border-teal-500/20 hover:border-teal-500/40 rounded-2xl text-left active:scale-[0.98] transition-all cursor-pointer group hover:bg-teal-500/5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">💳</span>
                        <span className="text-xs font-extrabold text-neutral-100 group-hover:text-teal-300 transition-colors">Deposit System Audit</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Simulates virtual ledger validation and proof of stake verification notification.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="text-cyan-400">📋</span>
                      Activity Logging Center ({notificationLog.length})
                    </h3>
                    {notificationLog.length > 0 && (
                      <button
                        onClick={clearNotificationLogs}
                        className="text-[10px] text-rose-450 hover:underline font-bold active:scale-95 transition-all cursor-pointer"
                      >
                        Wipe All Logs
                      </button>
                    )}
                  </div>

                  <div className="bg-brand-box border border-cyan-950 rounded-2xl overflow-hidden">
                    {notificationLog.length === 0 ? (
                      <div className="p-8 text-center space-y-1">
                        <span className="text-2xl block">📬</span>
                        <p className="text-xs text-slate-400 font-bold">Log is empty</p>
                        <p className="text-[10px] text-slate-500">Trigger alerts using testing console buttons above.</p>
                      </div>
                    ) : (
                      <div className="p-3 max-h-56 overflow-y-auto space-y-2 text-left font-mono text-[10px] leading-relaxed divide-y divide-slate-800/40">
                        {notificationLog.slice().reverse().map((log, index) => (
                          <div key={index} className="pt-2 first:pt-0 text-slate-350 select-text">
                            <span className="text-[8px] font-bold text-cyan-400 uppercase bg-cyan-900/10 px-1 py-0.5 rounded border border-cyan-800/10 mr-1.5">
                              Alert Log
                            </span>
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
    </ErrorBoundary>
  );
}
