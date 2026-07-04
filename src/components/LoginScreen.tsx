import React, { useState } from 'react';
import { Mail, Lock, Sparkles, AlertCircle, PlayCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onDemoLogin: () => void;
  triggerToast: (msg: string) => void;
  supabaseError: string | null;
  hasAppliedRef: boolean;
  setHasAppliedRef: (v: boolean) => void;
  referredBy: string;
  setReferredBy: (v: string) => void;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  userReferralCode: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onDemoLogin,
  triggerToast,
  supabaseError,
  hasAppliedRef,
  setHasAppliedRef,
  referredBy,
  setReferredBy,
  setCoins,
  userReferralCode,
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(hasAppliedRef);

  const [promoChecking, setPromoChecking] = useState<boolean>(false);

  const handleApplyReferralCode = async (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) {
      triggerToast('Please type a referral code first! 🐾');
      return false;
    }

    if (code === userReferralCode) {
      triggerToast('You cannot use your own referral code!');
      return false;
    }

    const regex = /^WOLF-[A-Z0-9]{5}$/;
    if (!regex.test(code)) {
      triggerToast('Invalid referral code format! Code should look like WOLF-XXXXX 🐺');
      return false;
    }

    setPromoChecking(true);
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .or(`user_referral_code.eq.${code},userReferralCode.eq.${code}`)
        .maybeSingle();

      if (error) {
        console.warn("Supabase referral verification error:", error.message);
        triggerToast('Error verifying code. Please try again!');
        setPromoChecking(false);
        return false;
      }

      if (!data) {
        triggerToast('Referral code not found in our database! 🐺');
        setPromoChecking(false);
        return false;
      }

      setHasAppliedRef(true);
      setReferredBy(code);
      setCoins((prev) => prev + 1000);
      setPromoApplied(true);
      
      // Screen par "Referral Successful! You got 1000 Coins" ka alert dikha do
      alert('Referral Successful! You got 1000 Coins');
      triggerToast('Referral Applied! +1,000 Coins claimed 🏅✨');
      setPromoChecking(false);
      return true;
    } catch (e) {
      console.warn("Exception in referral code verification:", e);
      triggerToast('Verification error. Please try again!');
      setPromoChecking(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // If they typed a referral but haven't clicked apply yet, auto-apply it!
    if (promoCodeInput && !promoApplied) {
      const success = await handleApplyReferralCode(promoCodeInput);
      if (!success) {
        setLoading(false);
        return;
      }
    }

    try {
      const supabase = await getSupabaseClient();
      
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message && error.message.toLowerCase().includes('already registered')) {
            // User is already registered! Attempt automatic login.
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (loginError) {
              throw new Error(`User is already registered. Login failed: ${loginError.message}`);
            }
            triggerToast('Welcome back to the Wolf Pack!');
          } else {
            throw error;
          }
        } else {
          if (data.user && data.session === null) {
            triggerToast('Verification email sent! Check your inbox.');
            setAuthError('Please confirm your email address to log in.');
          } else if (data.session) {
            triggerToast('Welcome to the Wolf Pack! Slayer ID forged.');
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        triggerToast('Slayer authenticated successfully.');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (showPrivacy) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[420px] bg-[#020202] border-2 border-zinc-900 rounded-[38px] p-6 relative z-10 flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.95)] min-h-[640px]"
      >
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-900/60 mb-5">
            <button
              onClick={() => setShowPrivacy(false)}
              className="p-2 rounded-xl bg-[#08080c] border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Privacy Policy</h3>
              <p className="text-[9px] font-mono text-zinc-500 uppercase">Tap Wolf & Earn</p>
            </div>
          </div>

          {/* Scrollable text container */}
          <div className="flex-1 overflow-y-auto pr-1 text-zinc-300 space-y-5 max-h-[440px] scrollbar-thin scrollbar-thumb-zinc-900">
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-2xl p-4 space-y-4">
              <div>
                <span className="text-[9px] font-mono text-yellow-500 font-bold block mb-1">LAST UPDATED</span>
                <span className="text-[12px] font-black text-white">June 2026</span>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">1.</span> Information We Collect
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  We only collect your Email Address and Password when you create an account via Supabase Authentication to keep your game profile secure.
                </p>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">2.</span> Gameplay & Coin Data
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  We track and store your earned coins, tapping progress, and account creation date. This data is used solely to calculate your 50-day withdrawal countdown lock.
                </p>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">3.</span> Data Security
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Your data is securely stored using Supabase Database encryption. We do not sell, trade, or share your personal data with any third-party apps or companies.
                </p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">
                🐺 Protect the Pack's Privacy 🐺
              </span>
            </div>
          </div>
        </div>

        {/* Back Button Footer */}
        <div className="mt-6 pt-3 border-t border-zinc-900/40">
          <button
            onClick={() => setShowPrivacy(false)}
            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 hover:text-neutral-900 border border-yellow-400 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    );
  }

  if (showTerms) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[420px] bg-[#020202] border-2 border-zinc-900 rounded-[38px] p-6 relative z-10 flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.95)] min-h-[640px]"
      >
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-900/60 mb-5">
            <button
              onClick={() => setShowTerms(false)}
              className="p-2 rounded-xl bg-[#08080c] border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Terms & Conditions</h3>
              <p className="text-[9px] font-mono text-zinc-500 uppercase">Tap Wolf & Earn</p>
            </div>
          </div>

          {/* Scrollable text container */}
          <div className="flex-1 overflow-y-auto pr-1 text-zinc-300 space-y-5 max-h-[440px] scrollbar-thin scrollbar-thumb-zinc-900">
            <div className="bg-zinc-950 border border-zinc-900/80 rounded-2xl p-4 space-y-4">
              <div>
                <span className="text-[9px] font-mono text-yellow-500 font-bold block mb-1">LAST UPDATED</span>
                <span className="text-[12px] font-black text-white">June 2026</span>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">1.</span> Eligibility & Registration
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Users must create a valid account via Email and Password to earn coins. Only one account per device is permitted.
                </p>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">2.</span> Coin Earning & Withdrawal Lock
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Coins are earned by tapping. To ensure platform security, all user withdrawals are strictly locked for a dynamic period of 50 days from the exact date of account creation.
                </p>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">3.</span> Fair Play & Anti-Cheat
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Any attempt to use auto-clickers, hacks, or exploits to manipulate the coin balance will result in an immediate and permanent account ban without any payout.
                </p>
              </div>

              <div className="border-t border-zinc-900/50 pt-3">
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="text-yellow-500">4.</span> Limitation of Liability
                </h4>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  Tap Wolf & Earn is not responsible for any data loss due to internet connectivity issues on the user's end.
                </p>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">
                🐺 Play Fair, Earn Together 🐺
              </span>
            </div>
          </div>
        </div>

        {/* Back Button Footer */}
        <div className="mt-6 pt-3 border-t border-zinc-900/40">
          <button
            onClick={() => setShowTerms(false)}
            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 hover:text-neutral-900 border border-yellow-400 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[420px] bg-[#020202] border-2 border-zinc-900 rounded-[38px] p-6 relative z-10 flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.95)] min-h-[640px]"
    >
      <div className="flex-1 flex flex-col justify-center">
        {/* Header Visual */}
        <div className="text-center mb-8 select-none">
          <div className="mx-auto w-16 h-16 rounded-full border-2 border-yellow-500/35 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.15)] mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase font-sans">
            TAPWOLF <span className="text-yellow-500">&</span> EARN
          </h2>
          <p className="text-[10px] font-mono text-yellow-500/85 uppercase tracking-widest mt-1.5 font-bold">
            {isSignUp ? 'JOIN THE PACK NOW' : 'TAP TO CONQUER THE PACK'}
          </p>
        </div>

        {/* Warning card for missing credentials */}
        {supabaseError && (
          <div className="mb-5 bg-yellow-500/5 border border-yellow-500/20 p-3 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-[10.5px] font-sans text-yellow-500/90 leading-tight">
                <span className="font-bold uppercase">Supabase variables needed:</span> Create <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">SUPABASE_URL</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">SUPABASE_ANON_KEY</code> environment variables in AI Studio to connect your real database.
              </div>
            </div>
            <button
              onClick={onDemoLogin}
              type="button"
              className="mt-1 self-start flex items-center gap-1.5 text-[9.5px] font-mono font-bold bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-lg transition-all"
            >
              <PlayCircle className="w-3 h-3" />
              BYPASS FOR DEMO SESSION
            </button>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-5 bg-red-950/20 border border-red-500/30 p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-[10.5px] font-sans text-red-400 leading-tight">
              {authError}
            </span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9.5px] font-mono font-black uppercase text-zinc-400 tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="slayer@tapwolf.com"
                className="w-full bg-[#07070a] border border-zinc-900 rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500/55 focus:ring-1 focus:ring-yellow-500/35 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] font-mono font-black uppercase text-zinc-400 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#07070a] border border-zinc-900 rounded-xl py-3 pl-11 pr-4 text-xs font-sans text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500/55 focus:ring-1 focus:ring-yellow-500/35 transition-all"
              />
            </div>
          </div>

          {/* Optional Referral Code field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9.5px] font-mono font-black uppercase text-zinc-400 tracking-wider">
                Referral Code (Optional)
              </label>
              {promoApplied && (
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  Applied! +1,000 Coins claimable ✅
                </span>
              )}
            </div>
            <div className="relative flex gap-2">
              <input
                type="text"
                disabled={promoApplied}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder={promoApplied ? "REWARD CLAIMED" : "WOLF-XXXXX"}
                className="flex-1 bg-[#07070a] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-sans text-white placeholder-zinc-700 focus:outline-none focus:border-yellow-500/55 focus:ring-1 focus:ring-yellow-500/35 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!promoApplied && (
                <button
                  type="button"
                  disabled={promoChecking}
                  onClick={() => handleApplyReferralCode(promoCodeInput)}
                  className="px-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[#FFD700] hover:text-white font-black text-[9.5px] uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {promoChecking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />
                  ) : (
                    'Apply'
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-sans font-black text-xs uppercase tracking-widest rounded-xl border border-yellow-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="text-[10px] font-mono text-zinc-400 hover:text-yellow-500 transition-all uppercase tracking-wider font-black flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              {isSignUp ? (
                <>
                  <span>ALREADY A MEMBER?</span>
                  <span className="text-yellow-500 underline decoration-yellow-500/30">LOG IN</span>
                </>
              ) : (
                <>
                  <span>NEW TO THE PACK?</span>
                  <span className="text-yellow-500 underline decoration-yellow-500/30 font-extrabold">SIGN UP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toggle View & Option to bypass */}
      <div className="mt-8 text-center space-y-3">
        {!supabaseError && (
          <div className="pt-2 border-t border-zinc-900/40">
            <button
              onClick={onDemoLogin}
              type="button"
              className="text-[9.5px] font-mono text-zinc-600 hover:text-yellow-500/70 transition-colors uppercase tracking-wider cursor-pointer"
            >
              ⚡ Fast Track: Open Demo Session
            </button>
          </div>
        )}
        <div className="pt-1 flex justify-center items-center gap-3.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
          <button
            onClick={() => setShowPrivacy(true)}
            type="button"
            className="hover:text-yellow-500/80 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          >
            📄 Privacy Policy
          </button>
          <span className="text-zinc-800 font-bold">•</span>
          <button
            onClick={() => setShowTerms(true)}
            type="button"
            className="hover:text-yellow-500/80 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          >
            ⚖️ Terms & Conditions
          </button>
        </div>
      </div>
    </motion.div>
  );
};
