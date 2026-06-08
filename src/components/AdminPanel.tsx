import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  HelpCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  DollarSign, 
  Bell, 
  Edit, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Key, 
  Loader2, 
  LogOut, 
  Activity, 
  Award,
  ChevronRight,
  Filter,
  Check,
  Percent,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatNaira, getApiUrl, resolveImageUrl } from '../utils.ts';

const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.startsWith('/')) {
    return window.fetch(getApiUrl(input), init);
  }
  return window.fetch(input, init);
};

interface AdminPanelProps {
  onBackToApp: () => void;
}

export default function AdminPanel({ onBackToApp }: AdminPanelProps) {
  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState(''); // Requires manual credentials entry
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');

  // Main UI State
  const [activeTab, setActiveTab] = React.useState<'overview' | 'users' | 'holdings' | 'deposits' | 'withdrawals' | 'referrals' | 'transactions' | 'market'>('overview');
  const [stats, setStats] = React.useState<any>(null);
  const [charts, setCharts] = React.useState<any>(null);
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [holdingsList, setHoldingsList] = React.useState<any[]>([]);
  const [depositsList, setDepositsList] = React.useState<any[]>([]);
  const [depositsMetrics, setDepositsMetrics] = React.useState<any>(null);
  const [withdrawalsList, setWithdrawalsList] = React.useState<any[]>([]);
  const [referralsList, setReferralsList] = React.useState<any[]>([]);
  const [referralsMetrics, setReferralsMetrics] = React.useState<any>(null);
  const [topReferrers, setTopReferrers] = React.useState<any[]>([]);
  const [transactionsList, setTransactionsList] = React.useState<any[]>([]);
  const [marketList, setMarketList] = React.useState<any[]>([]);

  // Page Load State
  const [loading, setLoading] = React.useState(false);

  // Sub-modals & Interactive Action States
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [userTxLog, setUserTxLog] = React.useState<any[]>([]);
  const [loadingUserTx, setLoadingUserTx] = React.useState(false);
  
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: '', phone: '', bankName: '', accountNumber: '' });
  
  const [showCreditModal, setShowCreditModal] = React.useState(false);
  const [creditAmount, setCreditAmount] = React.useState('');
  const [creditNote, setCreditNote] = React.useState('');
  
  const [showDebitModal, setShowDebitModal] = React.useState(false);
  const [debitAmount, setDebitAmount] = React.useState('');
  const [debitNote, setDebitNote] = React.useState('');

  const [showNotificationModal, setShowNotificationModal] = React.useState(false);
  const [notificationMessage, setNotificationMessage] = React.useState('');

  // Custom modals/toast fallback for iframe sandboxing and clean design
  const [confirmModal, setConfirmModal] = React.useState<{ 
    show: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    actionLabel?: string;
    isDangerous?: boolean;
  } | null>(null);

  const [toastNotification, setToastNotification] = React.useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastNotification({ show: true, message, type });
    setTimeout(() => {
      setToastNotification(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  // Market Editing Modal States
  const [showMarketModal, setShowMarketModal] = React.useState(false);
  const [isEditingMarketSpec, setIsEditingMarketSpec] = React.useState(false);
  const [marketForm, setMarketForm] = React.useState({
    id: '',
    name: '',
    displayName: '',
    price: '',
    weeklyProfit: '',
    dailyProfit: '',
    tag: 'NEW',
    description: '',
    image: '',
    status: 'Active',
    limited: false,
    unitsLimit: '200'
  });

  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [uploadFeedback, setUploadFeedback] = React.useState('');
  const [deletingUserIds, setDeletingUserIds] = React.useState<Record<string, boolean>>({});
  const [deletingMarketIds, setDeletingMarketIds] = React.useState<Record<string, boolean>>({});

  // App-wide Logo / Icon Configuration States
  const [adminAppIconUrl, setAdminAppIconUrl] = React.useState<string | null>(null);
  const [adminAppUrl, setAdminAppUrl] = React.useState<string | null>(null);
  const [pastUploads, setPastUploads] = React.useState<string[]>([]);
  const [isUpdatingBrandIcon, setIsUpdatingBrandIcon] = React.useState(false);
  const [brandFeedback, setBrandFeedback] = React.useState('');

  // Table Filters & Searches
  const [usersSearch, setUsersSearch] = React.useState('');
  const [usersStatusFilter, setUsersStatusFilter] = React.useState('All');
  
  const [holdingsSearch, setHoldingsSearch] = React.useState('');
  const [holdingsTypeFilter, setHoldingsTypeFilter] = React.useState('All');
  
  const [depositsSearch, setDepositsSearch] = React.useState('');
  const [depositsStatusFilter, setDepositsStatusFilter] = React.useState('All');
  
  const [withdrawalsSearch, setWithdrawalsSearch] = React.useState('');
  const [withdrawalsStatusFilter, setWithdrawalsStatusFilter] = React.useState('All');

  // Load Admin Data on tab switches or loads
  const loadStats = async () => {
    try {
      const r = await fetch('/api/admin/stats');
      const d = await r.json();
      if (d.success) {
        setStats(d.stats);
        setCharts(d.charts);
      }
    } catch (e) {
      console.error('Error fetching admin overview:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const r = await fetch('/api/admin/users');
      const d = await r.json();
      if (d.success) setUsersList(d.users);
    } catch (e) {
      console.error('Error loading users list:', e);
    }
  };

  const loadHoldings = async () => {
    try {
      const r = await fetch('/api/admin/holdings');
      const d = await r.json();
      if (d.success) setHoldingsList(d.holdings);
    } catch (e) {
      console.error('Error loading holdings list:', e);
    }
  };

  const loadDeposits = async () => {
    try {
      const r = await fetch('/api/admin/deposits');
      const d = await r.json();
      if (d.success) {
        setDepositsList(d.deposits);
        setDepositsMetrics(d.metrics);
      }
    } catch (e) {
      console.error('Error loading deposits list:', e);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const r = await fetch('/api/admin/withdrawals');
      const d = await r.json();
      if (d.success) setWithdrawalsList(d.withdrawals);
    } catch (e) {
      console.error('Error loading withdrawals list:', e);
    }
  };

  const loadReferrals = async () => {
    try {
      const r = await fetch('/api/admin/referrals');
      const d = await r.json();
      if (d.success) {
        setReferralsList(d.referrals);
        setReferralsMetrics(d.metrics);
        setTopReferrers(d.topReferrers);
      }
    } catch (e) {
      console.error('Error loading referrals list:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const r = await fetch('/api/admin/transactions');
      const d = await r.json();
      if (d.success) setTransactionsList(d.transactions);
    } catch (e) {
      console.error('Error loading master transaction list:', e);
    }
  };

  const loadMarket = async () => {
    try {
      // Load current brand logo
      fetch('/api/app-icon')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            setAdminAppIconUrl(data.url);
          }
        })
        .catch(err => console.error('Error loading brand icon in admin:', err));

      // Load current Telegram WebApp URL Configuration
      fetch('/api/app-url')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            setAdminAppUrl(data.url);
          }
        })
        .catch(err => console.error('Error loading brand WebApp URL in admin:', err));

      // Load all past uploads
      fetch('/api/admin/uploads')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.files)) {
            setPastUploads(data.files);
          }
        })
        .catch(err => console.error('Error loading past uploads list:', err));

      const r = await fetch('/api/market-fish');
      const d = await r.json();
      if (d.success && Array.isArray(d.fish)) {
        const mapped = d.fish.map((item: any) => ({
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
        setMarketList(mapped);
      }
    } catch (e) {
      console.error('Error loading market dynamic list:', e);
    }
  };

  const loadTabContentData = async () => {
    setLoading(true);
    if (activeTab === 'overview') await loadStats();
    else if (activeTab === 'users') await loadUsers();
    else if (activeTab === 'holdings') await loadHoldings();
    else if (activeTab === 'deposits') await loadDeposits();
    else if (activeTab === 'withdrawals') await loadWithdrawals();
    else if (activeTab === 'referrals') await loadReferrals();
    else if (activeTab === 'transactions') await loadTransactions();
    else if (activeTab === 'market') await loadMarket();
    setLoading(false);
  };

  React.useEffect(() => {
    if (isAdminLoggedIn) {
      loadTabContentData();
    }
  }, [isAdminLoggedIn, activeTab]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const d = await r.json();
      if (!r.ok || !d.success) {
        throw new Error(d.error || 'Login verification failed');
      }
      setIsAdminLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // User Action Functions
  const changeUserStatus = async (telegramId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'Active' : 'suspended';
    try {
      const r = await fetch(`/api/admin/users/${telegramId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (r.ok) {
        loadUsers();
        triggerToast(`Successfully changed status of user to ${nextStatus}!`, 'success');
      }
    } catch (err) {
      triggerToast('Failed to modify status rules.', 'error');
    }
  };

  const executeDeleteUser = async (telegramId: string) => {
    setDeletingUserIds(prev => ({ ...prev, [telegramId]: true }));
    try {
      const r = await fetch(`/api/admin/users/${telegramId}`, {
        method: 'DELETE'
      });
      if (r.ok) {
        loadUsers();
        triggerToast('Farmer account and all associated collections cleared successfully!', 'success');
      } else {
        const d = await r.json();
        triggerToast(d.error || 'Failed to delete farmer.', 'error');
      }
    } catch (err) {
      triggerToast('Error deleting user.', 'error');
    } finally {
      setDeletingUserIds(prev => ({ ...prev, [telegramId]: false }));
    }
  };

  const deleteUser = (telegramId: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'Permanently Purge Farmer?',
      message: `Are you absolutely sure you want to permanently delete the user "${name || 'User'}" (ID: ${telegramId})? This will wipe all their ledger deposits, withdrawals, referrals, and investments cycles!`,
      onConfirm: () => executeDeleteUser(telegramId),
      actionLabel: 'Purge Account',
      isDangerous: true
    });
  };

  const submitEditUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const r = await fetch(`/api/admin/users/${selectedUser.telegram_id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (r.ok) {
        setShowEditModal(false);
        loadUsers();
        alert('User profile characteristics updated!');
      }
    } catch (err) {
      alert('Error updating user.');
    }
  };

  const submitCreditWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const r = await fetch(`/api/admin/users/${selectedUser.telegram_id}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: creditAmount, note: creditNote })
      });
      if (r.ok) {
        setShowCreditModal(false);
        setCreditAmount('');
        setCreditNote('');
        loadUsers();
        alert('Credit adjustment log updated globally!');
      } else {
        const error = await r.json();
        alert(error.error || 'Failed to adjust');
      }
    } catch (err) {
      alert('Adjustment error.');
    }
  };

  const submitDebitWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const r = await fetch(`/api/admin/users/${selectedUser.telegram_id}/debit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: debitAmount, note: debitNote })
      });
      if (r.ok) {
        setShowDebitModal(false);
        setDebitAmount('');
        setDebitNote('');
        loadUsers();
        alert('Debit transaction recorded successfully!');
      } else {
        const error = await r.json();
        alert(error.error || 'Failed to adjust balance');
      }
    } catch (err) {
      alert('Adjustment error.');
    }
  };

  const dispatchAlertNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const r = await fetch(`/api/admin/users/${selectedUser.telegram_id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notificationMessage })
      });
      if (r.ok) {
        setShowNotificationModal(false);
        setNotificationMessage('');
        alert('Interactive alerting notice was dispatched securely to the user!');
      }
    } catch (err) {
      alert('Alert issue');
    }
  };

  const viewUserTxs = async (telegramId: string) => {
    setLoadingUserTx(true);
    setUserTxLog([]);
    try {
      const r = await fetch(`/api/admin/users/${telegramId}/transactions`);
      const d = await r.json();
      if (d.success) {
        setUserTxLog(d.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserTx(false);
    }
  };

  // Deposit Actions
  const approveDeposit = async (txId: string) => {
    try {
      const r = await fetch(`/api/admin/deposits/${txId}/confirm`, { method: 'POST' });
      const d = await r.json();
      if (r.ok) {
        loadDeposits();
        alert(d.message);
      } else {
        alert(d.error);
      }
    } catch (e) {
      alert('Error during approval.');
    }
  };

  const rejectDeposit = async (txId: string) => {
    const reason = prompt('Please enter rejection feedback log notes:');
    if (reason === null) return;
    try {
      const r = await fetch(`/api/admin/deposits/${txId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (r.ok) {
        loadDeposits();
        alert('Deposit ticket declined.');
      }
    } catch (e) {
      alert('Error on reject.');
    }
  };

  // Withdrawal Actions
  const markWithdrawalPaid = async (witId: string) => {
    try {
      const r = await fetch(`/api/admin/withdrawals/${witId}/mark-paid`, { method: 'POST' });
      if (r.ok) {
        loadWithdrawals();
        alert('Payout verified successfully.');
      }
    } catch (e) {
      alert('Action error.');
    }
  };

  const rejectWithdrawal = async (witId: string) => {
    const reason = prompt('Please describe rejection reason:');
    if (reason === null) return;
    try {
      const r = await fetch(`/api/admin/withdrawals/${witId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (r.ok) {
        loadWithdrawals();
        alert('Payout request declined and funds returned successfully.');
      }
    } catch (e) {
      alert('Action error.');
    }
  };

  const processBulkSundayPayouts = async () => {
    try {
      const r = await fetch('/api/admin/withdrawals/process-all', { method: 'POST' });
      const d = await r.json();
      if (r.ok) {
        loadWithdrawals();
        alert(d.message);
      }
    } catch (e) {
      alert('Dispersal simulation failed.');
    }
  };

  // Market Specs Builder Actions
  const openMarketCreateModal = () => {
    setIsEditingMarketSpec(false);
    setMarketForm({
      id: '',
      name: '',
      displayName: '',
      price: '',
      weeklyProfit: '',
      dailyProfit: '',
      tag: 'NEW',
      description: '',
      image: '',
      status: 'Active',
      limited: false,
      unitsLimit: '200'
    });
    setShowMarketModal(true);
  };

  const openMarketEditModal = (spec: any) => {
    setIsEditingMarketSpec(true);
    setMarketForm({
      id: spec.id || '',
      name: spec.name || '',
      displayName: spec.displayName || '',
      price: (spec.price ?? '').toString(),
      weeklyProfit: (spec.weeklyProfit ?? '').toString(),
      dailyProfit: (spec.dailyProfit ?? '').toString(),
      tag: spec.tag || 'NEW',
      description: spec.description || '',
      image: spec.image || '',
      status: spec.status || 'Active',
      limited: !!spec.limited,
      unitsLimit: (spec.unitsLimit || 200).toString()
    });
    setShowMarketModal(true);
  };

  const submitMarketForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditingMarketSpec 
        ? `/api/admin/market-fish/${marketForm.id}` 
        : '/api/admin/market-fish';
      const method = isEditingMarketSpec ? 'PUT' : 'POST';

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...marketForm,
          name: marketForm.displayName.toLowerCase().replace(/\s+/g, '_')
        })
      });

      if (r.ok) {
        setShowMarketModal(false);
        loadMarket();
        alert(isEditingMarketSpec ? 'Specs updated!' : 'New breed stock added!');
      } else {
        const error = await r.json();
        alert(error.error || 'Failed operation');
      }
    } catch (ex) {
      alert('Operational error on stock specification.');
    }
  };

  const executeDeleteFishSpec = async (id: string) => {
    setDeletingMarketIds(prev => ({ ...prev, [id]: true }));
    try {
      const r = await fetch(`/api/admin/market-fish/${id}`, { method: 'DELETE' });
      if (r.ok) {
        loadMarket();
        triggerToast('Specs cleared.', 'success');
      } else {
        const error = await r.json();
        triggerToast(error.error || 'Failed to delete dynamic breed stock.', 'error');
      }
    } catch (e) {
      triggerToast('Error during spec deletion.', 'error');
    } finally {
      setDeletingMarketIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteFishSpec = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Remove Breed Stock Spec?',
      message: 'Are you absolutely sure you want to clear this breed stock? This will not affect active user pond cycles, but prevents future purchases.',
      onConfirm: () => executeDeleteFishSpec(id),
      actionLabel: 'Delete Spec',
      isDangerous: true
    });
  };

  // Computed Filters Lists
  const getFilteredUsers = () => {
    return usersList.filter(u => {
      const matchesSearch = 
        (u.name || '').toLowerCase().includes(usersSearch.toLowerCase()) || 
        (u.telegram_id || '').toLowerCase().includes(usersSearch.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(usersSearch.toLowerCase());
      
      const matchesStatus = usersStatusFilter === 'All' || 
        (usersStatusFilter === 'Active' && u.status !== 'suspended') ||
        (usersStatusFilter === 'Suspended' && u.status === 'suspended');

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredHoldings = () => {
    return holdingsList.filter(h => {
      const matchesSearch = 
        (h.userId || '').toLowerCase().includes(holdingsSearch.toLowerCase()) || 
        (h.userName || '').toLowerCase().includes(holdingsSearch.toLowerCase());
      
      const matchesType = holdingsTypeFilter === 'All' || 
        (h.fishType || '').toLowerCase() === holdingsTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  };

  const getFilteredDeposits = () => {
    return depositsList.filter(d => {
      const matchesSearch = 
        (d.userId || '').toLowerCase().includes(depositsSearch.toLowerCase()) || 
        (d.userName || '').toLowerCase().includes(depositsSearch.toLowerCase()) ||
        (d.id || '').toLowerCase().includes(depositsSearch.toLowerCase());
      
      const matchesStatus = depositsStatusFilter === 'All' || 
        (d.status || '').toLowerCase() === depositsStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredWithdrawals = () => {
    return withdrawalsList.filter(w => {
      const matchesSearch = 
        (w.userId || '').toLowerCase().includes(withdrawalsSearch.toLowerCase()) || 
        (w.userName || '').toLowerCase().includes(withdrawalsSearch.toLowerCase()) ||
        (w.id || '').toLowerCase().includes(withdrawalsSearch.toLowerCase());

      const matchesStatus = withdrawalsStatusFilter === 'All' || 
        (w.status || '').toLowerCase() === withdrawalsStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  };

  if (!isAdminLoggedIn) {
    // Render Login Screen (Step 1)
    return (
      <div className="min-h-screen bg-brand-bg text-slate-100 flex items-center justify-center p-4 relative font-sans">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-box max-w-md w-full border border-cyan-900/50 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Accent bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
          
          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">FishInvest Admin</h2>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
              Authorized operators system console. Authentication logs tracked in backend audit history.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Email ID</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="developer@gmail.com"
                className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 text-white transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Security Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 text-white transition-all font-mono"
              />
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-400 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-cyan-555 to-blue-600 bg-cyan-500 hover:opacity-90 text-slate-900 active:scale-[0.99] transition-all font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Node Identity...</span>
                </>
              ) : (
                <span>Access Console</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-cyan-900/20 text-center">
            <button 
              onClick={onBackToApp}
              className="text-xs text-cyan-400/80 hover:text-cyan-400 hover:underline border-none bg-transparent cursor-pointer font-medium"
            >
              ← Back to Telegram Client Mini App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Admin Layout Panel
  return (
    <div className="min-h-screen bg-brand-bg text-slate-200 flex flex-col font-sans">
      {/* 1. Global Admin Top Navbar */}
      <header className="bg-brand-box border-b border-cyan-900/40 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">FishInvest Manager</span>
              <span className="bg-cyan-500/20 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-widest font-mono">
                Admin Console
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Authenticated: idehenclintonn@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToApp}
            className="hidden sm:flex text-xs bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 font-bold px-3 py-2 rounded-xl hover:bg-cyan-500/25 active:scale-95 transition-all cursor-pointer items-center gap-1.5"
          >
            <span>📱 User App</span>
          </button>
          
          <button 
            onClick={() => setIsAdminLoggedIn(false)}
            className="text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3 py-2 rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            title="Log Out Access"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* 2. Page body: responsive side rail layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* SIDE BAR NAVIGATION MODULE */}
        <aside className="md:w-64 shrink-0 space-y-2">
          <div className="bg-brand-box rounded-2xl border border-cyan-900/30 p-4 space-y-1 shadow-sm">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-2">Systems Console</span>
            
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'overview' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'users' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Users Panel</span>
              </div>
              <span className="bg-slate-800 text-[9px] text-slate-400 px-1.5 py-0.5 rounded-full font-mono">{usersList.length || 'L'}</span>
            </button>

            <button 
              onClick={() => setActiveTab('holdings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'holdings' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Fish Holdings list</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab('deposits')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'deposits' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Deposits Tickets</span>
              </div>
              {depositsList.filter(d => d.status === 'Pending').length > 0 && (
                <span className="bg-yellow-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                  {depositsList.filter(d => d.status === 'Pending').length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'withdrawals' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Withdrawals Queue</span>
              </div>
              {withdrawalsList.filter(w => w.status === 'Pending').length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {withdrawalsList.filter(w => w.status === 'Pending').length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('referrals')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'referrals' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                <span>Referral Logs</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab('transactions')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'transactions' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>Auditing ledger</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>

            <button 
              onClick={() => setActiveTab('market')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                activeTab === 'market' 
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-brand-bg/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Market Manager</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>

          </div>
        </aside>

        {/* MAIN CONSOLE BODY SCREEN CONTAINER */}
        <main className="flex-1 bg-brand-box rounded-3xl border border-cyan-900/30 p-6 shadow-xl min-h-[500px] overflow-hidden relative">
          
          {loading && (
            <div className="absolute inset-0 bg-brand-box/80 z-20 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <span className="text-xs text-cyan-400 font-mono tracking-wider block">Syncing Firestore Node...</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* TAB: DASHBOARD OVERVIEW (STEP 2) */}
            {activeTab === 'overview' && stats && (
              <motion.div 
                key="overview-dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Dashboard Live Standings</h3>
                    <p className="text-[10px] text-slate-400">Aggregated insights from Firestore ledger indexes.</p>
                  </div>
                  
                  <button 
                    onClick={loadStats}
                    className="p-2 border border-cyan-900/30 rounded-xl hover:bg-cyan-500/10 text-cyan-400 active:scale-95 transition-all text-xs cursor-pointer"
                    title="Force refresh index"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div className="bg-brand-bg/60 border border-cyan-900/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-xl opacity-20">👥</div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Farmers</span>
                    <span className="text-2xl font-black text-white block mt-1 tracking-tight font-mono">{stats.totalUsers || 0}</span>
                    <span className="text-[9px] text-cyan-400 font-semibold block mt-1">
                      🟢 {stats.activeUsers || 0} active cycles
                    </span>
                  </div>

                  <div className="bg-brand-bg/60 border border-cyan-900/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-xl opacity-20">💰</div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Deposits Volume</span>
                    <span className="text-2xl font-black text-green-400 block mt-1 tracking-tight font-mono">{formatNaira(stats.totalDeposited || 0)}</span>
                    <span className="text-[9px] text-slate-400 block mt-1">all-time credit records</span>
                  </div>

                  <div className="bg-brand-bg/60 border border-cyan-900/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-xl opacity-20">💸</div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Withdrawn</span>
                    <span className="text-2xl font-black text-amber-500 block mt-1 tracking-tight font-mono">{formatNaira(stats.totalWithdrawn || 0)}</span>
                    <span className="text-[9px] text-slate-400 block mt-1">all-time payouts dispersal</span>
                  </div>

                  <div className="bg-brand-bg/60 border border-cyan-900/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-xl opacity-20">🦈</div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Sunday Liability</span>
                    <span className="text-2xl font-black text-cyan-400 block mt-1 tracking-tight font-mono">{formatNaira(stats.thisWeekPayout || 0)}</span>
                    <span className="text-[9px] text-purple-400 font-medium block mt-1">
                      🔮 {stats.totalFishOwned || 0} farmed species count
                    </span>
                  </div>

                </div>

                {/* Secondary indicators */}
                <div className="bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-cyan-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Core Platform Margin</span>
                    <span className="text-xl font-extrabold text-white font-mono">{formatNaira(stats.platformBalance || 0)}</span>
                    <p className="text-[10px] text-slate-400 leading-none">Net total asset retention (All Deposits - Completed Bank payouts).</p>
                  </div>
                  
                  {stats.pendingWithdrawalsVolume > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 sm:text-right">
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">Pending payouts list</span>
                      <span className="text-sm font-black text-orange-300 font-mono">{formatNaira(stats.pendingWithdrawalsVolume)} ({stats.pendingWithdrawalsCount} users)</span>
                    </div>
                  )}
                </div>

                {/* GRAPHIC CHART ENGINE (Visualizing using custom beautiful SVG graphs, responsive & bug-free!) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Daily Deposits bucket */}
                  <div className="bg-brand-bg/45 border border-cyan-900/15 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">30-Days Growth Curve (Deposits)</span>
                    <div className="h-44 w-full flex items-end gap-1.5 pt-4">
                      {charts.dailyDepositsChart && charts.dailyDepositsChart.map((bar: any, idx: number) => {
                        const vals = charts.dailyDepositsChart.map((c: any) => c.value);
                        const mx = Math.max(...vals) || 1;
                        const pct = (bar.value / mx) * 100;
                        return (
                          <div key={idx} className="flex-1 h-full flex flex-col justify-end group cursor-pointer relative" title={`Day ${bar.label}: ₦${bar.value}`}>
                            <div className="bg-cyan-500/20 group-hover:bg-cyan-400/40 w-full rounded-t transition-all" style={{ height: `${Math.max(bar.value > 0 ? 5 : 1, pct)}%` }} />
                            <span className="text-[7px] text-slate-500 scale-90 font-mono text-center block mt-1.5 truncate">{idx % 5 === 0 ? bar.label : ''}</span>
                            
                            {/* Hover label */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 border border-cyan-500/40 text-[8px] text-cyan-400 font-mono py-1 px-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-20 whitespace-nowrap shadow-md">
                              ₦{bar.value.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic yield ratios (Step 9) */}
                  <div className="bg-brand-bg/45 border border-cyan-900/15 rounded-2xl p-4 space-y-4">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Species Stock Index</span>
                    <div className="space-y-3">
                      {charts.fishSpecsCount && charts.fishSpecsCount.map((f: any, idx: number) => {
                        const sum = charts.fishSpecsCount.reduce((a: any, b: any) => a + b.value, 0) || 1;
                        const pct = Math.round((f.value / sum) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-300">{f.label} ({f.value} owned)</span>
                              <span className="font-mono text-cyan-400 font-bold">{pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: f.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* TAB: USERS DIRECTORY (STEP 3) */}
            {activeTab === 'users' && (
              <motion.div 
                key="users-directory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Platform Users Index</h3>
                    <p className="text-[10px] text-slate-400">Suspend, adjust, edit KYC profiles, configure financial parameters.</p>
                  </div>
                  
                  {/* Search filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        value={usersSearch}
                        onChange={(e) => setUsersSearch(e.target.value)}
                        placeholder="Search User ID, name or phone..."
                        className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 text-white w-52 sm:w-60"
                      />
                    </div>
                    
                    <select 
                      value={usersStatusFilter}
                      onChange={(e) => setUsersStatusFilter(e.target.value)}
                      className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="All">All statuses</option>
                      <option value="Active">Active only</option>
                      <option value="Suspended">Suspended only</option>
                    </select>
                  </div>
                </div>

                {/* Table display */}
                <div className="overflow-x-auto border border-cyan-900/20 rounded-2xl bg-brand-bg/25">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-cyan-900/30 font-bold text-slate-400">
                      <tr>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Farmer Profile / ID</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">KYC Status</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Virtual Bank Account</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Wallet NGN</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Farmed</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Ranks Level</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">State Status</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Operators</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/10">
                      {getFilteredUsers().length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 italic">No registered farmers meet filters criteria.</td>
                        </tr>
                      ) : (
                        getFilteredUsers().map((u, idx) => {
                          const resolvedTelegramId = String(u.telegram_id || u.telegramId || u.id || u.$id || '').trim();
                          const normalizedUser = {
                            ...u,
                            telegram_id: resolvedTelegramId,
                            telegramId: resolvedTelegramId
                          };
                          return (
                            <tr key={idx} className="hover:bg-cyan-500/[0.02] transition-all">
                              <td className="p-4 space-y-0.5">
                                <span className="font-bold text-white block">{normalizedUser.name || 'Onboarding Pending'}</span>
                                <span className="font-mono text-[10px] text-slate-500 block">{resolvedTelegramId}</span>
                                {normalizedUser.phone && <span className="text-[10px] text-slate-400 block">{normalizedUser.phone}</span>}
                              </td>
                              <td className="p-4 text-center">
                                {normalizedUser.name ? (
                                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">YES</span>
                                ) : (
                                  <span className="bg-slate-800 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">NO</span>
                                )}
                              </td>
                              <td className="p-4 font-mono text-[11px] text-slate-400">
                                <span className="block">{normalizedUser.virtualAccountNumber || 'N/A'}</span>
                                <span className="block text-[9px] text-slate-500 uppercase">{normalizedUser.bankName || 'No bank assigned'}</span>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-cyan-400">
                                {formatNaira(normalizedUser.walletBalance || 0)}
                              </td>
                              <td className="p-4 text-center font-mono font-bold text-purple-400">
                                {normalizedUser.fishQuantityOwned || 0}
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                                  {normalizedUser.level || 'Beginner Farmer'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {normalizedUser.status === 'suspended' ? (
                                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">SUSPENDED</span>
                                ) : (
                                  <span className="bg-green-500/15 text-green-400 border border-green-500/20 text-[10px] px-2 py-0.5 rounded-full">ACTIVE</span>
                                )}
                              </td>
                              <td className="p-4 text-right space-y-1">
                                {/* Operators controls row */}
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(normalizedUser);
                                      setEditForm({
                                        name: normalizedUser.name || '',
                                        phone: normalizedUser.phone || '',
                                        bankName: normalizedUser.bankName || '',
                                        accountNumber: normalizedUser.accountNumber || ''
                                      });
                                      setShowEditModal(true);
                                    }}
                                    className="p-1.5 border border-cyan-900/30 text-slate-300 rounded hover:bg-cyan-500/10 cursor-pointer"
                                    title="Edit Profile"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(normalizedUser);
                                      setShowCreditModal(true);
                                    }}
                                    className="text-[10px] bg-green-500/15 border border-green-555/20 text-green-400 px-1.5 py-1 rounded hover:bg-green-500/25 active:scale-95 transition-all cursor-pointer font-bold"
                                    title="Credit NGN Wallet"
                                  >
                                    + Credits
                                  </button>

                                  <button 
                                    onClick={() => {
                                      setSelectedUser(normalizedUser);
                                      setShowDebitModal(true);
                                    }}
                                    className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-1 rounded hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer font-bold"
                                    title="Debit Wallet"
                                  >
                                    - Debits
                                  </button>
                                </div>

                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(normalizedUser);
                                      setShowNotificationModal(true);
                                    }}
                                    className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/20 cursor-pointer"
                                    title="Send push alert notification"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => changeUserStatus(resolvedTelegramId, normalizedUser.status)}
                                    className={`px-1.5 py-1 border text-[10px] font-black rounded active:scale-95 transition-all cursor-pointer ${
                                      normalizedUser.status === 'suspended'
                                        ? 'bg-rose-500/20 border-rose-500/45 text-rose-400 hover:bg-rose-500/30'
                                        : 'bg-slate-800 border-rose-900/40 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                    }`}
                                    title={normalizedUser.status === 'suspended' ? 'Unsuspend User Account' : 'Suspend User Account'}
                                  >
                                    {normalizedUser.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </button>

                                  <button 
                                    onClick={() => deleteUser(resolvedTelegramId, normalizedUser.name)}
                                    disabled={deletingUserIds[resolvedTelegramId]}
                                    className={`p-1.5 rounded border cursor-pointer transition-all flex items-center gap-1 ${
                                      deletingUserIds[resolvedTelegramId]
                                        ? 'bg-rose-500/30 border-rose-500/50 text-rose-300 opacity-80 cursor-not-allowed'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                    }`}
                                    title="Permanently Delete/Remove User"
                                  >
                                    {deletingUserIds[resolvedTelegramId] ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span className="text-[10px] font-mono font-bold uppercase">Wiping...</span>
                                      </>
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: GLOBAL STAKING HOLDINGS (STEP 4) */}
            {activeTab === 'holdings' && (
              <motion.div 
                key="holdings-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Active Farm-Stakings</h3>
                    <p className="text-[10px] text-slate-400">Real-time catalog list of fish breeds currently feed-growing in user ponds.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        value={holdingsSearch}
                        onChange={(e) => setHoldingsSearch(e.target.value)}
                        placeholder="Search Farmer Name or User ID..."
                        className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 text-white w-52 sm:w-60"
                      />
                    </div>

                    <select 
                      value={holdingsTypeFilter}
                      onChange={(e) => setHoldingsTypeFilter(e.target.value)}
                      className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="All">All species</option>
                      <option value="meluza">Meluza</option>
                      <option value="schoolbian">Schoolbian</option>
                      <option value="catfish">Catfish</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-cyan-900/20 rounded-2xl bg-brand-bg/25">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-cyan-900/30 font-bold text-slate-400">
                      <tr>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Staked Farmer</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Fish Species</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Staking Quantity</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Cycle Weekday</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Staked Date</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Sunday Estimated Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/10">
                      {getFilteredHoldings().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">No active holdings meet search filter requirements.</td>
                        </tr>
                      ) : (
                        getFilteredHoldings().map((h, idx) => (
                          <tr key={idx} className="hover:bg-cyan-500/[0.01] transition-all">
                            <td className="p-4">
                              <span className="font-bold text-white block">{h.userName}</span>
                              <span className="font-mono text-[10px] text-slate-500 block">{h.userId}</span>
                            </td>
                            <td className="p-4 uppercase font-bold text-cyan-400 tracking-wider">
                              🐟 {h.fishType}
                            </td>
                            <td className="p-4 text-center font-bold font-mono text-purple-400">
                              {h.quantity || 1}
                            </td>
                            <td className="p-4 text-center uppercase text-[10px] font-extrabold tracking-wider bg-brand-bg/40 max-w-[60px] mx-auto rounded font-mono">
                              {h.stakedDay}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-400">{new Date(h.stakedAt).toLocaleString()}</td>
                            <td className="p-4 text-right font-mono font-bold text-green-400">
                              {formatNaira(h.sundayPayout || 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: DEPOSITS TICKETS REVIEW (STEP 5) */}
            {activeTab === 'deposits' && (
              <motion.div 
                key="deposits-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Deposits Tickets reviewer</h3>
                    <p className="text-[10px] text-slate-400">Audit simulated bank virtual deposits, credit balances upon proof of payment.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        value={depositsSearch}
                        onChange={(e) => setDepositsSearch(e.target.value)}
                        placeholder="Search User ID or Ticket..."
                        className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 text-white w-52 sm:w-60"
                      />
                    </div>

                    <select 
                      value={depositsStatusFilter}
                      onChange={(e) => setDepositsStatusFilter(e.target.value)}
                      className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="All">All tickets</option>
                      <option value="pending">Pending review</option>
                      <option value="paid">Confirmed Paid</option>
                      <option value="failed">Failed/Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Deposits Stats Overview bar */}
                {depositsMetrics && (
                  <div className="grid grid-cols-3 gap-4 bg-slate-900/60 border border-cyan-900/30 rounded-2xl p-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Deposited Today</span>
                      <span className="text-lg font-black text-green-400 font-mono">{formatNaira(depositsMetrics.depositedToday || 0)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Last 7 Days Vol</span>
                      <span className="text-lg font-black text-cyan-400 font-mono">{formatNaira(depositsMetrics.depositedThisWeek || 0)}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Platform Avg Receipt</span>
                      <span className="text-lg font-black text-white font-mono">{formatNaira(depositsMetrics.averageDeposit || 0)}</span>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-cyan-900/20 rounded-2xl bg-brand-bg/25">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-cyan-900/30 font-bold text-slate-400">
                      <tr>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Ticket Reference</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Sender User</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Sum NGN</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Transfer Created At</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Status</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/10">
                      {getFilteredDeposits().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">No deposit entries match query.</td>
                        </tr>
                      ) : (
                        getFilteredDeposits().map((d, idx) => (
                          <tr key={idx} className="hover:bg-cyan-500/[0.01] transition-all">
                            <td className="p-4 font-mono font-bold text-slate-200">
                              {d.id}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-white block">{d.userName}</span>
                              <span className="font-mono text-[10px] text-slate-500 block">{d.userId}</span>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-green-400 text-sm">
                              {formatNaira(d.amount || 0)}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-400">
                              {new Date(d.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              {d.status === 'Pending' ? (
                                <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">PENDING</span>
                              ) : d.status === 'Paid' ? (
                                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] px-2.5 py-0.5 rounded-full">CONFIRMED</span>
                              ) : (
                                <span className="bg-slate-800 text-slate-500 text-[10px] px-2.5 py-0.5 rounded-full">DECLINED</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {d.status === 'Pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => approveDeposit(d.id)}
                                    className="px-2.5 py-1 bg-green-500 text-slate-900 text-xs font-bold rounded-lg cursor-pointer hover:bg-green-400 active:scale-95 transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => rejectDeposit(d.id)}
                                    className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-lg cursor-pointer hover:bg-rose-555/20 active:scale-95 transition-all"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : d.status === 'Paid' ? (
                                <span className="text-[10px] text-slate-500 italic">Credited via providus admin</span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic block font-mono max-w-[120px] truncate" title={d.rejectReason}>{d.rejectReason || 'No reason specified'}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: SUNDAY PAYOUT WITHDRAWALS QUEUE (STEP 6) */}
            {activeTab === 'withdrawals' && (
              <motion.div 
                key="withdrawals-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Withdrawals queue center</h3>
                    <p className="text-[10px] text-slate-400">Simulate Sunday bulk dispersal logic via Flutterwave mock API integration.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        value={withdrawalsSearch}
                        onChange={(e) => setWithdrawalsSearch(e.target.value)}
                        placeholder="Search User ID or bank details..."
                        className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 text-white w-52 sm:w-60"
                      />
                    </div>

                    <select 
                      value={withdrawalsStatusFilter}
                      onChange={(e) => setWithdrawalsStatusFilter(e.target.value)}
                      className="bg-brand-bg/75 border border-cyan-900/30 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="All">All payouts</option>
                      <option value="pending">Pending Queue</option>
                      <option value="paid">Paid successfully</option>
                      <option value="failed">Declined/Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Bulk payouts dispersal card bar (Step 6) */}
                {withdrawalsList.filter(w => w.status === 'Pending').length > 0 && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1">
                      <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Sunday Dispersal Pipeline</span>
                      <h4 className="text-base font-extrabold text-white">Initiate Bulk Flutterwave transfer</h4>
                      <p className="text-xs text-slate-400 leading-snug">There are {withdrawalsList.filter(w => w.status === 'Pending').length} pending payouts totalling <span className="font-bold text-green-400">{formatNaira(withdrawalsList.filter(w => w.status === 'Pending').reduce((a,b) => a+b.amount, 0))}</span>.</p>
                    </div>
                    
                    <button 
                      onClick={processBulkSundayPayouts}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-slate-900 active:scale-95 transition-all font-black text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-green-500/10 cursor-pointer uppercase tracking-wider"
                    >
                      <span>⚡ Process All Payouts</span>
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto border border-cyan-900/20 rounded-2xl bg-brand-bg/25">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-cyan-900/30 font-bold text-slate-400">
                      <tr>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Withdrawal ticket</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Beneficiary Farmer</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Sum Payout NGN</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Bank / Account Details</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Status</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Operators Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/10">
                      {getFilteredWithdrawals().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">No withdrawal requests logged.</td>
                        </tr>
                      ) : (
                        getFilteredWithdrawals().map((w, idx) => (
                          <tr key={idx} className="hover:bg-cyan-500/[0.01] transition-all">
                            <td className="p-4 font-mono font-bold text-slate-400">
                              {w.id}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-white block">{w.userName}</span>
                              <span className="font-mono text-[10px] text-slate-500 block">{w.userId}</span>
                            </td>
                            <td className="p-4 text-right font-mono font-black text-amber-400 text-sm">
                              {formatNaira(w.amount || 0)}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-400">
                              <span className="block text-white font-semibold">{w.accountNumber}</span>
                              <span className="block text-[9px] uppercase text-slate-500">{w.bankName}</span>
                            </td>
                            <td className="p-4 text-center">
                              {w.status === 'Pending' ? (
                                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">QUEUED</span>
                              ) : w.status === 'Paid' ? (
                                <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] px-2.5 py-0.5 rounded-full">DISPERSED</span>
                              ) : (
                                <span className="bg-slate-800 text-slate-500 text-[10px] px-2.5 py-0.5 rounded-full">DECLINED & REFUNDED</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {w.status === 'Pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => markWithdrawalPaid(w.id)}
                                    className="px-2 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded hover:bg-green-500/25 cursor-pointer"
                                  >
                                    Mark Paid
                                  </button>
                                  <button 
                                    onClick={() => rejectWithdrawal(w.id)}
                                    className="px-2 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded hover:bg-rose-500/25 cursor-pointer"
                                  >
                                    Reject & Refund
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono italic block max-w-[120px] truncate" title={w.rejectReason}>{w.rejectReason || 'Cleared via flutterwave'}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: REFERRALS MARKETING AUDITING (STEP 7) */}
            {activeTab === 'referrals' && referralsMetrics && (
              <motion.div 
                key="referrals-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-cyan-900/20 pb-4">
                  <h3 className="text-lg font-black text-white">Referral Marketing Tree Analytics</h3>
                  <p className="text-[10px] text-slate-400">Audit successful commission triggers and payouts distributions.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-brand-bg/50 border border-cyan-900/25 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total commissions Paid</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono block mt-1">{formatNaira(referralsMetrics.totalReferralBonusesPaid || 0)}</span>
                  </div>
                  <div className="bg-brand-bg/50 border border-cyan-900/25 rounded-2xl p-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Active conversion chains</span>
                    <span className="text-2xl font-black text-white font-mono block mt-1">{referralsMetrics.activeChains || 0} linking paths</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Top referrers board */}
                  <div className="bg-slate-900/40 border border-cyan-900/20 rounded-2xl p-4 md:col-span-1 space-y-3 shadow">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Top conversion Farmers</span>
                    <div className="space-y-2.5">
                      {topReferrers.length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-4">No commissions logged.</div>
                      ) : (
                        topReferrers.map((tr, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-brand-bg/30 p-2 border border-cyan-900/10 rounded-xl">
                            <span className="font-mono text-slate-300 font-semibold truncate max-w-[120px]" title={tr.name}>{tr.name}</span>
                            <div className="text-right">
                              <span className="font-bold text-green-400 font-mono block">{formatNaira(tr.earned)}</span>
                              <span className="text-[8px] text-slate-500 block">{tr.count} conversion invitations</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Historic logs map */}
                  <div className="md:col-span-2 space-y-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Referral ledger updates</span>
                    <div className="overflow-x-auto border border-cyan-900/15 rounded-2xl bg-brand-bg/15 max-h-[290px] overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-400">
                        <thead className="bg-slate-900 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Inviter ID (Credited)</th>
                            <th className="p-3">Referee name (Subscribed)</th>
                            <th className="p-3 text-right">Commission paid</th>
                            <th className="p-3">Conversion Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-900/10 font-mono text-[11px]">
                          {referralsList.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-500 italic">No invitation logs.</td>
                            </tr>
                          ) : (
                            referralsList.map((rf, idx) => (
                              <tr key={idx} className="hover:bg-cyan-500/[0.01]">
                                <td className="p-3 font-semibold text-slate-300 truncate max-w-[120px]" title={rf.referrerId}>{rf.referrerId}</td>
                                <td className="p-3 text-slate-300">{rf.refereeName}</td>
                                <td className="p-3 text-right text-cyan-400 font-bold">{formatNaira(rf.bonusAmount)}</td>
                                <td className="p-3 text-[10px] text-slate-500">{new Date(rf.paidAt).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* TAB: AUDITING MASTER TRANSACTION LOGS (STEP 8) */}
            {activeTab === 'transactions' && (
              <motion.div 
                key="transactions-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="border-b border-cyan-900/20 pb-4">
                  <h3 className="text-lg font-black text-white">Platform Auditing transaction ledger</h3>
                  <p className="text-[10px] text-slate-400">Real-time audit record ledger tracking all platform Naira transfers, purchases, and marketing commissions.</p>
                </div>

                <div className="overflow-x-auto border border-cyan-900/20 rounded-2xl bg-brand-bg/25 max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 border-b border-cyan-900/30 font-bold text-slate-400 sticky top-0 z-10">
                      <tr>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Tx ID</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Farmer User</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Action Type</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-right">Amount NGN</th>
                        <th className="p-4 uppercase tracking-wider text-[10px]">Executed Timestamp</th>
                        <th className="p-4 uppercase tracking-wider text-[10px] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/10 font-mono text-[11px]">
                      {transactionsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">Unified transaction ledger is completely clean.</td>
                        </tr>
                      ) : (
                        transactionsList.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-cyan-500/[0.01]">
                            <td className="p-4 text-slate-400 font-bold">{tx.id}</td>
                            <td className="p-4 text-slate-300">{tx.userId}</td>
                            <td className="p-4">
                              {tx.type === 'deposit' ? (
                                <span className="text-green-400 flex items-center gap-1">
                                  <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                                  <span>DEPOSIT</span>
                                </span>
                              ) : tx.type === 'withdraw' ? (
                                <span className="text-amber-500 flex items-center gap-1">
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                  <span>WITHDRAW</span>
                                </span>
                              ) : tx.type === 'buy' ? (
                                <span className="text-purple-400 flex items-center gap-1">
                                  <span>🐟 PURCHASE</span>
                                </span>
                              ) : (
                                <span className="text-cyan-400 flex items-center gap-1">
                                  <span>🤝 REFERRAL COM</span>
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-200">
                              {formatNaira(tx.amount || 0)}
                            </td>
                            <td className="p-4 text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              {tx.status === 'Paid' ? (
                                <span className="text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded text-[9px]">SUCCESS</span>
                              ) : tx.status === 'Pending' ? (
                                <span className="text-yellow-400 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded text-[9px] animate-pulse">QUEUED</span>
                              ) : (
                                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[9px]">DECLINED</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: FISH SPECIFICATIONS MARKET CONFIGURATOR (STEP 9) */}
            {activeTab === 'market' && (
              <motion.div 
                key="market-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Fish Market breed Catalog Manager</h3>
                    <p className="text-[10px] text-slate-400">Configure fish pricings, weekly yields, daily yields, schedule stock drops, launch limited editions breeds.</p>
                  </div>

                  <button 
                    onClick={openMarketCreateModal}
                    className="bg-cyan-500 hover:opacity-90 text-slate-900 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_4px_10px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Breed</span>
                  </button>
                </div>

                {/* Grid market specs view */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {marketList.length === 0 ? (
                    <div className="col-span-full text-center text-slate-500 italic py-8 border border-dashed border-cyan-900/30 rounded-3xl bg-brand-bg/30">
                      No custom species specifications listed in Firestore.
                    </div>
                  ) : (
                    marketList.map((f, idx) => (
                      <div key={idx} className="bg-brand-bg/50 border border-cyan-900/30 rounded-3xl p-5 space-y-4 shadow relative overflow-hidden flex flex-col justify-between">
                        
                        {/* Status absolute tag */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {f.limited && (
                            <span className="bg-purple-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">LIMITED</span>
                          )}
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            f.status === 'Active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : f.status === 'Coming Soon'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {f.status || 'Active'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <img 
                            src={f.image ? resolveImageUrl(f.image) : 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=80'} 
                            alt={f.displayName}
                            className="w-full h-24 object-cover rounded-2xl border border-cyan-900/20 shadow-inner"
                            referrerPolicy="no-referrer"
                          />

                          <div className="space-y-1">
                            {f.tag && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-sans uppercase">
                                {f.tag}
                              </span>
                            )}
                            <h4 className="text-base font-black text-white leading-tight mt-1">{f.displayName}</h4>
                            <span className="font-mono text-[9px] text-slate-500 block uppercase">SYSTEM ID: {f.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs border-y border-cyan-900/15 py-2">
                            <div>
                              <span className="text-[9px] text-slate-500 block font-bold uppercase">Breeding Price</span>
                              <span className="font-mono text-white font-black">{formatNaira(f.price)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block font-bold uppercase">Daily Profit</span>
                              <span className="font-mono text-green-400 font-black">+{formatNaira(f.dailyProfit)}/day</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed">{f.description}</p>

                          {f.limited && (
                            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-2.5 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-semibold">Global Cap Sales</span>
                                <span className="font-mono font-bold text-purple-400">{f.unitsSold || 0} / {f.unitsLimit || 200} Sold</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, Math.round(((f.unitsSold || 0) / (f.unitsLimit || 200)) * 100))}%` }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Edit spec trigger bar */}
                        <div className="flex items-center gap-1.5 pt-4 border-t border-cyan-900/10 mt-auto">
                          <button 
                            onClick={() => openMarketEditModal(f)}
                            className="flex-1 py-1.5 text-slate-300 border border-cyan-900/40 text-xs font-bold rounded-lg hover:bg-cyan-500/10 cursor-pointer text-center"
                          >
                            Edit Spec
                          </button>
                          
                          <button 
                            onClick={() => deleteFishSpec(f.id)}
                            disabled={deletingMarketIds[f.id]}
                            className={`p-1.5 border rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                              deletingMarketIds[f.id]
                                ? 'bg-rose-500/30 border-rose-500/50 text-rose-300 opacity-80 cursor-not-allowed'
                                : 'text-rose-400 border-rose-900/30 hover:bg-rose-500/10'
                            }`}
                            title="Delete spec drop configuration"
                          >
                            {deletingMarketIds[f.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-[10px] font-mono font-bold uppercase">Deleting...</span>
                              </>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>

                {/* Branding administration section */}
                <div className="border-t border-cyan-950/40 pt-8 mt-10 space-y-6 font-sans">
                  <div>
                    <h3 className="text-white font-sans font-black text-xs tracking-wide uppercase">Application Identity & Global Branding</h3>
                    <p className="text-[10px] text-slate-400">Lock, view, or change the universal App icon/favicon dynamically. All updates reflect instantly for investors.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-bg/40 border border-cyan-900/10 rounded-2xl p-5">
                    
                    {/* Left Panel: Current Active Logo */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Active Brand Icon</label>
                        <div className="flex items-center gap-4">
                          {adminAppIconUrl ? (
                            <div className="relative group">
                              <img 
                                src={resolveImageUrl(adminAppIconUrl)} 
                                alt="FishInvest Logo" 
                                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/15" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-cyan-950/40 border border-cyan-900/60 flex items-center justify-center text-slate-500 text-xs font-bold leading-none">
                              No Icon
                            </div>
                          )}
                          <div className="space-y-1">
                            <h4 className="text-white font-sans font-black text-xs">FishInvest Trading System</h4>
                            <p className="text-[10px] text-slate-400 max-w-[240px] truncate leading-normal text-ellipsis overflow-hidden" title={adminAppIconUrl || 'Default Active Icon'}>
                              Source: <span className="font-mono text-[9px] text-slate-500">{adminAppIconUrl || 'Dynamic Discover Fallback'}</span>
                            </p>
                            <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ● Loaded Successfully
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Manual Brand URL config row */}
                      <div className="space-y-1.5 pt-4 border-t border-cyan-950/20">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Custom Brand URL Injection</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="custom-brand-icon-url" 
                            placeholder="https://..." 
                            defaultValue={adminAppIconUrl || ''}
                            className="flex-1 bg-brand-bg border border-cyan-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const input = document.getElementById('custom-brand-icon-url') as HTMLInputElement;
                              const urlVal = input?.value?.trim();
                              if (!urlVal) {
                                alert('Please input a valid URL first.');
                                return;
                              }
                              try {
                                setIsUpdatingBrandIcon(true);
                                setBrandFeedback('Updating app branding...');
                                const res = await fetch('/api/admin/set-app-icon', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: urlVal })
                                });
                                const data = await res.json();
                                if (data.success && data.url) {
                                  setAdminAppIconUrl(data.url);
                                  setBrandFeedback('✅ App icon updated successfully!');
                                  // Also update DOM favicon
                                  const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
                                  link.type = 'image/x-icon';
                                  link.rel = 'shortcut icon';
                                  link.href = data.url;
                                  document.getElementsByTagName('head')[0].appendChild(link);
                                  setTimeout(() => setBrandFeedback(''), 4000);
                                } else {
                                  throw new Error(data.error || 'Server rejected');
                                }
                              } catch (err: any) {
                                alert(err.message || 'Error occurred');
                              } finally {
                                setIsUpdatingBrandIcon(false);
                              }
                            }}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-sans font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider block border-none cursor-pointer"
                          >
                            Set URL
                          </button>
                        </div>
                      </div>

                      {/* Telegram Mini-App URL Configuration */}
                      <div className="space-y-1.5 pt-4 border-t border-cyan-950/20">
                        <label className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">Telegram WebApp Launch URL</label>
                        <p className="text-[9px] text-slate-400 leading-normal">Specify your active Netlify or preview domain. The Telegram interactive bot uses this URL to automatically construct launch paths inside user chats.</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="https://fishinvest.netlify.app" 
                            value={adminAppUrl || ''}
                            onChange={(e) => setAdminAppUrl(e.target.value)}
                            className="flex-1 bg-brand-bg border border-cyan-900/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const urlVal = adminAppUrl?.trim();
                              if (!urlVal) {
                                alert('Please input your active domain URL first.');
                                return;
                              }
                              try {
                                setIsUpdatingBrandIcon(true);
                                setBrandFeedback('Updating WebApp target URL...');
                                const res = await fetch('/api/admin/set-app-url', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: urlVal })
                                });
                                const data = await res.json();
                                if (data.success && data.url) {
                                  setAdminAppUrl(data.url);
                                  setBrandFeedback('✅ WebApp URL updated successfully!');
                                  setTimeout(() => setBrandFeedback(''), 4000);
                                } else {
                                  throw new Error(data.error || 'Server rejected URL');
                                }
                              } catch (err: any) {
                                alert(err.message || 'Error occurred');
                              } finally {
                                setIsUpdatingBrandIcon(false);
                              }
                            }}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-sans font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider block border-none cursor-pointer"
                          >
                            Lock URL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Alternative / Previous Image Gallery & Brand Uploader */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Historical Gallery & Drop Uploader</label>
                        <span className="text-[9px] text-slate-500 font-mono">Select a thumbnail to lock as the App icon</span>
                      </div>

                      {/* Brand File Upload button */}
                      <button
                        type="button"
                        onClick={() => document.getElementById('brand-logo-file-upload')?.click()}
                        className="w-full bg-cyan-950/20 border border-dashed border-cyan-800/40 hover:bg-cyan-950/45 hover:border-cyan-500/50 rounded-xl py-3 px-4 transition-all duration-200 cursor-pointer text-center font-sans font-black text-xs text-slate-200 uppercase tracking-wider"
                      >
                        Upload custom image file
                      </button>
                      <input 
                        type="file" 
                        id="brand-logo-file-upload" 
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsUpdatingBrandIcon(true);
                            setBrandFeedback('Reading icon file...');
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              try {
                                setBrandFeedback('Uploading base64 metadata...');
                                const rUpload = await fetch('/api/admin/upload', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ filename: file.name, base64: reader.result as string })
                                });
                                const dUpload = await rUpload.json();
                                if (dUpload.success && dUpload.url) {
                                  setBrandFeedback('Assigning active brand icon...');
                                  const rSet = await fetch('/api/admin/set-app-icon', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url: dUpload.url })
                                  });
                                  const dSet = await rSet.json();
                                  if (dSet.success && dSet.url) {
                                    setAdminAppIconUrl(dSet.url);
                                    setBrandFeedback('✅ App icon successfully set!');
                                    // Update domestic favicon link
                                    const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
                                    link.type = 'image/x-icon';
                                    link.rel = 'shortcut icon';
                                    link.href = dSet.url;
                                    document.getElementsByTagName('head')[0].appendChild(link);
                                    
                                    // Refresh historical files
                                    fetch('/api/admin/uploads')
                                      .then(res => res.json())
                                      .then(d => { if (d.success) setPastUploads(d.files); });
                                    setTimeout(() => setBrandFeedback(''), 4000);
                                  } else {
                                    throw new Error(dSet.error || 'Identity mapping rejected');
                                  }
                                } else {
                                  throw new Error(dUpload.error || 'File write failure');
                                }
                              } catch (err: any) {
                                alert(err.message || 'Identity update failed');
                                setBrandFeedback('');
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            alert(err.message || 'Read error');
                          } finally {
                            setIsUpdatingBrandIcon(false);
                          }
                        }}
                      />

                      {/* List of past uploaded files */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Previously Uploaded Files ({pastUploads.length})</span>
                        <div className="grid grid-cols-4 gap-2.5 max-h-[110px] overflow-y-auto pr-1">
                          {pastUploads.map((url, idx) => {
                            const isCurrent = adminAppIconUrl === url;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={async () => {
                                  try {
                                    setIsUpdatingBrandIcon(true);
                                    setBrandFeedback('Switching app branding...');
                                    const res = await fetch('/api/admin/set-app-icon', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ url })
                                    });
                                    const data = await res.json();
                                    if (data.success && data.url) {
                                      setAdminAppIconUrl(data.url);
                                      setBrandFeedback('✅ Brand image locked!');
                                      const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
                                      link.type = 'image/x-icon';
                                      link.rel = 'shortcut icon';
                                      link.href = data.url;
                                      document.getElementsByTagName('head')[0].appendChild(link);
                                      setTimeout(() => setBrandFeedback(''), 3000);
                                    }
                                  } catch (err: any) {
                                    alert(err.message || 'Toggle failure');
                                  } finally {
                                    setIsUpdatingBrandIcon(false);
                                  }
                                }}
                                className={`h-11 rounded-lg overflow-hidden border cursor-pointer relative group transition-all duration-200 outline-none select-none p-0 bg-transparent ${isCurrent ? 'border-cyan-500 scale-[0.97] ring-1 ring-cyan-500/50' : 'border-cyan-900/30 hover:border-cyan-500/40'}`}
                              >
                                <img src={resolveImageUrl(url)} alt={`Upload ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                {isCurrent && (
                                  <div className="absolute inset-0 bg-cyan-950/60 flex items-center justify-center">
                                    <span className="text-[8px] bg-cyan-500 text-slate-950 font-sans font-black uppercase px-1 rounded-sm leading-none py-0.5">Active</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {brandFeedback && (
                        <p className={`text-[10px] text-center font-mono py-1.5 rounded-lg border bg-cyan-950/10 ${brandFeedback.startsWith('✅') ? 'text-emerald-400 border-emerald-900/30' : 'text-cyan-400 border-cyan-900/30'}`}>
                          {isUpdatingBrandIcon && <span className="inline-block w-2.5 h-2.5 border border-cyan-400 border-t-transparent rounded-full animate-spin mr-1.5 align-middle"></span>}
                          {brandFeedback}
                        </p>
                      )}
                    </div>

                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ==================================== */}
      {/* GLOBAL POPUP MODALS AND SHEET FORMS */}
      {/* ==================================== */}
      <AnimatePresence>
        
        {/* MODAL: EDIT USER KYC DIRECTORY INFO */}
        {showEditModal && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-brand-box max-w-md w-full border border-cyan-900/40 rounded-3xl p-6 space-y-4 shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
                <span className="font-sans font-black text-sm text-white">Edit KYC File for {selectedUser.telegram_id}</span>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg">×</button>
              </div>

              <form onSubmit={submitEditUserForm} className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Firstname Lastname</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Active Mobile GSM Number</label>
                  <input 
                    type="text" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    required
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Settlement Bank Name</label>
                    <input 
                      type="text" 
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
                      required
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Account Number (10d)</label>
                    <input 
                      type="text" 
                      value={editForm.accountNumber}
                      onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                      required
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-900 font-black py-3 rounded-xl cursor-pointer hover:bg-cyan-400"
                >
                  Save Corrections
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: MANUAL CREDIT wallet ADJUSTMENT (STEP 3) */}
        {showCreditModal && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-brand-box max-w-md w-full border border-cyan-900/40 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
                <span className="font-sans font-black text-sm text-white">Manual Credit Wallet Adjustment</span>
                <button onClick={() => setShowCreditModal(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg">×</button>
              </div>

              <form onSubmit={submitCreditWallet} className="space-y-4 text-xs font-sans">
                <div className="bg-slate-900/30 p-3 rounded-2xl border border-cyan-900/10 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Farmer Destination Profile</span>
                  <span className="text-white block font-bold">{selectedUser.name || 'Anonymous user'} ({selectedUser.telegram_id})</span>
                  <span className="text-cyan-400 font-medium block">Current wallet balance: {formatNaira(selectedUser.walletBalance || 0)}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Credit Amount (₦ NGN)</label>
                  <input 
                    type="number" 
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    required
                    placeholder="Enter deposit credit amount sum..."
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Adjustment Note Notes for Audit Ledger Logs</label>
                  <input 
                    type="text" 
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    required
                    placeholder="E.g., deposit correction webhook bypass..."
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-green-500 text-slate-900 font-black py-3 rounded-xl cursor-pointer hover:bg-green-400 shadow-md uppercase"
                >
                  ⚡ Execute Credit Transaction
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: MANUAL DEBIT ADJUSTMENT (STEP 3) */}
        {showDebitModal && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-brand-box max-w-md w-full border border-cyan-900/40 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
                <span className="font-sans font-black text-sm text-white">Manual Debit Wallet adjustment logs</span>
                <button onClick={() => setShowDebitModal(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg">×</button>
              </div>

              <form onSubmit={submitDebitWallet} className="space-y-4 text-xs font-sans">
                <div className="bg-slate-900/30 p-3 rounded-2xl border border-cyan-900/10 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Farmer Source Profile</span>
                  <span className="text-white block font-bold">{selectedUser.name || 'Anonymous user'}</span>
                  <span className="text-amber-500 font-medium block">Available Wallet balance: {formatNaira(selectedUser.walletBalance || 0)}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Debit Adjustment Amount (₦ NGN)</label>
                  <input 
                    type="number" 
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    required
                    placeholder="Enter debit fine adjustment sum..."
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Audit Reason description notes</label>
                  <input 
                    type="text" 
                    value={debitNote}
                    onChange={(e) => setDebitNote(e.target.value)}
                    required
                    placeholder="E.g., duplicate credit refund..."
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 text-slate-900 font-black py-3 rounded-xl cursor-pointer hover:bg-amber-450 shadow-md uppercase"
                >
                  ⚡ Execute Debit Transaction
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: DISPATCH ALERTS PUSH NOTIFICATION (STEP 3) */}
        {showNotificationModal && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-brand-box max-w-md w-full border border-cyan-900/40 rounded-3xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
                <span className="font-sans font-black text-sm text-white">Send alert push notification</span>
                <button onClick={() => setShowNotificationModal(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg">×</button>
              </div>

              <form onSubmit={dispatchAlertNotification} className="space-y-4 text-xs font-sans">
                <div className="bg-slate-900/30 p-3 rounded-2xl border border-cyan-900/10 space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase font-sans">Receiver context Profile</span>
                  <span className="text-white block font-bold">{selectedUser.name || 'Anonymous User'} ({selectedUser.telegram_id})</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Message Payload content</label>
                  <textarea 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    required
                    placeholder="Describe specific warning notifications, congratulations or cycle updates..."
                    rows={4}
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-900 font-black py-3 rounded-xl cursor-pointer hover:bg-cyan-400 uppercase"
                >
                  📣 Dispatch alert push notice
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: ADD / EDIT FISH STOCK MARKET CONFIG (STEP 9) */}
        {showMarketModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-brand-box max-w-lg w-full border border-cyan-900/40 rounded-3xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
                <span className="font-sans font-black text-sm text-white">
                  {isEditingMarketSpec ? `Edit Breed Spec: ${marketForm.displayName}` : 'Register New Breeding Spec Drop'}
                </span>
                <button onClick={() => setShowMarketModal(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg">×</button>
              </div>

              <form onSubmit={submitMarketForm} className="space-y-4 text-xs font-sans">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Species Display Name</label>
                    <input 
                      type="text" 
                      value={marketForm.displayName}
                      onChange={(e) => setMarketForm({...marketForm, displayName: e.target.value})}
                      required
                      placeholder="E.g., Nile Salmon..."
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Global Species Tag</label>
                    <input 
                      type="text" 
                      value={marketForm.tag}
                      onChange={(e) => setMarketForm({...marketForm, tag: e.target.value})}
                      required
                      placeholder="E.g., POPULAR, PREMIUM, NEW..."
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Purchase Price (₦ NGN)</label>
                    <input 
                      type="number" 
                      value={marketForm.price}
                      onChange={(e) => setMarketForm({...marketForm, price: e.target.value})}
                      required
                      placeholder="1500"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Daily Profit Yield (₦)</label>
                    <input 
                      type="number" 
                      value={marketForm.dailyProfit}
                      onChange={(e) => setMarketForm({...marketForm, dailyProfit: e.target.value})}
                      required
                      placeholder="50"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono font-bold text-green-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Weekly Return Ratio (₦)</label>
                    <input 
                      type="number" 
                      value={marketForm.weeklyProfit}
                      onChange={(e) => setMarketForm({...marketForm, weeklyProfit: e.target.value})}
                      required
                      placeholder="300"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono font-bold text-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-cyan-900/10 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Spec Status Display</label>
                    <select 
                      value={marketForm.status}
                      onChange={(e) => setMarketForm({...marketForm, status: e.target.value})}
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Active">Active / Buyable</option>
                      <option value="Coming Soon">Coming Soon / Scheduled</option>
                      <option value="Disabled">Disabled / Out of Stock</option>
                      <option value="Archived">Archived / Hidden</option>
                    </select>
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <div className="flex items-center gap-2 py-3 px-1">
                      <input 
                        type="checkbox"
                        id="limitedCheck"
                        checked={marketForm.limited}
                        onChange={(e) => setMarketForm({...marketForm, limited: e.target.checked})}
                        className="w-4 h-4 text-cyan-500 bg-brand-bg border-cyan-900/40 rounded focus:ring-cyan-500 cursor-pointer"
                      />
                      <label htmlFor="limitedCheck" className="text-[10px] text-slate-300 font-bold block cursor-pointer">LIMITED EDITION DROP</label>
                    </div>
                  </div>
                </div>

                {marketForm.limited && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="space-y-1 block border-t border-dashed border-cyan-900/10 pt-3"
                  >
                    <label className="text-[10px] text-purple-400 font-bold block">Global Cap Limit sales (Units)</label>
                    <input 
                      type="number" 
                      value={marketForm.unitsLimit}
                      onChange={(e) => setMarketForm({...marketForm, unitsLimit: e.target.value})}
                      required
                      placeholder="200"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </motion.div>
                )}

                <div className="space-y-2 border border-cyan-900/20 bg-cyan-950/10 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Product / Species Thumbnail</label>
                    <span className="text-[9px] text-cyan-400 font-mono">Upload from local device or URL</span>
                  </div>
                  
                  {/* File Upload Zone */}
                  <div 
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                    className="border border-dashed border-cyan-800/40 rounded-xl p-4 text-center cursor-pointer hover:bg-cyan-950/20 hover:border-cyan-500/50 transition-all duration-200 group relative overflow-hidden"
                  >
                    <input 
                      type="file" 
                      id="product-image-upload" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          setIsUploadingImage(true);
                          setUploadFeedback('Reading file...');
                          
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = reader.result as string;
                            setUploadFeedback('Uploading to server...');
                            
                            const res = await fetch('/api/admin/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                filename: file.name,
                                base64: base64String
                              })
                            });
                            
                            const data = await res.json();
                            if (data.success && data.url) {
                              setMarketForm(prev => ({ ...prev, image: data.url }));
                              setUploadFeedback('✅ Upload completed!');
                              setTimeout(() => setUploadFeedback(''), 2000);
                            } else {
                              throw new Error(data.error || 'Server rejected file upload');
                            }
                          };
                          reader.onerror = () => {
                            throw new Error('Error reading local file');
                          };
                          reader.readAsDataURL(file);
                        } catch (err: any) {
                          console.error('File upload error:', err);
                          setUploadFeedback(`❌ Error: ${err.message || 'Verification failure'}`);
                        } finally {
                          setIsUploadingImage(false);
                        }
                      }}
                      className="hidden"
                    />
                    
                    {marketForm.image ? (
                      <div className="flex items-center gap-3 justify-center">
                        <img 
                          src={resolveImageUrl(marketForm.image)} 
                          alt="Thumbnail Preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-cyan-500/30"
                        />
                        <div className="text-left">
                          <p className="text-xs text-white font-bold font-sans">Image Selected</p>
                          <p className="text-[10px] text-slate-400 max-w-[200px] truncate">{marketForm.image}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarketForm(prev => ({ ...prev, image: '' }));
                          }}
                          className="ml-auto p-1 text-red-400 hover:text-red-300 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-cyan-400 flex justify-center mb-1 group-hover:scale-110 transition-transform duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                        </div>
                        <p className="text-xs text-slate-200 font-bold">Click to select product image</p>
                        <p className="text-[10px] text-slate-500 font-mono">PNG, JPG, BMP up to 10MB</p>
                      </div>
                    )}
                    
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1">
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] text-cyan-400 font-mono animate-pulse">{uploadFeedback || 'Uploading...'}</p>
                      </div>
                    )}
                  </div>
                  
                  {uploadFeedback && !isUploadingImage && (
                    <p className={`text-[10px] text-center font-mono mt-1 ${uploadFeedback.startsWith('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {uploadFeedback}
                    </p>
                  )}

                  {/* Manual input backup */}
                  <div className="pt-2">
                    <p className="text-[9px] text-slate-500 font-bold block mb-1">OR ENTER THUMBNAIL URL MANUALLY</p>
                    <input 
                      type="text" 
                      value={marketForm.image}
                      onChange={(e) => setMarketForm({...marketForm, image: e.target.value})}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold block">Display Descriptions Spec Details</label>
                  <textarea 
                    value={marketForm.description}
                    onChange={(e) => setMarketForm({...marketForm, description: e.target.value})}
                    placeholder="Describe species returns ratings and breeding instructions..."
                    rows={3}
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-cyan-500 text-slate-900 font-black py-3 rounded-xl cursor-pointer hover:bg-cyan-400 uppercase tracking-wider block mt-2 shadow"
                >
                  Save Specification
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL: CUSTOM iframe-SAFE CONFIRMATION DIALOG */}
        {confirmModal && confirmModal.show && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl relative max-w-sm w-full"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <span className="font-sans font-black text-xs text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  {confirmModal.title}
                </span>
                <button 
                  onClick={() => setConfirmModal(null)} 
                  className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer text-lg"
                >
                  ×
                </button>
              </div>

              <div className="text-slate-300 text-xs font-sans leading-relaxed">
                {confirmModal.message}
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 text-center text-xs transition rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className={`flex-1 font-bold py-2 text-center text-xs transition rounded-xl cursor-pointer ${
                    confirmModal.isDangerous 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                  }`}
                >
                  {confirmModal.actionLabel || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* COMPONENT: TOAST NOTIFICATIONS BANNER */}
        {toastNotification && toastNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className={`shadow-2xl border rounded-2xl p-3 flex items-center gap-2.5 font-sans ${
              toastNotification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
                : toastNotification.type === 'info'
                  ? 'bg-slate-900/95 border-cyan-500/30 text-cyan-300'
                  : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            }`}>
              {toastNotification.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              ) : toastNotification.type === 'info' ? (
                <Info className="w-4 h-4 flex-shrink-0 text-cyan-400" />
              ) : (
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              )}
              <div className="flex-1 text-[11px] font-semibold select-none leading-snug font-sans">
                {toastNotification.message}
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer font-bold text-xs"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
