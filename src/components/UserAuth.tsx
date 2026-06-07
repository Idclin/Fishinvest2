import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, Landmark, Binary, ChevronRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface UserAuthProps {
  onAuthSuccess: (user: any) => void;
  referredByQueryParam: string | null;
}

const NIGERIAN_BANKS = [
  'Providus Bank',
  'Guaranty Trust Bank (GTB)',
  'Zenith Bank',
  'Access Bank',
  'United Bank for Africa (UBA)',
  'First Bank of Nigeria',
  'Wema Bank / ALAT',
  'Opay',
  'Moniepoint MFB',
  'Kuda Microfinance Bank',
  'Sterling Bank'
];

export default function UserAuth({ onAuthSuccess, referredByQueryParam }: UserAuthProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'signup'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupBank, setSignupBank] = useState(NIGERIAN_BANKS[0]);
  const [signupAccount, setSignupAccount] = useState('');
  const [referredBy, setReferredBy] = useState(referredByQueryParam || '');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please fill in all credentials.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupName.trim()) {
      setErrorMsg('Full name matching your bank account is strictly required.');
      return;
    }
    if (!signupEmail.trim() || !signupPassword) {
      setErrorMsg('Email and security password are required.');
      return;
    }
    if (!signupPhone.trim() || signupPhone.length < 10) {
      setErrorMsg('Enter a valid phone number.');
      return;
    }
    if (!signupAccount.trim() || signupAccount.length !== 10 || isNaN(Number(signupAccount))) {
      setErrorMsg('Nigerian bank account number (NUBAN) must be exactly 10 digits.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          phone: signupPhone.trim(),
          bankName: signupBank,
          accountNumber: signupAccount.trim(),
          referredBy: referredBy.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-8 font-sans text-slate-100">
      <div className="w-full max-w-md bg-brand-box border border-cyan-500/20 shadow-[0_8px_30px_rgb(2,21,26)] rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
        
        <div className="p-6 md:p-8 space-y-6">
          {/* Main system header visual */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🐟
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              FishInvest Security Console
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Access the premium, decentralized virtual fish breeding staking system.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="grid grid-cols-2 p-1 bg-brand-bg/95 border border-cyan-900/40 rounded-xl">
            <button
              onClick={() => {
                setActiveMode('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeMode === 'login'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveMode('signup');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeMode === 'signup'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Forms container wrapper */}
          <AnimatePresence mode="wait">
            {activeMode === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="e.g. name@domain.com"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Account Security Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-10 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-450 p-3 rounded-xl leading-normal">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 customize-scrollbar"
              >
                {/* Full name of account owner */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Full Name (Bank Match)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      placeholder="e.g. Oluwasegun Adepoju"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      placeholder="e.g. validemail@domain.com"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Account security Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-10 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                      placeholder="e.g. 08012345678"
                      className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Bank selection and Account Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Your Bank</label>
                    <div className="relative">
                      <Landmark className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                      <select
                        value={signupBank}
                        onChange={(e) => setSignupBank(e.target.value)}
                        className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-2 py-3 text-[10px] text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                      >
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank} className="bg-slate-900 text-xs">
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">NUBAN Account</label>
                    <div className="relative">
                      <Binary className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        maxLength={10}
                        value={signupAccount}
                        onChange={(e) => setSignupAccount(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="10 Digits"
                        className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Referral Code slot */}
                <div className="pt-2 border-t border-cyan-900/20 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Invitation Code (Optional)</label>
                  <input
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="e.g. usr_192834"
                    className="w-full bg-brand-bg border border-cyan-900/30 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-cyan-600 font-mono"
                    disabled={!!referredByQueryParam}
                  />
                </div>

                {errorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-450 p-3 rounded-xl leading-normal">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/15 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Register Account</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Encrypted Appwrite Integration Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
