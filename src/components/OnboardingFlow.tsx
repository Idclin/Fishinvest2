import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FISH_SPECS, User } from '../types.ts';
import { UserCheck, Phone, Landmark, Binary, Compass, ChevronRight, HelpCircle } from 'lucide-react';

interface OnboardingFlowProps {
  telegramId: string;
  onboardedUser: (user: User) => void;
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

export default function OnboardingFlow({
  telegramId,
  onboardedUser,
  referredByQueryParam,
}: OnboardingFlowProps) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [bankName, setBankName] = React.useState(NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = React.useState('');
  const [referredBy, setReferredBy] = React.useState(referredByQueryParam || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const nextStep = () => {
    setErrorMsg('');
    if (step === 2 && !name.trim()) {
      setErrorMsg('Please enter your full name as on your bank account');
      return;
    }
    if (step === 3 && (!phone.trim() || phone.length < 10)) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }
    if (step === 5) {
      if (!accountNumber.trim() || accountNumber.length !== 10 || isNaN(Number(accountNumber))) {
        setErrorMsg('Nigerian bank account number (NUBAN) must be exactly 10 digits long');
        return;
      }
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/users/${telegramId}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          bankName,
          accountNumber: accountNumber.trim(),
          referredBy: referredBy.trim() || null,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to complete onboarding');
      }

      onboardedUser(resData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-brand-box border border-cyan-900/40 shadow-[0_8px_30px_rgb(2,21,26)] rounded-2xl overflow-hidden relative">
        
        {/* Progress header bar (shown for steps 2 to 5) */}
        {step > 1 && (
          <div className="w-full h-1 bg-brand-bg flex">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-full transition-all duration-300 ${
                  idx < step - 1 ? 'bg-cyan-400' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Welcome Screen */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center py-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-teal-500 p-1 shadow-lg shadow-cyan-500/15 animate-pulse">
                  <div className="w-full h-full bg-brand-bg rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎣</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent font-sans">
                    FishInvest
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                    Invest in real fish farming. Earn pro-rated daily profit and withdraw every Sunday.
                  </p>
                </div>

                <div className="bg-brand-bg/95 p-4 rounded-xl border border-cyan-900/20 text-left space-y-2">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-teal-450">⚡</span>
                    <span className="text-slate-300">Daily earnings are automatically credited to your wallet.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-cyan-450">💳</span>
                    <span className="text-slate-300">Minimum startup capital of just ₦1,500.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-amber-455">🔔</span>
                    <span className="text-slate-300">Refer friends to earn 10% on their first investment instantly.</span>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all text-white font-sans font-black text-sm rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Start Verification</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Full Name */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 py-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-cyan-450 uppercase tracking-widest">Step 1 of 4</span>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 font-sans">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    Enter your Full Name
                  </h2>
                  <p className="text-xs text-slate-450">
                    Must EXACTLY match your legitimate bank account name to prevent payout rejection delays.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. Oluwasegun Adepoju"
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/80 transition-colors placeholder:text-slate-550 font-sans"
                  />
                </div>

                {/* Optional Referral Code slot */}
                <div className="pt-2 border-t border-cyan-900/20 space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Have an invitation code? (Optional)</label>
                  <input
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="e.g. USERID"
                    className="w-full bg-brand-bg border border-cyan-900/30 rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-cyan-600/70 font-mono"
                    disabled={!!referredByQueryParam}
                  />
                </div>

                {errorMsg && <p className="text-xs text-rose-450 pt-1 font-sans">{errorMsg}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={prevStep} className="flex-1 py-3 border border-cyan-900/40 rounded-xl hover:bg-brand-box/80 text-xs text-slate-400 transition-colors cursor-pointer font-sans">
                    Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/15 transition-all cursor-pointer">
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Phone Number */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 py-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-cyan-450 uppercase tracking-widest">Step 2 of 4</span>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 font-sans">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    Enter Phone Number
                  </h2>
                  <p className="text-xs text-slate-450">
                    For bank transfer web-feed notifications and login verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 08012345678"
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/80 transition-colors font-mono tracking-wide placeholder:text-slate-550"
                  />
                </div>

                {errorMsg && <p className="text-xs text-rose-450 pt-1 font-sans">{errorMsg}</p>}

                <div className="flex gap-3 pt-2">
                  <button onClick={prevStep} className="flex-1 py-3 border border-cyan-900/40 rounded-xl hover:bg-brand-box/80 text-xs text-slate-400 cursor-pointer transition-colors font-sans">
                    Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/15 transition-all cursor-pointer">
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Bank Name */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4 py-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-cyan-455 uppercase tracking-widest">Step 3 of 4</span>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 font-sans">
                    <Landmark className="w-5 h-5 text-cyan-400" />
                    Select Destination Bank
                  </h2>
                  <p className="text-xs text-slate-450">
                    Where your earnings will be credited directly every Sunday.
                  </p>
                </div>

                <div className="space-y-2">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/85 transition-colors font-sans cursor-pointer"
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b} className="bg-slate-900 text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={prevStep} className="flex-1 py-3 border border-cyan-900/40 rounded-xl hover:bg-brand-box/80 text-xs text-slate-400 cursor-pointer transition-colors font-sans">
                    Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/15 transition-all cursor-pointer">
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Bank Account Number */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 py-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-cyan-455 uppercase tracking-widest font-sans">Step 4 of 4</span>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 font-sans">
                    <Binary className="w-5 h-5 text-cyan-400" />
                    Account Number
                  </h2>
                  <p className="text-xs text-slate-450">
                    Provide your 10-digit NUBAN number. Submitting triggers bulk payout tests.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ''));
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 1029384756"
                    className="w-full bg-brand-bg border border-cyan-900/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/80 transition-colors font-mono tracking-widest text-center text-lg placeholder:text-slate-600"
                  />
                </div>

                {errorMsg && <p className="text-xs text-rose-450 pt-1 font-sans">{errorMsg}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={prevStep}
                    disabled={isLoading}
                    className="flex-1 py-3 border border-cyan-900/30 rounded-xl hover:bg-brand-box/80 text-xs text-slate-400 disabled:opacity-50 transition-colors cursor-pointer font-sans"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={isLoading}
                    className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-sans font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit Verification</span>
                        <Compass className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
