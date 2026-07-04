import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Copy, 
  Send, 
  Edit2, 
  Check, 
  Sparkles, 
  Trophy, 
  Users, 
  ShieldCheck, 
  Award,
  ChevronRight,
  Crown,
  Zap,
  Info,
  ArrowLeft
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

// @ts-ignore
import wolfFaceImg from '../assets/images/blue_electric_wolf_1782179089672.jpg';

interface ProfileTabProps {
  careerTaps: number;
  autoclickLevel: number;
  multitap: number;
  skinMode: 'realistic' | 'vector3d';
  setSkinMode: (val: 'realistic' | 'vector3d') => void;
  eyeColor: 'amber' | 'cyan' | 'pink' | 'emerald';
  setEyeColor: (val: 'amber' | 'cyan' | 'pink' | 'emerald') => void;
  fbLoading: boolean;
  fbUser: FirebaseUser | null;
  triggerGoogleLogin: () => void;
  triggerGoogleLogout: () => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  audioEngine: any;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  username: string;
  setUsername: (name: string) => void;
  userReferralCode: string;
  hasAppliedRef: boolean;
  setHasAppliedRef: (applied: boolean) => void;
  referredBy: string;
  setReferredBy: (code: string) => void;
  referredCount: number;
  setReferredCount: React.Dispatch<React.SetStateAction<number>>;
  triggerToast: (msg: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  careerTaps,
  autoclickLevel,
  multitap,
  skinMode,
  setSkinMode,
  eyeColor,
  setEyeColor,
  fbLoading,
  fbUser,
  triggerGoogleLogin,
  triggerGoogleLogout,
  isMuted,
  setIsMuted,
  audioEngine,
  coins,
  setCoins,
  username,
  setUsername,
  userReferralCode,
  hasAppliedRef,
  setHasAppliedRef,
  referredBy,
  setReferredBy,
  referredCount,
  setReferredCount,
  triggerToast,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  // Derive Rank Tier Title
  const getRankTier = () => {
    if (coins < 5000) {
      return { title: 'Wandering Scout', icon: '🐾', style: 'border-zinc-800 text-zinc-400 bg-zinc-950/30 shadow-[0_0_10px_rgba(150,150,150,0.1)]' };
    } else if (coins < 25000) {
      return { title: 'Iron Pack Raider', icon: '🛡️', style: 'border-slate-800 text-slate-300 bg-slate-950/45 shadow-[0_0_12px_rgba(148,163,184,0.15)]' };
    } else if (coins < 75000) {
      return { title: 'Elite Nightstalker', icon: '🌙', style: 'border-[#3b82f6]/30 text-blue-400 bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' };
    } else if (coins < 250000) {
      return { title: 'Alpha Pack Captain', icon: '🐺', style: 'border-[#fbbf24]/30 text-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(251,191,36,0.25)]' };
    } else {
      return { title: 'Quantum Wolf Deity', icon: '⚡', style: 'border-[#a855f7]/40 text-purple-400 bg-purple-950/30 shadow-[0_0_25px_rgba(168,85,247,0.35)] animate-pulse' };
    }
  };

  const rank = getRankTier();

  // Save customized name
  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed.length > 0 && trimmed.length <= 16) {
      setUsername(trimmed);
      setIsEditingName(false);
      audioEngine.playTap(1);
      triggerToast('Display name updated successfully! 🐺');
    } else {
      triggerToast('Name must be between 1 and 16 letters!');
    }
  };

  // Copy Referral Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(userReferralCode);
    setCopiedCode(true);
    audioEngine.playTap(1);
    triggerToast('Referral code copied! 📋');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy custom sharing link
  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}?ref=${userReferralCode}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    audioEngine.playTap(2);
    triggerToast('Invite link copied! 🔗');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Submit referral promo code
  const handleSubmitReferral = () => {
    // Moved to LoginScreen
  };  // Simulated list of premium referrals
  const mockReferrals = [
    { name: 'Alpha Hunter #591', time: '10m ago', reward: '+1,000', label: 'Claimed' },
    { name: 'Ghost_Predator', time: '2h ago', reward: '+1,000', label: 'Claimed' },
  ];

  if (showAboutUs) {
    return (
      <div className="flex-1 flex flex-col h-full max-h-[510px] animate-fadeIn select-none">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-900 mb-4 select-none shrink-0">
          <button
            onClick={() => {
              try { audioEngine.playTap(1); } catch (e) {}
              setShowAboutUs(false);
            }}
            className="p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">About Us</h3>
            <p className="text-[8px] font-mono text-zinc-500 uppercase">Tap Wolf & Earn</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-zinc-300 space-y-4 max-h-[380px] scrollbar-thin select-text">
          <div className="bg-zinc-950/85 border border-zinc-900/80 rounded-2xl p-5 space-y-4">
            <div className="text-center pb-2 border-b border-zinc-900/50">
              <span className="text-[14px] font-black text-white block tracking-wide font-sans">
                ABOUT US
              </span>
              <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest font-black mt-1 block">
                TAP WOLF & EARN
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans text-center font-bold">
              Welcome to <span className="text-yellow-400 font-extrabold">Tap Wolf & Earn</span>!
            </p>

            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans text-justify">
              We are a fun and engaging interactive gaming platform where users can enjoy tapping mechanics to accumulate rewards. Our mission is to provide a transparent, secure, and entertaining experience for gaming enthusiasts worldwide. Powered by secure cloud infrastructure and developed with a passion for gaming, Tap Wolf & Earn ensures fair play and exciting milestones for everyone.
            </p>

            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans text-justify">
              Thank you for being a part of our pack! Let's tap and grow together.
            </p>
          </div>

          <div className="text-center py-2 select-none">
            <span className="text-[9px] font-mono text-zinc-650 uppercase tracking-widest block animate-pulse">
              🐺 Run with the Pack 🐺
            </span>
          </div>
        </div>

        {/* Footer Back Button */}
        <div className="mt-4 pt-3 border-t border-zinc-900 shrink-0">
          <button
            onClick={() => {
              try { audioEngine.playTap(1); } catch (e) {}
              setShowAboutUs(false);
            }}
            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 rounded-xl font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            ← Back to HQ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 py-1 animate-fadeIn overflow-y-auto max-h-[510px] scrollbar-thin">
      
      {/* 1. Header Section */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <User className="text-yellow-400 shrink-0" size={17} />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white">Wolf Pack HQ</h3>
            <p className="text-[9px] text-zinc-500 font-mono">MANAGE PROFILE, RANKINGS & PACK REFERRALS</p>
          </div>
        </div>
        <button
          onClick={triggerGoogleLogout}
          className="px-2.5 py-1 bg-red-950/20 border border-red-500/35 hover:bg-red-950/45 text-red-400 font-mono text-[9px] font-bold uppercase rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
        >
          <span>Log Out</span>
        </button>
      </div>

      {/* Welcome Back Header Block */}
      <div className="flex items-center gap-3.5 select-none bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900/60 shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFD700] bg-black shadow-[0_0_12px_rgba(255,215,0,0.25)] shrink-0 p-0.5 relative">
          <img 
            src={fbUser?.photoURL || wolfFaceImg} 
            alt="Alpha avatar" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h5 className="text-[11px] font-mono text-zinc-550 uppercase tracking-wider leading-none">
            Welcome back
          </h5>
          <h2 className="text-base font-black text-[#FFD700] mt-1 leading-none flex items-center gap-1.5 font-sans">
            {username} 🐺
          </h2>
        </div>
      </div>

      {/* 2. PREMIUM USER PROFILE CARD */}
      <div className="bg-gradient-to-b from-[#111116] via-[#0a0a0f] to-[#050508] border-t-2 border-t-amber-400/40 border-x border-b border-zinc-800/85 rounded-[24px] p-5 relative select-none shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(251,191,36,0.04)] overflow-hidden group shrink-0">
        
        {/* Animated ambient premium shimmer backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-2xl group-hover:from-amber-400/10 transition-all duration-700 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-bl from-amber-500/2 to-transparent rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar frame with glowing premium border layout */}
          <div className="relative w-[70px] h-[70px] shrink-0 select-none">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full blur-[4px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="w-full h-full rounded-full overflow-hidden border-[1.5px] border-[#FFD700] bg-zinc-950 p-[2.5px] shadow-[0_0_15px_rgba(251,191,36,0.35)] relative z-10">
              <img 
                src={fbUser?.photoURL || wolfFaceImg} 
                alt="Pack Hunter" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* VIP Label Tag overlay */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-[#09090c] font-sans font-black text-[7px] px-1.5 py-0.5 rounded-full border border-yellow-200/50 tracking-wider shadow uppercase z-20 whitespace-nowrap">
              VIP MEMBER
            </div>

            {/* Float badge for rank icon */}
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-zinc-800 to-zinc-950 text-neutral-950 font-black rounded-full text-[9px] w-[20px] h-[20px] flex items-center justify-center border border-amber-400 shadow-xl z-20">
              {rank.icon}
            </div>
          </div>

          {/* User Details Section */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <span className="text-[8.5px] font-mono font-black text-amber-550 tracking-widest uppercase">
                Active Hunter File
              </span>
              <Crown className="text-yellow-400 inline-block fill-yellow-400/10" size={10} />
            </div>

            {/* Interactive Edit Display Name */}
            {isEditingName ? (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <input 
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={16}
                  className="bg-black/95 border-[1.5px] border-yellow-500/60 text-white rounded-lg px-2 py-1 text-xs select-all outline-none w-full max-w-[150px] focus:border-yellow-400 transition-all font-sans font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                  autoFocus
                />
                <button 
                  onClick={handleSaveName}
                  className="p-1 px-2 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 rounded-lg cursor-pointer transition-all active:scale-95"
                >
                  <Check size={11} className="stroke-[3.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 group/name mt-1">
                <span className="text-sm font-black text-white tracking-wide truncate max-w-[130px] sm:max-w-[170px] font-sans bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent drop-shadow">
                  {username}
                </span>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="p-1 opacity-70 hover:opacity-100 hover:text-yellow-400 rounded transition-all cursor-pointer bg-zinc-900 duration-150"
                  title="Rename Profile"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            )}

            {/* Unique VIP Serial Number ID Card Header details */}
            <div className="mt-0.5 font-mono text-[8.5px] text-zinc-500 tracking-wider flex items-center justify-center sm:justify-start gap-1 select-all">
              <span>ID: {userReferralCode}</span>
              <span className="text-zinc-700">•</span>
              <span>EST. 2026</span>
            </div>

            {/* Active Rank Tier Display */}
            <div className={`mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 border rounded-full text-[8.5px] font-black uppercase tracking-widest leading-none ${rank.style} cursor-default select-none`}>
              <span className="w-1 h-1 rounded-full bg-current animate-ping opacity-75 shrink-0" />
              <span>{rank.title}</span>
            </div>
          </div>
        </div>


      </div>

      {/* 3. PREMIUM REFER & EARN CODE ENGINE */}
      <div className="bg-gradient-to-b from-[#0d0d10] to-[#070709] border-[1.5px] border-zinc-800/80 rounded-[24px] p-5 select-none shadow-xl shrink-0">
        <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Users size={12} className="text-yellow-400" />
          <span>🐾 Wolf Pack Referral Network</span>
        </h4>
        
        <p className="text-[9.5px] text-zinc-400 leading-relaxed mt-2.5 select-all">
          Invite other wolf-pack slayers! You both receive <span className="text-[#FFD700] font-bold">1,000 coins</span> instantly when your unique referral code is submitted at login.
          <br />
          <span className="text-yellow-500/85 font-semibold block mt-1">⚠️ Daily Earning Limit: 5 Referrals maximum (5,000 Coins / day)</span>
        </p>

        {/* Display own code with dynamic copy feedback */}
        <div className="mt-4 flex flex-col gap-2 p-3 bg-black/60 border border-zinc-900/90 rounded-2xl">
          <div className="flex items-center justify-between gap-2.5">
            <div>
              <span className="text-[8.5px] font-mono text-zinc-550 uppercase block leading-none">Your Referral Code</span>
              <span className="text-[15px] font-sans font-black text-white block tracking-wider mt-1">{userReferralCode}</span>
            </div>
            
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={handleCopyCode}
                className="p-2 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 text-zinc-300 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all text-[9.5px] font-bold font-sans active:scale-95 text-center min-w-[72px]"
              >
                {copiedCode ? (
                  <>
                    <Check size={11} className="text-green-400" />
                    <span className="text-green-400 text-[9px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                className="p-2 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-[#FFD700] border border-yellow-500/20 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all text-[9.5px] font-bold font-sans active:scale-95 text-center"
              >
                {copiedLink ? (
                  <Check size={11} className="text-yellow-400" />
                ) : (
                  <Send size={11} />
                )}
                <span>Share Invite</span>
              </button>
            </div>
          </div>
        </div>

        {/* REFERRAL CODE STATUS PANEL */}
        {hasAppliedRef && (
          <div className="mt-4 pt-4 border-t border-zinc-900/80 flex flex-col gap-2.5">
            <div className="bg-emerald-950/25 border border-emerald-900/40 p-3 rounded-2xl flex items-center gap-2.5 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)] text-center justify-center">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <div className="text-left leading-normal">
                <span className="text-[9px] text-zinc-400 block font-mono">REFERRED BY PACK LEADER</span>
                <span className="text-[10px] text-emerald-400 font-extrabold font-sans">
                  {referredBy} (+1,000 Coins Claimed ✅)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mock/Simulated referrals database roster list */}
        <div className="mt-4 pt-3.5 border-t border-zinc-900/80">
          <div className="flex items-center justify-between text-[8px] text-zinc-550 font-mono tracking-wider block uppercase mb-2">
            <span>PACK REFERRALS DIRECTLY JOINED</span>
            <span className="text-yellow-500 font-bold font-mono">DAILY LIMIT: {Math.min(referredCount, 5)}/5 CLAIMS</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {mockReferrals.map((friend, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 px-2.5 rounded-xl bg-[#09090b]/40 border border-zinc-900 flex items-center text-[10px] font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#FFD700] bg-yellow-500/10 px-1 border border-yellow-500/10 rounded font-mono font-bold">1</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[120px]">{friend.name}</span>
                  <span className="text-[8px] text-zinc-550 font-mono">{friend.time}</span>
                </div>
                <div className="flex items-center gap-1 font-bold shrink-0">
                  <span className="text-emerald-400 text-[9.5px] font-bold">{friend.reward}</span>
                  <Award size={10} className="text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SETTINGS & INFO FOOTER */}
      <div className="mt-1 shrink-0 flex flex-col gap-2">
        <button
          onClick={() => {
            try { audioEngine.playTap(1); } catch (e) {}
            setShowAboutUs(true);
          }}
          className="w-full p-3 bg-[#09090c]/85 border border-zinc-900 rounded-2xl flex items-center justify-between text-left hover:bg-zinc-900/40 hover:border-zinc-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/15 text-yellow-500 flex items-center justify-center group-hover:bg-yellow-500/20 group-hover:scale-105 transition-all">
              <Info size={14} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-white block leading-snug">About Tap Wolf & Earn</span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wide">Learn about our mission and platform</span>
            </div>
          </div>
          <ChevronRight size={14} className="text-zinc-550 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

    </div>
  );
};
