import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchFirebaseConfig, 
  getFirebase, 
  loginWithGoogle, 
  logoutUser, 
  isValidFirebaseConfig, 
  FirebaseConfig 
} from './lib/firebase';
import { Auth, User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Cpu, 
  Wallet,
  User,
  List,
  X,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Star,
  Diamond,
  ShieldAlert,
  Coins,
  Lock
} from 'lucide-react';
import { audioEngine } from './components/AudioEngine';
import { TapParticle, Milestone, MILESTONES, WorthCardRequest } from './types';
import { TasksTab } from './components/TasksTab';
import { WalletTab } from './components/WalletTab';
import { ProfileTab } from './components/ProfileTab';
import { getSupabaseClient } from './lib/supabase';
import { LoginScreen } from './components/LoginScreen';
import { User as SupabaseUser } from '@supabase/supabase-js';

// High-fidelity image assets for correct bundling and loading in production
// @ts-ignore
import blueWolfImg from './assets/images/blue_electric_wolf_1782179089672.jpg';
// @ts-ignore
import wolfFaceImg from './assets/images/blue_electric_wolf_1782179089672.jpg';
// @ts-ignore
import goldCoinImg from './assets/images/gold_coin_1781965362120.jpg';

let nextUniqueParticleId = Math.floor(Math.random() * 10000000);

const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const offset = d.getTimezoneOffset();
  const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

export default function App() {
  // --- STATE DEFAULTS / CLIENT STATE INITIALIZATION ---
  const [coins, setCoins] = useState<number>(0);
  const [careerTaps, setCareerTaps] = useState<number>(0);
  const [multitap, setMultitap] = useState<number>(1);
  const [autoclickLevel, setAutoclickLevel] = useState<number>(0);
  const [capacityLevel, setCapacityLevel] = useState<number>(1);
  const [regenLevel, setRegenLevel] = useState<number>(1);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [lastCheckInDate, setLastCheckInDate] = useState<string>('');
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [claimedMilestones, setClaimedMilestones] = useState<string[]>([]);
  const [completedDailyTasks, setCompletedDailyTasks] = useState<string[]>([]);
  const [claimedDailyMilestones, setClaimedDailyMilestones] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // --- REFERRAL & PROFILE STATES ---
  const [username, setUsername] = useState<string>('Alpha Hunt Master');
  const [userReferralCode, setUserReferralCode] = useState<string>(() => {
    return `WOLF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  });
  const [hasAppliedRef, setHasAppliedRef] = useState<boolean>(false);
  const [referredBy, setReferredBy] = useState<string>('');
  const [referredCount, setReferredCount] = useState<number>(0);

  // --- HIGH FIDELITY GAMIFICATION STATES ---
  const [skinMode, setSkinMode] = useState<'realistic' | 'vector3d'>('realistic');
  const [eyeColor, setEyeColor] = useState<'amber' | 'cyan' | 'pink' | 'emerald'>('amber');
  const [combo, setCombo] = useState<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const [tilt, setTilt] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });

  // Anti-cheat variables
  const [isCheatLocked, setIsCheatLocked] = useState<boolean>(false);
  const [cheatLockTimeLeft, setCheatLockTimeLeft] = useState<number>(0);
  const clickTimesRef = useRef<number[]>([]);
  const lastTapProcessedRef = useRef<number>(0);

  // Calculate stats based on Upgrade tiers
  const maxEnergy = 500 + (capacityLevel - 1) * 150;
  const regenRate = 3 + (regenLevel - 1) * 2;

  // --- RUNTIME STATE ---
  const [energy, setEnergy] = useState<number>(maxEnergy);
  const [particles, setParticles] = useState<TapParticle[]>([]);
  const [activeTab, setActiveTab] = useState<'tap' | 'tasks' | 'wallet' | 'profile'>('tap');
  
  // --- DAILY COINS LIMIT STATE ---
  const [coinsAtStartOfDay, setCoinsAtStartOfDay] = useState<number>(() => {
    try {
      const todayStr = getLocalDateString();
      const savedStart = localStorage.getItem('coinsAtStartOfDay');
      return savedStart ? Number(savedStart) : 0;
    } catch {
      return 0;
    }
  });

  const [dailyTapCount, setDailyTapCount] = useState<number>(() => {
    try {
      const todayStr = getLocalDateString();
      const userId = 'guest';
      const cleanKey = `daily_tap_limit_v2_${userId}`;
      const raw = localStorage.getItem(cleanKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayStr) {
          return Number(parsed.earned) || 0;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  });

  const dailyTapCoins = dailyTapCount;
  const setDailyTapCoins = setDailyTapCount;
  const dailyLimitCounter = dailyTapCount;
  const setDailyLimitCounter = setDailyTapCount;
  const dailyEarnedCoins = dailyTapCount;
  const setDailyEarnedCoins = setDailyTapCount;
  const setDailyEarningLimit = setDailyTapCount;

  const [showDailyLimitModal, setShowDailyLimitModal] = useState<boolean>(() => {
    try {
      const todayStr = getLocalDateString();
      const userId = 'guest';
      const cleanKey = `daily_tap_limit_v2_${userId}`;
      const raw = localStorage.getItem(cleanKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayStr) {
          return (Number(parsed.earned) || 0) >= 10000;
        }
      }
      return false;
    } catch {
      return false;
    }
  });
  const [dailyLimitCountdown, setDailyLimitCountdown] = useState<string>('');
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(false);

  // --- AD SYSTEM STATE ---
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adTimer, setAdTimer] = useState<number>(5);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [showRefillChoiceModal, setShowRefillChoiceModal] = useState<boolean>(false);
  const [adRewardType, setAdRewardType] = useState<'standard' | 'energy_refill' | 'daily_check_in' | 'daily_task' | 'interstitial_milestone'>('standard');
  const [checkInTargetDay, setCheckInTargetDay] = useState<number>(0);
  const [adsWatchedCount, setAdsWatchedCount] = useState<number>(0);
  const [adsRequiredCount, setAdsRequiredCount] = useState<number>(0);
  const [showDailyCheckInConfirmModal, setShowDailyCheckInConfirmModal] = useState<boolean>(false);
  const [confirmModalDay, setConfirmModalDay] = useState<number>(1);
  const [showStreakBrokenModal, setShowStreakBrokenModal] = useState<boolean>(false);

  // --- INTERSTITIAL AD GATE STATE (500 COIN MULTIPLES) ---
  const [lastAdMilestone, setLastAdMilestone] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('last_ad_milestone');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [showAdGatePopup, setShowAdGatePopup] = useState<boolean>(false);
  const [isTapLocked, setIsTapLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('is_tap_locked');
      return saved === 'true';
    } catch {
      return false;
    }
  });



  useEffect(() => {
    try {
      localStorage.setItem('is_tap_locked', String(isTapLocked));
    } catch {}
  }, [isTapLocked]);

  // Daily Tasks states
  const [showDailyTaskConfirmModal, setShowDailyTaskConfirmModal] = useState<boolean>(false);
  const [confirmModalTaskId, setConfirmModalTaskId] = useState<'task1' | 'task2' | 'task3' | null>(null);
  const [confirmModalTaskLabel, setConfirmModalTaskLabel] = useState<string>('');
  const [activeDailyTaskId, setActiveDailyTaskId] = useState<'task1' | 'task2' | 'task3' | null>(null);
  const [lastTaskDate, setLastTaskDate] = useState<string>('');

  // --- INTERSTITIAL AD STATE ---
  const [interstitialProgress, setInterstitialProgress] = useState<number>(0);
  const [lastKnownCoins, setLastKnownCoins] = useState<number>(0);
  const [showInterstitial, setShowInterstitial] = useState<boolean>(false);
  const [interstitialTimer, setInterstitialTimer] = useState<number>(5);

  // --- WALLET PAYOUT STATE ---
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // --- WORTH CARDS STATE ---
  const [worthCardRequests, setWorthCardRequests] = useState<WorthCardRequest[]>([]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
  const [allAdminRequests, setAllAdminRequests] = useState<WorthCardRequest[]>([]);
  const [isLoadingAdminRequests, setIsLoadingAdminRequests] = useState<boolean>(false);
  
  // --- UI TRANSITIONS ---
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Refuel booster cooldown limits
  const [lastRefuelTime, setLastRefuelTime] = useState<number>(0);
  const [timeToNextRefuel, setTimeToNextRefuel] = useState<number>(0);

  // --- WITHDRAWAL LOCK COOLDOWN ENGINE ---
  const [accountCreatedAt, setAccountCreatedAt] = useState<number>(() => Date.now());

  // --- SUPABASE AUTHENTICATION STATE ---
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const saveUserTapCount = (count: number, userId?: string) => {
    try {
      const actualId = userId || supabaseUser?.id || 'guest';
      const todayStr = getLocalDateString();
      const cleanKey = `daily_tap_limit_v2_${actualId}`;
      localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: count }));
      
      // compatibility saves
      localStorage.setItem('daily_tap_coins', String(count));
      localStorage.setItem('daily_limit_counter', String(count));
    } catch (e) {
      console.warn("Failed to save user tap count:", e);
    }
  };

  const loadUserTapCount = (userId: string) => {
    try {
      const todayStr = getLocalDateString();
      const cleanKey = `daily_tap_limit_v2_${userId}`;
      const raw = localStorage.getItem(cleanKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayStr) {
          const count = Number(parsed.earned) || 0;
          setDailyTapCount(count);
          return count;
        }
      }
      localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: 0 }));
      setDailyTapCount(0);
      return 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const userId = supabaseUser?.id || 'guest';
    loadUserTapCount(userId);
  }, [supabaseUser]);

  // --- FIREBASE SYNC MANAGEMENT ---
  const [fbConfig, setFbConfig] = useState<FirebaseConfig | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [fbAuth, setFbAuth] = useState<Auth | null>(null);
  const [fbLoading, setFbLoading] = useState<boolean>(true);
  const [pendingSync, setPendingSync] = useState<boolean>(false);

  // Initialize volume preferences on AudioEngine
  useEffect(() => {
    audioEngine.enabled = !isMuted;
  }, [isMuted]);

  // Volume preference is initialized on AudioEngine only
  useEffect(() => {
    audioEngine.enabled = !isMuted;
  }, [isMuted]);

  // Sync lastKnownCoins with coins to keep state aligned safely
  useEffect(() => {
    setLastKnownCoins(coins);
  }, [coins]);

  // Handle speed combo decay ticker
  useEffect(() => {
    const decayInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTapTimeRef.current;
      if (elapsed > 1000) {
        setCombo((prev) => {
          if (prev <= 0) return 0;
          if (prev > 15) return prev - 3;
          if (prev > 5) return prev - 1;
          return prev - 1;
        });
      }
    }, 250);
    return () => clearInterval(decayInterval);
  }, []);

  // Handle refuel boost cooldown ticker updates
  useEffect(() => {
    const checkCooldown = () => {
      const now = Date.now();
      const elapsed = now - lastRefuelTime;
      const cooldownPeriod = 30000;
      if (elapsed < cooldownPeriod) {
        setTimeToNextRefuel(Math.ceil((cooldownPeriod - elapsed) / 1000));
      } else {
        setTimeToNextRefuel(0);
      }
    };

    checkCooldown();
    const tracker = setInterval(checkCooldown, 1000);
    return () => clearInterval(tracker);
  }, [lastRefuelTime]);

  // Handle Suspicious Clinking Locked Ticker Countdown
  useEffect(() => {
    if (!isCheatLocked) return;
    const t = setInterval(() => {
      setCheatLockTimeLeft((p) => {
        if (p <= 1) {
          setIsCheatLocked(false);
          clickTimesRef.current = [];
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isCheatLocked]);

  // Gradual energy generation ticker
  useEffect(() => {
    const recovery = setInterval(() => {
      setEnergy((prev) => Math.min(prev + regenRate, maxEnergy));
    }, 1000);
    return () => clearInterval(recovery);
  }, [regenRate, maxEnergy]);

  // Drone auto-harvester passive ticker (Removed to turn off auto-clicker)

  // Manage simulated ad timer countdown tick
  useEffect(() => {
    if (isWatchingAd) {
      setAdTimer(5);
      const adInterval = setInterval(() => {
        setAdTimer((prev) => {
          if (prev <= 1) {
            clearInterval(adInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(adInterval);
    }
  }, [isWatchingAd]);

  // Auto-claim ad reward when countdown hits 0 to automatically dismiss the ad screen and unlock
  useEffect(() => {
    if (isWatchingAd && adTimer === 0) {
      claimAdReward();
    }
  }, [adTimer, isWatchingAd]);

  // Manage simulated interstitial ad timer countdown tick
  useEffect(() => {
    if (showInterstitial) {
      setInterstitialTimer(5);
      const interstitialInterval = setInterval(() => {
        setInterstitialTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interstitialInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interstitialInterval);
    }
  }, [showInterstitial]);

  // Sync dailyLimitCounter to Local Storage
  useEffect(() => {
    try {
      const userId = supabaseUser?.id || 'guest';
      saveUserTapCount(dailyTapCount, userId);
    } catch (e) {
      console.error("Error saving daily limit counter:", e);
    }
  }, [dailyTapCount, supabaseUser]);

  // Synchronize daily limit modal visibility with the state instantly
  useEffect(() => {
    if (dailyTapCount >= 10000) {
      setShowDailyLimitModal(true);
    } else {
      setShowDailyLimitModal(false);
    }
  }, [dailyTapCount]);

  // Periodic check for day transition to reset daily limit
  useEffect(() => {
    const checkDateTransition = () => {
      try {
        const todayStr = getLocalDateString();
        const userId = supabaseUser?.id || 'guest';
        const cleanKey = `daily_tap_limit_v2_${userId}`;
        const raw = localStorage.getItem(cleanKey);
        
        let needReset = false;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.date !== todayStr) {
            needReset = true;
          }
        } else {
          // If no record exists, initialize it
          localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: 0 }));
        }
        
        if (needReset) {
          // Day has changed! Reset limit.
          localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: 0 }));
          
          // compatibility resets
          localStorage.setItem('lastPlayedDate', todayStr);
          localStorage.setItem('last_played_date', todayStr);
          localStorage.setItem('daily_tap_coins', '0');
          localStorage.setItem('daily_limit_counter', '0');
          localStorage.setItem('coinsAtStartOfDayDate', todayStr);
          
          setDailyTapCount(0);
          setShowDailyLimitModal(false);
          setDailyLimitCountdown("");
          
          if (supabaseUser) {
            saveSupabaseDataImmediately(undefined, 0, 0);
          }
          triggerToast("📅 Naya din shuru! Aapki daily limit reset ho gayi hai. 🐺🔥");
        }
      } catch (e) {
        console.error("Error checking offline date transition:", e);
      }
    };

    checkDateTransition(); // Run immediately on mount
    const interval = setInterval(checkDateTransition, 1000);
    return () => clearInterval(interval);
  }, [supabaseUser]);

  // Manage real-time countdown to midnight when daily limit is reached
  useEffect(() => {
    if (dailyTapCount >= 10000 || showDailyLimitModal) {
      const updateCountdown = () => {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        const diffMs = midnight.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          const todayStr = getLocalDateString();
          const userId = supabaseUser?.id || 'guest';
          const cleanKey = `daily_tap_limit_v2_${userId}`;
          localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: 0 }));
          
          setDailyTapCount(0);
          setDailyLimitCountdown("");
          setShowDailyLimitModal(false);
          return;
        }

        const hrs = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        setDailyLimitCountdown(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setDailyLimitCountdown("");
    }
  }, [dailyTapCount, showDailyLimitModal, supabaseUser]);

  const validateStreak = (lastDate: string, streak: number, days: number[]) => {
    return null;
  };

  // 30-Day Check-in Calendar requires no auto-resetting streak validations on startup
  useEffect(() => {
    // Kept intact without resetting state
  }, []);

  // Load backend Firebase configuration on startup
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initializeFirebase = async () => {
      try {
        setFbLoading(true);
        const config = await fetchFirebaseConfig();
        setFbConfig(config);
        
        if (isValidFirebaseConfig(config)) {
          const { auth } = getFirebase(config);
          setFbAuth(auth);
          
          unsubscribe = onAuthStateChanged(auth, (user) => {
            setFbUser(user);
            setFbLoading(false);
          });
        } else {
          setFbLoading(false);
        }
      } catch (err) {
        console.warn("FCM login offline sync fallback:", err);
        setFbLoading(false);
      }
    };

    initializeFirebase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Download user profile document from Firestore when logged in
  useEffect(() => {
    if (!fbUser || !fbAuth || !fbConfig) return;

    const pullServerData = async () => {
      try {
        const { db } = getFirebase(fbConfig);
        const userRef = doc(db, "users_tapcoins", fbUser.uid);
        const colSnap = await getDoc(userRef);
        
        if (colSnap.exists()) {
          const svr = colSnap.data();
          
          let finalLastDate = svr.lastCheckInDate !== undefined ? svr.lastCheckInDate : lastCheckInDate;
          let finalStreak = svr.currentStreak !== undefined ? svr.currentStreak : currentStreak;
          let finalDays = svr.claimedDays !== undefined ? svr.claimedDays : claimedDays;

          const res = validateStreak(finalLastDate, finalStreak, finalDays);
          
          if (res) {
            if (svr.coins !== undefined) setCoins(svr.coins);
            if (svr.careerTaps !== undefined) setCareerTaps(svr.careerTaps);
            if (svr.multitap !== undefined) setMultitap(svr.multitap);
            if (svr.autoclickLevel !== undefined) setAutoclickLevel(svr.autoclickLevel);
            if (svr.capacityLevel !== undefined) setCapacityLevel(svr.capacityLevel);
            if (svr.regenLevel !== undefined) setRegenLevel(svr.regenLevel);
            if (svr.claimedMilestones !== undefined) setClaimedMilestones(svr.claimedMilestones);
            if (svr.username !== undefined) setUsername(svr.username);
            if (svr.hasAppliedRef !== undefined) setHasAppliedRef(svr.hasAppliedRef);
            if (svr.referredBy !== undefined) setReferredBy(svr.referredBy);
            if (svr.referredCount !== undefined) setReferredCount(svr.referredCount);
            if (svr.accountCreatedAt !== undefined) {
              setAccountCreatedAt(svr.accountCreatedAt);
            }
            if (svr.worthCardRequests !== undefined) {
              setWorthCardRequests(svr.worthCardRequests);
            }

            setCurrentStreak(res.currentStreak);
            setClaimedDays(res.claimedDays);
            setLastCheckInDate(res.lastCheckInDate);
            if (res.showModal) {
              setShowStreakBrokenModal(true);
            }
          } else {
            if (svr.coins !== undefined) setCoins(svr.coins);
            if (svr.careerTaps !== undefined) setCareerTaps(svr.careerTaps);
            if (svr.multitap !== undefined) setMultitap(svr.multitap);
            if (svr.autoclickLevel !== undefined) setAutoclickLevel(svr.autoclickLevel);
            if (svr.capacityLevel !== undefined) setCapacityLevel(svr.capacityLevel);
            if (svr.regenLevel !== undefined) setRegenLevel(svr.regenLevel);
            if (svr.claimedDays !== undefined) setClaimedDays(svr.claimedDays);
            if (svr.lastCheckInDate !== undefined) setLastCheckInDate(svr.lastCheckInDate);
            if (svr.currentStreak !== undefined) setCurrentStreak(svr.currentStreak);
            if (svr.claimedMilestones !== undefined) setClaimedMilestones(svr.claimedMilestones);
            if (svr.username !== undefined) setUsername(svr.username);
            if (svr.hasAppliedRef !== undefined) setHasAppliedRef(svr.hasAppliedRef);
            if (svr.referredBy !== undefined) setReferredBy(svr.referredBy);
            if (svr.referredCount !== undefined) setReferredCount(svr.referredCount);
            if (svr.accountCreatedAt !== undefined) {
              setAccountCreatedAt(svr.accountCreatedAt);
            }
            if (svr.worthCardRequests !== undefined) {
              setWorthCardRequests(svr.worthCardRequests);
            }
          }

          if (svr.completedDailyTasks !== undefined) {
            const todayStr = getLocalDateString();
            const serverTaskDate = svr.lastTaskDate || '';
            if (serverTaskDate === todayStr) {
              setCompletedDailyTasks(svr.completedDailyTasks);
              setLastTaskDate(serverTaskDate);
              if (svr.claimedDailyMilestones !== undefined) {
                setClaimedDailyMilestones(svr.claimedDailyMilestones);
              }
            } else {
              setCompletedDailyTasks([]);
              setClaimedDailyMilestones([]);
              setLastTaskDate(todayStr);
            }
          }

          triggerToast("Cloud save synchronized! 🐺☁️");
        }
      } catch (err) {
        console.warn("Firestore pull failure:", err);
      }
    };

    pullServerData();
  }, [fbUser, fbAuth, fbConfig]);

  // Upload user parameters to Firestore (Debounced write)
  useEffect(() => {
    if (!fbUser || !fbAuth || !fbConfig || !pendingSync) return;

    const syncTimer = setTimeout(async () => {
      try {
        const { db } = getFirebase(fbConfig);
        const userRef = doc(db, "users_tapcoins", fbUser.uid);
        await setDoc(userRef, {
          coins,
          careerTaps,
          multitap,
          autoclickLevel,
          capacityLevel,
          regenLevel,
          claimedDays,
          claimedMilestones,
          lastCheckInDate,
          currentStreak,
          completedDailyTasks,
          claimedDailyMilestones,
          worthCardRequests,
          lastTaskDate,
          username,
          hasAppliedRef,
          referredBy,
          referredCount,
          accountCreatedAt,
          lastSyncTime: Date.now()
        }, { merge: true });
        setPendingSync(false);
      } catch (e) {
        console.warn("Firestore sync fallback:", e);
      }
    }, 2500);

    return () => clearTimeout(syncTimer);
  }, [coins, careerTaps, multitap, autoclickLevel, capacityLevel, regenLevel, claimedDays, claimedMilestones, fbUser, fbAuth, fbConfig, pendingSync, username, hasAppliedRef, referredBy, referredCount, lastCheckInDate, currentStreak, completedDailyTasks, claimedDailyMilestones, worthCardRequests, accountCreatedAt, lastTaskDate]);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    const toastTimer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(toastTimer);
  };

  // Splash Screen Timer
  useEffect(() => {
    if (!isAuthLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        audioEngine.playGameStart();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  // Supabase Auth Session and state listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    async function initSupabase() {
      try {
        const supabase = await getSupabaseClient();
        setSupabaseError(null);
        
        // Check if user is logged in using getUser() as soon as the app starts
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (user) {
          setSupabaseUser(user);
          const emailName = user.email?.split('@')[0] || 'Slayer';
          setUsername(emailName);
          let creationTime = Date.now();
          if (user.created_at) {
            creationTime = Date.parse(user.created_at);
          }
          setAccountCreatedAt(creationTime);

          // Fetch profile data from the profiles table immediately matching user.id
          await loadSupabaseProfileForUser(user.id, user.email || '');
        } else {
          // If no active user, check session just in case of any edge cases
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setSupabaseUser(session.user);
            await loadSupabaseProfileForUser(session.user.id, session.user.email || '');
          }
        }
        
        // Set up active subscription to listen to auth changes (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            setSupabaseUser(session.user);
            const emailName = session.user.email?.split('@')[0] || 'Slayer';
            setUsername(emailName);
            let creationTime = Date.now();
            if (session.user.created_at) {
              creationTime = Date.parse(session.user.created_at);
            }
            setAccountCreatedAt(creationTime);

            await loadSupabaseProfileForUser(session.user.id, session.user.email || '');
          } else {
            setSupabaseUser(null);
            if (event === 'SIGNED_OUT' && lastLoadedUserIdRef.current !== null) {
              lastLoadedUserIdRef.current = null;
              triggerToast("Logged out from session. Your progress is kept safe! 🐺");
            }
          }
        });
        
        unsubscribe = () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.warn("Supabase configuration notice:", err.message);
        setSupabaseError(err.message || "Supabase environment variables not configured.");
      } finally {
        setIsAuthLoading(false);
      }
    }

    initSupabase();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Track the last loaded user ID to prevent redundant loading or stale state crossovers
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const profileColumnsRef = useRef<string[]>([]);
  const activeFetchUserIdRef = useRef<string | null>(null);

  // SINGLE UNIFIED FUNCTION TO FETCH AND SYNC USER PROFILE DATA FROM SUPABASE
  const loadData = async (userId: string, userEmail: string) => {
    if (activeFetchUserIdRef.current === userId) {
      console.log("Profile fetch already in progress for this user, skipping concurrent load.");
      return false;
    }
    activeFetchUserIdRef.current = userId;
    try {
      const supabase = await getSupabaseClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching Supabase profile:", error.message);
        triggerToast("Error fetching profile.");
        return false;
      }

      if (profile) {
        profileColumnsRef.current = Object.keys(profile);
        
        // Load data together safely, prioritizing standard and newer column names
        const dbCoins = profile.coins !== undefined ? Number(profile.coins) : 0;
        const dbCareerTaps = profile.career_taps !== undefined ? Number(profile.career_taps) : (profile.careerTaps !== undefined ? Number(profile.careerTaps) : 0);
        const dbMultitap = profile.multitap !== undefined ? Number(profile.multitap) : 1;
        const dbAutoclickLevel = profile.autoclick_level !== undefined ? Number(profile.autoclick_level) : (profile.autoclickLevel !== undefined ? Number(profile.autoclickLevel) : 0);
        const dbCapacityLevel = profile.capacity_level !== undefined ? Number(profile.capacity_level) : (profile.capacityLevel !== undefined ? Number(profile.capacityLevel) : 1);
        const dbRegenLevel = profile.regen_level !== undefined ? Number(profile.regen_level) : (profile.regenLevel !== undefined ? Number(profile.regenLevel) : 1);
        const dbUsername = profile.username || userEmail.split('@')[0] || 'Slayer';
        const dbReferralCode = profile.user_referral_code || profile.userReferralCode || `WOLF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const dbHasAppliedRef = profile.has_applied_ref !== undefined ? profile.has_applied_ref : (profile.hasAppliedRef !== undefined ? profile.hasAppliedRef : false);
        const dbReferredBy = profile.referred_by || profile.referredBy || '';
        const dbReferredCount = profile.referred_count !== undefined ? Number(profile.referred_count) : (profile.referredCount !== undefined ? Number(profile.referredCount) : 0);
        const dbLastCheckInDate = profile.last_reward_claimed_date || profile.lastRewardClaimedDate || profile.last_check_in_date || profile.lastCheckInDate || '';
        const dbCurrentStreak = profile.current_streak_day !== undefined ? Number(profile.current_streak_day) : (profile.currentStreakDay !== undefined ? Number(profile.currentStreakDay) : (profile.current_streak !== undefined ? Number(profile.current_streak) : (profile.currentStreak !== undefined ? Number(profile.currentStreak) : 0)));
        const dbWalletAddress = profile.wallet_address || profile.walletAddress || '';

        let dbClaimedDays: number[] = [];
        try {
          dbClaimedDays = typeof profile.claimed_days === 'string' ? JSON.parse(profile.claimed_days) : (profile.claimed_days || profile.claimedDays || []);
        } catch { dbClaimedDays = []; }

        let dbClaimedMilestones: string[] = [];
        try {
          dbClaimedMilestones = typeof profile.claimed_milestones === 'string' ? JSON.parse(profile.claimed_milestones) : (profile.claimed_milestones || profile.claimedMilestones || []);
        } catch { dbClaimedMilestones = []; }

        let dbCompletedDailyTasks: string[] = [];
        try {
          dbCompletedDailyTasks = typeof profile.completed_daily_tasks === 'string' ? JSON.parse(profile.completed_daily_tasks) : (profile.completed_daily_tasks || profile.completedDailyTasks || []);
        } catch { dbCompletedDailyTasks = []; }

        let dbClaimedDailyMilestones: string[] = [];
        try {
          dbClaimedDailyMilestones = typeof profile.claimed_daily_milestones === 'string' ? JSON.parse(profile.claimed_daily_milestones) : (profile.claimed_daily_milestones || profile.claimedDailyMilestones || []);
        } catch { dbClaimedDailyMilestones = []; }

        let dbWorthCardRequests: WorthCardRequest[] = [];
        try {
          dbWorthCardRequests = typeof profile.worth_card_requests === 'string' ? JSON.parse(profile.worth_card_requests) : (profile.worth_card_requests || profile.worthCardRequests || []);
        } catch { dbWorthCardRequests = []; }

        const dbAccountCreatedAt = profile.account_created_at !== undefined ? Number(profile.account_created_at) : (profile.accountCreatedAt !== undefined ? Number(profile.accountCreatedAt) : Date.now());
        const dbLastRefuel = profile.last_refuel !== undefined ? Number(profile.last_refuel) : (profile.lastRefuel !== undefined ? Number(profile.lastRefuel) : 0);

        let dbDailyEarnedCoins = 0;
        if (profile.daily_earning_limit !== undefined && profile.daily_earning_limit !== null) {
          dbDailyEarnedCoins = Number(profile.daily_earning_limit);
        } else if (profile.daily_earned_coins !== undefined && profile.daily_earned_coins !== null) {
          dbDailyEarnedCoins = Number(profile.daily_earned_coins);
        } else if (profile.dailyEarnedCoins !== undefined && profile.dailyEarnedCoins !== null) {
          dbDailyEarnedCoins = Number(profile.dailyEarnedCoins);
        }

        // Apply all database values safely to the state variables (syncing screen values)
        setCoins(dbCoins);
        const savedStartDayDate = localStorage.getItem('coinsAtStartOfDayDate');
        const todayStrForLoad = getLocalDateString();
        if (savedStartDayDate !== todayStrForLoad) {
          setCoinsAtStartOfDay(dbCoins);
          try {
            localStorage.setItem('coinsAtStartOfDay', String(dbCoins));
            localStorage.setItem('coinsAtStartOfDayDate', todayStrForLoad);
          } catch (e) {}
        } else {
          const savedStart = localStorage.getItem('coinsAtStartOfDay');
          if (savedStart !== null) {
            setCoinsAtStartOfDay(Number(savedStart));
          } else {
            setCoinsAtStartOfDay(dbCoins);
            try {
              localStorage.setItem('coinsAtStartOfDay', String(dbCoins));
              localStorage.setItem('coinsAtStartOfDayDate', todayStrForLoad);
            } catch (e) {}
          }
        }
        setCareerTaps(dbCareerTaps);
        setMultitap(dbMultitap);
        setAutoclickLevel(dbAutoclickLevel);
        setCapacityLevel(dbCapacityLevel);
        setRegenLevel(dbRegenLevel);
        setUsername(dbUsername);
        setUserReferralCode(dbReferralCode);
        setHasAppliedRef(dbHasAppliedRef);
        setReferredBy(dbReferredBy);
        setReferredCount(dbReferredCount);

        // 30-Day Check-in Calendar: direct load from Supabase with no break-resets
        const todayStr = getLocalDateString();
        let validatedStreak = dbClaimedDays.length;
        let validatedLastCheckInDate = dbLastCheckInDate;
        let validatedClaimedDays = dbClaimedDays;

        setClaimedDays(validatedClaimedDays);
        setLastCheckInDate(validatedLastCheckInDate);
        setCurrentStreak(validatedStreak);

        setClaimedMilestones(dbClaimedMilestones);
        setCompletedDailyTasks(dbCompletedDailyTasks);
        setClaimedDailyMilestones(dbClaimedDailyMilestones);
        setWalletAddress(dbWalletAddress);
        setWorthCardRequests(dbWorthCardRequests);
        setAccountCreatedAt(dbAccountCreatedAt);
        setLastRefuelTime(dbLastRefuel);
        // Load daily earning limit, syncing database and local storage safely
        let finalDailyEarned = 0;
        
        // 1. If database value is from today, use it as base
        const dbLastEarnedDate = profile.last_earned_date || profile.lastEarnedDate || '';
        if (dbLastEarnedDate === todayStr) {
          finalDailyEarned = dbDailyEarnedCoins;
        }

        // 2. See if there is a local storage value for today, and use the maximum to prevent losing local taps
        try {
          const cleanKey = `daily_tap_limit_v2_${userId}`;
          const raw = localStorage.getItem(cleanKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.date === todayStr) {
              const localEarned = Number(parsed.earned) || 0;
              finalDailyEarned = Math.max(finalDailyEarned, localEarned);
            }
          }
        } catch (e) {}

        // Save back the combined value to local storage and apply to state
        try {
          const cleanKey = `daily_tap_limit_v2_${userId}`;
          localStorage.setItem(cleanKey, JSON.stringify({ date: todayStr, earned: finalDailyEarned }));
          localStorage.setItem('daily_tap_coins', String(finalDailyEarned));
          localStorage.setItem('daily_limit_counter', String(finalDailyEarned));
        } catch (e) {}

        setDailyEarningLimit(finalDailyEarned);
        setEnergy(500 + (dbCapacityLevel - 1) * 150);

        lastLoadedUserIdRef.current = userId;
        setIsProfileLoaded(true);
        triggerToast("Wolf profile synchronized! 🐺☁️");
        return true;
      } else {
        // Profile doesn't exist. Create a new one cleanly
        const userEmailPrefix = userEmail.split('@')[0] || 'Slayer';
        resetGameState(userEmailPrefix, true);

        const nextRefCode = `WOLF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        setUserReferralCode(nextRefCode);

        const newProfile = {
          id: userId,
          coins: hasAppliedRef ? 1000 : 0,
          career_taps: 0,
          multitap: 1,
          autoclick_level: 0,
          capacity_level: 1,
          regen_level: 1,
          username: userEmailPrefix,
          user_referral_code: nextRefCode,
          has_applied_ref: hasAppliedRef,
          referred_by: referredBy,
          referred_count: 0,
          claimed_days: JSON.stringify([]),
          last_check_in_date: '',
          current_streak: 0,
          claimed_milestones: JSON.stringify([]),
          completed_daily_tasks: JSON.stringify([]),
          claimed_daily_milestones: JSON.stringify([]),
          wallet_address: '',
          worth_card_requests: JSON.stringify([]),
          account_created_at: String(Date.now()),
          last_refuel: String(0),
          daily_earned_coins: 0,
          dailyEarnedCoins: 0,
          daily_earning_limit: 0,
          ad_progress: 0,
          adProgress: 0,
          next_ads_in: 0,
          last_earned_date: getLocalDateString(),
          lastEarnedDate: getLocalDateString(),
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) {
          console.warn("Supabase profile insert error:", insertError.message);
          
          // Minimal safe insert with standard columns that are guaranteed to exist
          const minimalProfile = {
            id: userId,
            coins: hasAppliedRef ? 1000 : 0,
            username: userEmailPrefix,
            user_referral_code: nextRefCode
          };
          
          const { error: minimalError } = await supabase
            .from('profiles')
            .insert([minimalProfile]);

          if (minimalError) {
            console.warn("Supabase minimal insert failed:", minimalError.message);
          }
        }

        // Dynamically query back the profile to discover all actual columns on the table
        const { data: refreshedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (refreshedProfile) {
          profileColumnsRef.current = Object.keys(refreshedProfile);
          
          // Safely update secondary columns that are verified to exist on this database
          const updatePayload: Record<string, any> = {};
          const allProps = { ...newProfile };
          Object.keys(allProps).forEach((key) => {
            if (profileColumnsRef.current.includes(key) && key !== 'id') {
              updatePayload[key] = (allProps as any)[key];
            }
          });
          
          if (Object.keys(updatePayload).length > 0) {
            await supabase.from('profiles').update(updatePayload).eq('id', userId);
          }
        }

        lastLoadedUserIdRef.current = userId;
        setIsProfileLoaded(true);
        triggerToast("Welcome to the Wolf Pack! Profile forged. 🐺☁️");
        return true;
      }
    } catch (err) {
      console.warn("Supabase load error:", err);
      return false;
    } finally {
      activeFetchUserIdRef.current = null;
    }
  };

  // Compatibility alias to support existing load triggers
  const loadSupabaseProfileForUser = async (userId: string, userEmail: string) => {
    return await loadData(userId, userEmail);
  };

  // UNIFIED SAVE FUNCTION FOR COINS AND DAILY EARNING LIMIT
  const saveData = async (
    currentCoins: number,
    currentDailyEarned: number
  ) => {
    if (!supabaseUser || !isProfileLoaded) return;
    try {
      const supabase = await getSupabaseClient();

      // Lazy check: if profileColumnsRef is empty, quickly fetch columns list from Supabase
      if (profileColumnsRef.current.length === 0) {
        const { data: colCheck } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        if (colCheck) {
          profileColumnsRef.current = Object.keys(colCheck);
        }
      }

      const payload: Record<string, any> = {
        coins: currentCoins,
      };

      const hasCol = (col: string) => profileColumnsRef.current.includes(col);
      
      // If we have discovered columns, only include matching ones to prevent Postgres "column does not exist" errors.
      if (profileColumnsRef.current.length > 0) {
        if (hasCol('daily_earning_limit')) payload['daily_earning_limit'] = currentDailyEarned;
        if (hasCol('daily_earned_coins')) payload['daily_earned_coins'] = currentDailyEarned;
        if (hasCol('dailyEarnedCoins')) payload['dailyEarnedCoins'] = currentDailyEarned;
        if (hasCol('last_earned_date')) payload['last_earned_date'] = getLocalDateString();
        if (hasCol('lastEarnedDate')) payload['lastEarnedDate'] = getLocalDateString();
        if (hasCol('last_sync_time')) payload['last_sync_time'] = Date.now();
      } else {
        // Fallback guess
        payload['daily_earning_limit'] = currentDailyEarned;
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', supabaseUser.id);

      if (error) {
        console.warn("saveData primary update failed, attempting alternative limit keys:", error.message);
        
        // Let's try alternate daily limit column 'daily_earned_coins'
        const altPayload: Record<string, any> = {
          coins: currentCoins,
          daily_earned_coins: currentDailyEarned
        };
        const { error: altError } = await supabase
          .from('profiles')
          .update(altPayload)
          .eq('id', supabaseUser.id);
          
        if (altError) {
          // Let's try alternate daily limit column 'dailyEarnedCoins'
          const altPayload2: Record<string, any> = {
            coins: currentCoins,
            dailyEarnedCoins: currentDailyEarned
          };
          const { error: altError2 } = await supabase
            .from('profiles')
            .update(altPayload2)
            .eq('id', supabaseUser.id);
            
          if (altError2) {
            // Ultra-fallback: just save coins!
            const finalCoinsOnlyPayload = { coins: currentCoins };
            await supabase
              .from('profiles')
              .update(finalCoinsOnlyPayload)
              .eq('id', supabaseUser.id);
          }
        }
      }
    } catch (e) {
      console.warn("saveData exception:", e);
    }
  };

  // Legacy wrapper to support secondary calls
  const saveUserData = async (
    userId: string,
    currentCoins: number,
    currentDailyEarned: number,
    _currentAdProgress: number
  ) => {
    await saveData(currentCoins, currentDailyEarned);
  };

  const getProfilePayload = (columns: string[]) => {
    const hasCol = (col: string) => columns.includes(col);
    const payload: Record<string, any> = {};

    // If columns list is empty, default to standard snake_case structure
    if (columns.length === 0) {
      return {
        coins,
        career_taps: careerTaps,
        multitap,
        autoclick_level: autoclickLevel,
        capacity_level: capacityLevel,
        regen_level: regenLevel,
        claimed_days: JSON.stringify(claimedDays),
        claimed_milestones: JSON.stringify(claimedMilestones),
        last_check_in_date: lastCheckInDate,
        last_reward_claimed_date: lastCheckInDate,
        last_claim_date: lastCheckInDate,
        lastClaimDate: lastCheckInDate,
        current_streak: currentStreak,
        current_streak_day: currentStreak,
        completed_daily_tasks: JSON.stringify(completedDailyTasks),
        claimed_daily_milestones: JSON.stringify(claimedDailyMilestones),
        worth_card_requests: JSON.stringify(worthCardRequests),
        username,
        has_applied_ref: hasAppliedRef,
        referred_by: referredBy,
        referred_count: referredCount,
        wallet_address: walletAddress,
        account_created_at: String(accountCreatedAt),
        last_refuel: String(lastRefuelTime),
        daily_earned_coins: dailyEarnedCoins,
        daily_earning_limit: dailyEarnedCoins,
        ad_progress: 0,
        next_ads_in: 0,
        last_earned_date: getLocalDateString(),
        last_sync_time: Date.now()
      };
    }

    // coins
    if (hasCol('coins')) payload['coins'] = coins;

    // career_taps / careerTaps
    if (hasCol('career_taps')) payload['career_taps'] = careerTaps;
    if (hasCol('careerTaps')) payload['careerTaps'] = careerTaps;

    // multitap
    if (hasCol('multitap')) payload['multitap'] = multitap;

    // autoclick_level / autoclickLevel
    if (hasCol('autoclick_level')) payload['autoclick_level'] = autoclickLevel;
    if (hasCol('autoclickLevel')) payload['autoclickLevel'] = autoclickLevel;

    // capacity_level / capacityLevel
    if (hasCol('capacity_level')) payload['capacity_level'] = capacityLevel;
    if (hasCol('capacityLevel')) payload['capacityLevel'] = capacityLevel;

    // regen_level / regenLevel
    if (hasCol('regen_level')) payload['regen_level'] = regenLevel;
    if (hasCol('regenLevel')) payload['regenLevel'] = regenLevel;

    // claimed_days / claimedDays
    if (hasCol('claimed_days')) payload['claimed_days'] = JSON.stringify(claimedDays);
    if (hasCol('claimedDays')) payload['claimedDays'] = claimedDays;

    // claimed_milestones / claimedMilestones
    if (hasCol('claimed_milestones')) payload['claimed_milestones'] = JSON.stringify(claimedMilestones);
    if (hasCol('claimedMilestones')) payload['claimedMilestones'] = claimedMilestones;

    // last_check_in_date / lastCheckInDate / last_reward_claimed_date / last_claim_date
    if (hasCol('last_check_in_date')) payload['last_check_in_date'] = lastCheckInDate;
    if (hasCol('lastCheckInDate')) payload['lastCheckInDate'] = lastCheckInDate;
    if (hasCol('last_reward_claimed_date')) payload['last_reward_claimed_date'] = lastCheckInDate;
    if (hasCol('lastRewardClaimedDate')) payload['lastRewardClaimedDate'] = lastCheckInDate;
    if (hasCol('last_claim_date')) payload['last_claim_date'] = lastCheckInDate;
    if (hasCol('lastClaimDate')) payload['lastClaimDate'] = lastCheckInDate;

    // current_streak / currentStreak / current_streak_day
    if (hasCol('current_streak')) payload['current_streak'] = currentStreak;
    if (hasCol('currentStreak')) payload['currentStreak'] = currentStreak;
    if (hasCol('current_streak_day')) payload['current_streak_day'] = currentStreak;
    if (hasCol('currentStreakDay')) payload['currentStreakDay'] = currentStreak;

    // completed_daily_tasks / completedDailyTasks
    if (hasCol('completed_daily_tasks')) payload['completed_daily_tasks'] = JSON.stringify(completedDailyTasks);
    if (hasCol('completedDailyTasks')) payload['completedDailyTasks'] = completedDailyTasks;

    // claimed_daily_milestones / claimedDailyMilestones
    if (hasCol('claimed_daily_milestones')) payload['claimed_daily_milestones'] = JSON.stringify(claimedDailyMilestones);
    if (hasCol('claimedDailyMilestones')) payload['claimedDailyMilestones'] = claimedDailyMilestones;

    // worth_card_requests / worthCardRequests
    if (hasCol('worth_card_requests')) payload['worth_card_requests'] = JSON.stringify(worthCardRequests);
    if (hasCol('worthCardRequests')) payload['worthCardRequests'] = worthCardRequests;

    // username
    if (hasCol('username')) payload['username'] = username;

    // has_applied_ref / hasAppliedRef
    if (hasCol('has_applied_ref')) payload['has_applied_ref'] = hasAppliedRef;
    if (hasCol('hasAppliedRef')) payload['hasAppliedRef'] = hasAppliedRef;

    // referred_by / referredBy
    if (hasCol('referred_by')) payload['referred_by'] = referredBy;
    if (hasCol('referredBy')) payload['referredBy'] = referredBy;

    // referred_count / referredCount
    if (hasCol('referred_count')) payload['referred_count'] = referredCount;
    if (hasCol('referredCount')) payload['referredCount'] = referredCount;

    // wallet_address / walletAddress
    if (hasCol('wallet_address')) payload['wallet_address'] = walletAddress;
    if (hasCol('walletAddress')) payload['walletAddress'] = walletAddress;

    // account_created_at / accountCreatedAt
    if (hasCol('account_created_at')) payload['account_created_at'] = String(accountCreatedAt);
    if (hasCol('accountCreatedAt')) payload['accountCreatedAt'] = accountCreatedAt;

    // last_refuel / lastRefuel
    if (hasCol('last_refuel')) payload['last_refuel'] = String(lastRefuelTime);
    if (hasCol('lastRefuel')) payload['lastRefuel'] = lastRefuelTime;

    // daily_earned_coins / dailyEarnedCoins / daily_earning_limit
    if (hasCol('daily_earned_coins')) payload['daily_earned_coins'] = dailyEarnedCoins;
    if (hasCol('dailyEarnedCoins')) payload['dailyEarnedCoins'] = dailyEarnedCoins;
    if (hasCol('daily_earning_limit')) payload['daily_earning_limit'] = dailyEarnedCoins;

    // ad_progress / adProgress / next_ads_in
    if (hasCol('ad_progress')) payload['ad_progress'] = 0;
    if (hasCol('adProgress')) payload['adProgress'] = 0;
    if (hasCol('next_ads_in')) payload['next_ads_in'] = 0;

    // last_earned_date / lastEarnedDate
    if (hasCol('last_earned_date')) payload['last_earned_date'] = getLocalDateString();
    if (hasCol('lastEarnedDate')) payload['lastEarnedDate'] = getLocalDateString();

    // last_sync_time / lastSyncTime
    if (hasCol('last_sync_time')) payload['last_sync_time'] = Date.now();
    if (hasCol('lastSyncTime')) payload['lastSyncTime'] = Date.now();

    return payload;
  };

  // Reset all game state variables to default values
  const resetGameState = (userEmailPrefix?: string, preserveReferral: boolean = false) => {
    const activeHasApplied = preserveReferral ? hasAppliedRef : false;
    const activeReferredBy = preserveReferral ? referredBy : '';
    const initialCoins = activeHasApplied ? 1000 : 0;

    setCoins(initialCoins);
    setCoinsAtStartOfDay(initialCoins);
    try {
      localStorage.setItem('coinsAtStartOfDay', String(initialCoins));
      localStorage.setItem('coinsAtStartOfDayDate', getLocalDateString());
    } catch {}
    setCareerTaps(0);
    setMultitap(1);
    setAutoclickLevel(0);
    setCapacityLevel(1);
    setRegenLevel(1);
    setClaimedDays([]);
    setLastCheckInDate('');
    setCurrentStreak(0);
    setClaimedMilestones([]);
    setCompletedDailyTasks([]);
    setClaimedDailyMilestones([]);
    setUsername(userEmailPrefix || 'Alpha Hunt Master');
    setHasAppliedRef(activeHasApplied);
    setReferredBy(activeReferredBy);
    setReferredCount(0);
    setInterstitialProgress(0);
    setLastKnownCoins(initialCoins);
    setDailyEarningLimit(0);
    setIsProfileLoaded(false);
    setWalletAddress('');
    setWorthCardRequests([]);
    setLastRefuelTime(0);
    setAccountCreatedAt(Date.now());
    setEnergy(500); // Default energy limit for lvl 1 capacity
    setLastAdMilestone(0);
    setIsTapLocked(false);
    try {
      localStorage.setItem('last_ad_milestone', '0');
      localStorage.setItem('is_tap_locked', 'false');
    } catch {}

    // Generate new referral code without local storage save
    const nextRefCode = `WOLF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setUserReferralCode(nextRefCode);
  };

  // Load default guest mode game state variables (all set to initial values)
  const loadGuestState = () => {
    resetGameState();
  };

  const awardBonusCoins = (amount: number) => {
    setCoins((p) => p + amount);
    setCoinsAtStartOfDay((prevStart) => {
      const nextStart = prevStart + amount;
      try {
        localStorage.setItem('coinsAtStartOfDay', String(nextStart));
      } catch (e) {}
      return nextStart;
    });
  };

  const spendCoins = (amount: number) => {
    setCoins((p) => Math.max(0, p - amount));
    setCoinsAtStartOfDay((prevStart) => {
      const nextStart = Math.max(0, prevStart - amount);
      try {
        localStorage.setItem('coinsAtStartOfDay', String(nextStart));
      } catch (e) {}
      return nextStart;
    });
  };

  // Maintain the mathematical invariant: coinsAtStartOfDay = coins - dailyLimitCounter
  // This automatically adjusts coinsAtStartOfDay whenever the user's coins change from bonus claims,
  // check-ins, ad rewards, or upgrades, so that (coins - coinsAtStartOfDay) always perfectly matches
  // the tapped-only daily limit counter. It also handles initial load and day transition resets seamlessly!
  useEffect(() => {
    if (coins > 0) {
      const expectedStart = Math.max(0, coins - dailyLimitCounter);
      if (coinsAtStartOfDay !== expectedStart) {
        setCoinsAtStartOfDay(expectedStart);
        try {
          const todayStr = getLocalDateString();
          localStorage.setItem('coinsAtStartOfDay', String(expectedStart));
          localStorage.setItem('coinsAtStartOfDayDate', todayStr);
        } catch (e) {}
      }
    }
  }, [coins, dailyLimitCounter, coinsAtStartOfDay]);

  // Save specific core variables immediately to Supabase
  const saveSupabaseDataImmediately = async (
    overrideCoins?: number,
    overrideDailyEarnedCoins?: number,
    overrideAdProgress?: number,
    overrideStreak?: { lastCheckInDate: string; currentStreak: number; claimedDays: number[] },
    overrideCompletedDailyTasks?: string[],
    overrideClaimedDailyMilestones?: string[],
    overrideClaimedMilestones?: string[],
    overrideWorthCardRequests?: WorthCardRequest[]
  ) => {
    if (!supabaseUser || !isProfileLoaded) return;
    try {
      const supabase = await getSupabaseClient();
      
      // Lazy check: if profileColumnsRef is empty, quickly fetch columns list from Supabase
      if (profileColumnsRef.current.length === 0) {
        const { data: colCheck } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        if (colCheck) {
          profileColumnsRef.current = Object.keys(colCheck);
        }
      }

      const hasCol = (col: string) => profileColumnsRef.current.includes(col);

      const currentCoins = overrideCoins !== undefined ? overrideCoins : coins;
      const currentDailyEarned = overrideDailyEarnedCoins !== undefined ? overrideDailyEarnedCoins : dailyEarnedCoins;
      
      const targetLastCheckIn = overrideStreak ? overrideStreak.lastCheckInDate : lastCheckInDate;
      const targetCurrentStreak = overrideStreak ? overrideStreak.currentStreak : currentStreak;
      const targetClaimedDays = overrideStreak ? overrideStreak.claimedDays : claimedDays;

      const targetCompletedDailyTasks = overrideCompletedDailyTasks !== undefined ? overrideCompletedDailyTasks : completedDailyTasks;
      const targetClaimedDailyMilestones = overrideClaimedDailyMilestones !== undefined ? overrideClaimedDailyMilestones : claimedDailyMilestones;
      const targetClaimedMilestones = overrideClaimedMilestones !== undefined ? overrideClaimedMilestones : claimedMilestones;
      const targetWorthCardRequests = overrideWorthCardRequests !== undefined ? overrideWorthCardRequests : worthCardRequests;

      const payload: Record<string, any> = {
        coins: currentCoins,
      };

      if (profileColumnsRef.current.length > 0) {
        if (hasCol('daily_earning_limit')) payload['daily_earning_limit'] = currentDailyEarned;
        if (hasCol('daily_earned_coins')) payload['daily_earned_coins'] = currentDailyEarned;
        if (hasCol('dailyEarnedCoins')) payload['dailyEarnedCoins'] = currentDailyEarned;
        if (hasCol('last_earned_date')) payload['last_earned_date'] = getLocalDateString();
        if (hasCol('lastEarnedDate')) payload['lastEarnedDate'] = getLocalDateString();
        if (hasCol('last_sync_time')) payload['last_sync_time'] = Date.now();
        
        // Include streak columns (both original and user requested names)
        if (hasCol('last_reward_claimed_date')) payload['last_reward_claimed_date'] = targetLastCheckIn;
        if (hasCol('lastRewardClaimedDate')) payload['lastRewardClaimedDate'] = targetLastCheckIn;
        if (hasCol('last_check_in_date')) payload['last_check_in_date'] = targetLastCheckIn;
        if (hasCol('lastCheckInDate')) payload['lastCheckInDate'] = targetLastCheckIn;
        if (hasCol('last_claim_date')) payload['last_claim_date'] = targetLastCheckIn;
        if (hasCol('lastClaimDate')) payload['lastClaimDate'] = targetLastCheckIn;
        
        if (hasCol('current_streak_day')) payload['current_streak_day'] = targetCurrentStreak;
        if (hasCol('currentStreakDay')) payload['currentStreakDay'] = targetCurrentStreak;
        if (hasCol('current_streak')) payload['current_streak'] = targetCurrentStreak;
        if (hasCol('currentStreak')) payload['currentStreak'] = targetCurrentStreak;
        
        if (hasCol('claimed_days')) payload['claimed_days'] = JSON.stringify(targetClaimedDays);
        if (hasCol('claimedDays')) payload['claimedDays'] = targetClaimedDays;

        // Additional lists
        if (hasCol('completed_daily_tasks')) payload['completed_daily_tasks'] = JSON.stringify(targetCompletedDailyTasks);
        if (hasCol('completedDailyTasks')) payload['completedDailyTasks'] = targetCompletedDailyTasks;
        
        if (hasCol('claimed_daily_milestones')) payload['claimed_daily_milestones'] = JSON.stringify(targetClaimedDailyMilestones);
        if (hasCol('claimedDailyMilestones')) payload['claimedDailyMilestones'] = targetClaimedDailyMilestones;

        if (hasCol('claimed_milestones')) payload['claimed_milestones'] = JSON.stringify(targetClaimedMilestones);
        if (hasCol('claimedMilestones')) payload['claimedMilestones'] = targetClaimedMilestones;

        if (hasCol('worth_card_requests')) payload['worth_card_requests'] = JSON.stringify(targetWorthCardRequests);
        if (hasCol('worthCardRequests')) payload['worthCardRequests'] = targetWorthCardRequests;
      } else {
        // Fallbacks
        payload['daily_earning_limit'] = currentDailyEarned;
        payload['last_check_in_date'] = targetLastCheckIn;
        payload['last_reward_claimed_date'] = targetLastCheckIn;
        payload['last_claim_date'] = targetLastCheckIn;
        payload['current_streak'] = targetCurrentStreak;
        payload['current_streak_day'] = targetCurrentStreak;
        payload['claimed_days'] = JSON.stringify(targetClaimedDays);
        payload['completed_daily_tasks'] = JSON.stringify(targetCompletedDailyTasks);
        payload['claimed_daily_milestones'] = JSON.stringify(targetClaimedDailyMilestones);
        payload['claimed_milestones'] = JSON.stringify(targetClaimedMilestones);
        payload['worth_card_requests'] = JSON.stringify(targetWorthCardRequests);
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', supabaseUser.id);

      if (error) {
        console.warn("saveSupabaseDataImmediately primary update failed:", error.message);
      }
    } catch (e) {
      console.warn("saveSupabaseDataImmediately exception:", e);
    }
  };

  // Sync state parameters to Supabase profiles table (Debounced write)
  useEffect(() => {
    if (!supabaseUser || !pendingSync || !isProfileLoaded) return;

    const syncTimer = setTimeout(async () => {
      try {
        const supabase = await getSupabaseClient();
        
        const updateData = getProfilePayload(profileColumnsRef.current);

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', supabaseUser.id);
        
        if (error) {
          console.warn("Supabase profile update warning:", error.message);
        } else {
          setPendingSync(false);
        }
      } catch (e) {
        console.warn("Supabase sync exception:", e);
      }
    }, 2500);

    return () => clearTimeout(syncTimer);
  }, [coins, careerTaps, multitap, autoclickLevel, capacityLevel, regenLevel, claimedDays, claimedMilestones, supabaseUser, pendingSync, username, hasAppliedRef, referredBy, referredCount, lastCheckInDate, currentStreak, completedDailyTasks, claimedDailyMilestones, worthCardRequests, accountCreatedAt, walletAddress, lastRefuelTime, dailyEarnedCoins]);

  // Load profile from Supabase profiles table when logged in with a user
  useEffect(() => {
    if (supabaseUser) {
      if (lastLoadedUserIdRef.current !== supabaseUser.id) {
        lastLoadedUserIdRef.current = supabaseUser.id;
        loadSupabaseProfileForUser(supabaseUser.id, supabaseUser.email || '');
      }
    } else {
      // User is logged out
      if (lastLoadedUserIdRef.current !== null) {
        lastLoadedUserIdRef.current = null;
        triggerToast("Slayer session closed.");
      }
    }
  }, [supabaseUser]);

  // Ensure accountCreatedAt is initialized when user logs in or joins as demo/guest
  useEffect(() => {
    if (accountCreatedAt === 0) {
      let resolvedTime = 0;
      if (isDemoUser) {
        resolvedTime = Date.now();
      } else if (fbUser) {
        resolvedTime = fbUser.metadata?.creationTime ? Date.parse(fbUser.metadata.creationTime) : Date.now();
      } else if (supabaseUser) {
        resolvedTime = supabaseUser.created_at ? Date.parse(supabaseUser.created_at) : Date.now();
      }
      
      if (resolvedTime > 0) {
        setAccountCreatedAt(resolvedTime);
      }
    }
  }, [isDemoUser, fbUser, supabaseUser, accountCreatedAt]);

  // Firebase auth sync triggers
  const triggerGoogleLogin = async () => {
    if (!fbConfig || !isValidFirebaseConfig(fbConfig) || !fbAuth) {
      triggerToast("Mock sync activated without Firebase.");
      setFbUser({
        uid: "guest-pack-master",
        displayName: "Guest Wolf Raider",
        email: "guest@alphapack.net",
        photoURL: ""
      } as any);
      return;
    }

    try {
      await loginWithGoogle(fbAuth);
      triggerToast("Welcome back, Hunter!");
    } catch (e: any) {
      triggerToast(e?.message || "Google Login failed");
    }
  };

  const triggerGoogleLogout = async () => {
    setIsDemoUser(false);
    setSupabaseUser(null);
    
    // Clean up memory state - instantly resets all screen variables (coins = 0, daily earning = 0, ad progress = 0, etc.)
    resetGameState();

    try {
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
      triggerToast("Slayer signed out successfully.");
    } catch (e) {
      console.warn("Supabase logout deferral:", e);
      triggerToast("Signed out from session.");
    }
  };

  // Calculate remaining days for Withdrawal Lock (50-day dynamic countdown)
  const getRemainingDays = (): number => {
    const startTimestamp = accountCreatedAt || Date.now();
    const unlockPeriodMs = 50 * 24 * 60 * 60 * 1000; // 50 days
    const elapsed = Date.now() - startTimestamp;
    const remainingMs = unlockPeriodMs - elapsed;
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  };

   // tap coin action trigger
  const handleTap = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // 1. DAILY LIMIT STACK CHECK:
    if (dailyTapCount >= 10000) {
      setShowDailyLimitModal(true);
      return;
    }

    if (showAdGatePopup || dailyTapCount >= 10000) {
      if (dailyTapCount >= 10000 && !showDailyLimitModal) {
        setShowDailyLimitModal(true);
        audioEngine.playError();
      }
      return;
    }

    if (isTapLocked || coins >= lastAdMilestone + 500) {
      setIsTapLocked(true);
      setShowAdGatePopup(true);
      audioEngine.playError();
      triggerToast("📺 Please watch the sponsor ad to unlock tapping!");
      return;
    }

    if (!isProfileLoaded && supabaseUser) {
      console.log("Tap blocked: profile still loading...");
      return;
    }
    const nowTap = Date.now();
    // Guard against double fires within an extremely brief timeframe (hybrid duplicate events)
    if (nowTap - lastTapProcessedRef.current < 65) {
      return;
    }
    lastTapProcessedRef.current = nowTap;

    if (energy < multitap) {
      audioEngine.playError();
      triggerToast("⚡ Energy empty! Please wait for energy to regenerate naturally.");
      return;
    }

    audioEngine.init();

    // Combo logic calculations
    const elapsed = nowTap - lastTapTimeRef.current;
    let nextCombo = 1;
    if (elapsed < 1100 && lastTapTimeRef.current > 0) {
      nextCombo = combo + 1;
    }
    setCombo(nextCombo);
    lastTapTimeRef.current = nowTap;

    // Dynamic pitch tape sound emission
    audioEngine.playTap(nextCombo);

    // Multiplier streak bonus overclock
    const isOverdrive = nextCombo >= 10;
    const clickBonus = isOverdrive ? (Math.floor(multitap * 0.25) || 1) : 0;
    let finalAmount = multitap + clickBonus;

    if (dailyTapCount + finalAmount > 10000) {
      finalAmount = 10000 - dailyTapCount;
    }

    if (finalAmount <= 0) {
      audioEngine.playError();
      setShowDailyLimitModal(true);
      triggerToast("🚫 Aaj ki limit khatam! Kal 12:00 AM ke baad fir se khele.");
      return;
    }

    const nextCoins = coins + finalAmount;
    const nextDaily = Math.min(10000, dailyTapCount + finalAmount);
    const nextCareer = careerTaps + finalAmount;

    setEnergy((p) => Math.max(0, p - multitap));
    setCoins(nextCoins);
    setDailyTapCount(nextDaily);
    setCareerTaps(nextCareer);
    setPendingSync(true);

    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins, nextDaily, 0);
    }

    if (nextDaily >= 10000) {
      setShowDailyLimitModal(true);
      triggerToast("🚫 Aaj ki limit khatam! Kal 12:00 AM ke baad fir se khele.");
    } else if (nextCoins >= lastAdMilestone + 500) {
      setIsTapLocked(true);
      setShowAdGatePopup(true);
      triggerToast("📺 Please watch the sponsor ad to unlock tapping!");
    }
    // Tap locations relative coordinates detection with ultra-robust try-catch fallback
    let startX = 50;
    let startY = 45;
    try {
      const b = e.currentTarget.getBoundingClientRect();
      const anyEvent = e as any;
      if (anyEvent && anyEvent.clientX !== undefined && typeof anyEvent.clientX === 'number') {
        startX = ((anyEvent.clientX - b.left) / b.width) * 100;
        startY = ((anyEvent.clientY - b.top) / b.height) * 100;
      } else if (anyEvent && anyEvent.touches && anyEvent.touches[0] !== undefined) {
        const touch = anyEvent.touches[0];
        startX = ((touch.clientX - b.left) / b.width) * 100;
        startY = ((touch.clientY - b.top) / b.height) * 100;
      }
    } catch {
      startX = 50;
      startY = 45;
    }

    // Optimized parallax/tilt effects to prevent heavy mobile lags
    const isTouchEvent = e.type.startsWith('touch') || ('touches' in e && e.touches && e.touches.length > 0);
    if (!isTouchEvent) {
      const dX = startX - 50;
      const dY = startY - 50;
      const tiltImpulseX = -(dY / 50) * 12;
      const tiltImpulseY = (dX / 50) * 12;

      setTilt({ x: tiltImpulseX, y: tiltImpulseY, scale: 0.94 });
      setTimeout(() => {
        setTilt((prev) => ({
          x: prev.x * 0.1,
          y: prev.y * 0.1,
          scale: 1.01
        }));
      }, 120);
    } else {
      // Touch screens bypass heavy 3D parallax transformations, using hardware-accelerated scale bounce
      setTilt({ x: 0, y: 0, scale: 0.94 });
      setTimeout(() => {
        setTilt({ x: 0, y: 0, scale: 1.01 });
      }, 120);
    }

    const newParticles: TapParticle[] = [];

    // Spawning indicator float text
    newParticles.push({
      id: ++nextUniqueParticleId,
      startX,
      startY,
      offsetX: Math.random() * 40 - 20,
      rotationDirection: Math.random() > 0.5 ? 1 : -1,
      value: `+${finalAmount} Coins`,
      type: 'text'
    });

    // Spawning physical visual coins pop
    const count = isOverdrive ? 3 : 1;
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: ++nextUniqueParticleId,
        startX,
        startY,
        offsetX: Math.random() * 80 - 45,
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
        value: '',
        type: 'coin'
      });
    }

    setParticles((p) => [...p, ...newParticles].slice(-25));
  };

  // Refuel boosters reactor triggers
  const triggerRefuelBooster = () => {
    const now = Date.now();
    if (now - lastRefuelTime < 30000) {
      audioEngine.playError();
      triggerToast(`Recharger core is hot! Standby cooling down.`);
      return;
    }

    setEnergy(maxEnergy);
    setLastRefuelTime(now);
    audioEngine.playReward();
    triggerToast("Capacitors fully charged! Reactor synchronized.");
  };

  // Upgrades Pricing Formulas
  const getMultitapCost = () => multitap * 220 + 80;
  const getAutoclickCost = () => (autoclickLevel + 1) * 450 + 150;
  const getCapacityCost = () => capacityLevel * 300 + 200;
  const getRegenCost = () => regenLevel * 350 + 250;

  // Upgrade Purchase Action Deck
  const buyMultitap = () => {
    const cost = getMultitapCost();
    if (coins < cost) {
      audioEngine.playError();
      triggerToast("Not enough coin resources.");
      return;
    }
    const nextCoins = coins - cost;
    spendCoins(cost);
    setMultitap((p) => p + 1);
    setPendingSync(true);
    audioEngine.playReward();
    triggerToast(`Upgraded Multitap to Level ${multitap + 1}!`);
    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins);
    }
  };

  const buyAutoclicker = () => {
    if (autoclickLevel >= 8) {
      audioEngine.playError();
      triggerToast("Autoclicker is already at the maximum level (8).");
      return;
    }
    const cost = getAutoclickCost();
    if (coins < cost) {
      audioEngine.playError();
      triggerToast("Not enough coin resources.");
      return;
    }
    const nextCoins = coins - cost;
    spendCoins(cost);
    setAutoclickLevel((p) => p + 1);
    setPendingSync(true);
    audioEngine.playReward();
    triggerToast(`Deploying AI Drone Level ${autoclickLevel + 1}!`);
    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins);
    }
  };

  const buyCapacityBoost = () => {
    const cost = getCapacityCost();
    if (coins < cost) {
      audioEngine.playError();
      triggerToast("Not enough coin resources.");
      return;
    }
    const nextCoins = coins - cost;
    spendCoins(cost);
    setCapacityLevel((p) => p + 1);
    setPendingSync(true);
    audioEngine.playReward();
    triggerToast(`Reactor storing expanded up to ${maxEnergy + 150}!`);
    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins);
    }
  };

  const buyRegenBoost = () => {
    const cost = getRegenCost();
    if (coins < cost) {
      audioEngine.playError();
      triggerToast("Not enough coin resources.");
      return;
    }
    const nextCoins = coins - cost;
    spendCoins(cost);
    setRegenLevel((p) => p + 1);
    setPendingSync(true);
    audioEngine.playReward();
    triggerToast(`Synthesis rate heightened!`);
    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins);
    }
  };

  // Daily Checkin rewards formulas
  const getDailyGiftForDay = (dayNum: number) => {
    if (dayNum === 30) return 2000;
    if (dayNum === 7 || dayNum === 14 || dayNum === 21) return 500;
    return 100;
  };

  const handleClaimDailyGift = (idx: number) => {
    if (claimedDays.includes(idx)) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Day bonus already claimed!");
      return;
    }

    const todayStr = getLocalDateString();
    if (lastCheckInDate === todayStr) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("⚠️ You have already claimed today's reward! Come back tomorrow.");
      return;
    }

    const nextExpected = claimedDays.length + 1;
    if (idx !== nextExpected) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast(`Claim Day ${nextExpected} next!`);
      return;
    }

    // Opens consent dialog instead of auto-triggering the ad
    setConfirmModalDay(idx);
    setShowDailyCheckInConfirmModal(true);
    try {
      audioEngine.playTap(1);
    } catch (e) {}
  };

  // Milestone triggers checkers
  const isMilestoneEligible = (m: Milestone) => {
    if (claimedMilestones.includes(m.id)) return false;
    if (m.type === 'taps') return careerTaps >= m.requirement;
    if (m.type === 'coins') return coins >= m.requirement;
    return false;
  };

  const handleClaimMilestone = (m: Milestone) => {
    if (!isMilestoneEligible(m)) return;

    awardBonusCoins(m.reward);
    setClaimedMilestones((p) => [...p, m.id]);
    setPendingSync(true);
    audioEngine.playReward();
    triggerToast(`Unlocked ${m.name}! Received +${m.reward} bonus!`);
  };

  const handleClaimDailyMilestone = (milestoneId: string, rewardCoins: number) => {
    if (claimedDailyMilestones.includes(milestoneId)) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Milestone bonus already claimed!");
      return;
    }
    if (completedDailyTasks.length < 3) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Complete all 3 Ad Tasks above first!");
      return;
    }
    
    let requirement = 3000;
    if (milestoneId === 'daily_milestone_2') requirement = 7000;
    if (milestoneId === 'daily_milestone_3') requirement = 10000;
    
    if (dailyEarnedCoins < requirement) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Requirement not met yet!");
      return;
    }
    
    const nextCoins = coins + rewardCoins;
    awardBonusCoins(rewardCoins);
    const nextClaimedDailyMilestones = [...claimedDailyMilestones, milestoneId];
    setClaimedDailyMilestones(nextClaimedDailyMilestones);
    setPendingSync(true);
    try {
      audioEngine.playReward();
    } catch (e) {}
    triggerToast(`🎉 Gained +${rewardCoins} coins bonus!`);
    if (supabaseUser) {
      saveSupabaseDataImmediately(nextCoins, undefined, undefined, undefined, undefined, nextClaimedDailyMilestones);
    }
  };

  const onSubmitWorthCard = async (cardId: string, handle: string) => {
    const worthCards = [
      { id: 'card_500', name: 'Worth 500 Card', value: 500, cost: 1000000, label: '10 Lakh' },
      { id: 'card_600', name: 'Worth 600 Card', value: 600, cost: 1200000, label: '12 Lakh' },
      { id: 'card_700', name: 'Worth 700 Card', value: 700, cost: 1400000, label: '14 Lakh' },
      { id: 'card_800', name: 'Worth 800 Card', value: 800, cost: 1600000, label: '16 Lakh' },
      { id: 'card_900', name: 'Worth 900 Card', value: 900, cost: 1800000, label: '18 Lakh' },
      { id: 'card_1000', name: 'Worth 1000 Card', value: 1000, cost: 2000000, label: '20 Lakh' },
    ];
    const selectedCard = worthCards.find(c => c.id === cardId);
    if (!selectedCard) return;

    if (coins < selectedCard.cost) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast(`Insufficient balance! Need ${selectedCard.cost.toLocaleString()} coins.`);
      return;
    }

    setIsDispatching(true);
    
    // Simulate dynamic route clearance / ledger dispatch check
    setTimeout(async () => {
      const newRequest: WorthCardRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: fbUser?.uid || 'guest_user',
        username: username || 'Guest Wolf',
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        value: selectedCard.value,
        cost: selectedCard.cost,
        handle: handle,
        status: 'Processing',
        timestamp: Date.now()
      };

      // 1. Update Local Coins and Requests State
      const nextCoins = coins - selectedCard.cost;
      spendCoins(selectedCard.cost);
      const nextRequests = [...worthCardRequests, newRequest];
      setWorthCardRequests(nextRequests);
      setPendingSync(true);
      if (supabaseUser) {
        saveSupabaseDataImmediately(nextCoins, undefined, undefined, undefined, undefined, undefined, undefined, nextRequests);
      }

      // 2. Also try saving directly to a shared Firebase collection if connected
      if (fbUser && fbAuth && fbConfig) {
        try {
          const { db } = getFirebase(fbConfig);
          const reqRef = doc(db, "worth_card_requests", newRequest.id);
          await setDoc(reqRef, newRequest);
        } catch (err) {
          console.warn("Direct requests collection sync ignored:", err);
        }
      }

      setIsDispatching(false);
      try { audioEngine.playReward(); } catch (e) {}
      triggerToast(`🎉 Worth Card Request dispatched successfully!`);
    }, 1500);
  };

  const handleApproveRequest = async (requestId: string) => {
    // 1. Update local state
    setWorthCardRequests(prev => {
      const next = prev.map(r => r.id === requestId ? { ...r, status: 'Dispatched' as const } : r);
      return next;
    });

    // Update the local in-memory list of admin requests too so it updates instantly
    setAllAdminRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Dispatched' as const } : r));

    // 2. If Firebase Firestore is active, update Firestore document as well!
    if (fbUser && fbAuth && fbConfig) {
      try {
        const { db } = getFirebase(fbConfig);
        const reqRef = doc(db, "worth_card_requests", requestId);
        await setDoc(reqRef, { status: "Dispatched" }, { merge: true });
        
        // Let's also sync the user profile's card requests if stored there
        const userRef = doc(db, "users_tapcoins", fbUser.uid);
        const colSnap = await getDoc(userRef);
        if (colSnap.exists()) {
          const svr = colSnap.data();
          if (svr.worthCardRequests) {
            const updatedRequests = svr.worthCardRequests.map((r: any) => 
              r.id === requestId ? { ...r, status: 'Dispatched' } : r
            );
            await setDoc(userRef, { worthCardRequests: updatedRequests }, { merge: true });
          }
        }
      } catch (err) {
        console.warn("Admin Firestore approval write failed:", err);
      }
    }
    setPendingSync(true);
    try {
      audioEngine.playReward();
    } catch (e) {}
    triggerToast(`🎉 Request Approved & Marked Dispatched!`);
  };

  const fetchAdminRequests = async () => {
    setIsLoadingAdminRequests(true);
    let loadedRequests: WorthCardRequest[] = [];

    // First start with our own local storage requests as a baseline / offline fallback
    loadedRequests = [...worthCardRequests];

    if (fbUser && fbAuth && fbConfig) {
      try {
        const { db } = getFirebase(fbConfig);
        const { collection, getDocs } = await import('firebase/firestore');
        const querySnapshot = await getDocs(collection(db, "worth_card_requests"));
        const fbRequests: WorthCardRequest[] = [];
        querySnapshot.forEach((docSnap) => {
          fbRequests.push(docSnap.data() as WorthCardRequest);
        });
        if (fbRequests.length > 0) {
          // Merge / replace with Firestore items (using ID as unique key)
          const map = new Map<string, WorthCardRequest>();
          // Add local baseline
          loadedRequests.forEach(r => map.set(r.id, r));
          // Overwrite with Firestore state
          fbRequests.forEach(r => map.set(r.id, r));
          loadedRequests = Array.from(map.values());
        }
      } catch (err) {
        console.warn("Failed to fetch global requests from firestore:", err);
      }
    }

    // Sort requests by timestamp descending
    loadedRequests.sort((a, b) => b.timestamp - a.timestamp);
    setAllAdminRequests(loadedRequests);
    setIsLoadingAdminRequests(false);
  };

  // Auto fetch when Admin Console is open
  useEffect(() => {
    if (showAdminDashboard) {
      fetchAdminRequests();
    }
  }, [showAdminDashboard]);

  // 3D Parallax distortion tracking calculations
  const handleMouseMove3D = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = -(y / (rect.height / 2)) * 12;
    const rotY = (x / (rect.width / 2)) * 12;
    setTilt({ x: rotX, y: rotY, scale: 1.02 });
  };

  const handleMouseLeave3D = () => {
    setTilt({ x: 0, y: 0, scale: 1 });
  };

  // Ad completed and reward claim transaction
  const claimAdReward = async () => {
    if (adRewardType === 'daily_check_in') {
      const nextCount = adsWatchedCount + 1;
      setAdsWatchedCount(nextCount);
      
      if (nextCount < adsRequiredCount) {
        // We need another ad (back-to-back)!
        triggerToast(`📺 Ad 1/${adsRequiredCount} completed! Loading second ad...`);
        // Immediately trigger the next ad
        setAdTimer(5);
        setIsWatchingAd(true);
        try {
          audioEngine.playTap(1);
        } catch (e) {}
        return;
      }
      
      // All required ads are completely watched successfully!
      setIsWatchingAd(false);
      const prize = getDailyGiftForDay(checkInTargetDay);
      const nextCoins = coins + prize;
      const newClaimedDays = checkInTargetDay === 30 ? [] : [...claimedDays, checkInTargetDay];
      const nextStreak = checkInTargetDay === 30 ? 0 : checkInTargetDay;
      const todayStr = getLocalDateString();

      if (supabaseUser) {
        triggerToast("⏳ Securing check-in claim to Supabase...");
        try {
          const supabase = await getSupabaseClient();
          const payload: Record<string, any> = {
            coins: nextCoins
          };

          const hasCol = (col: string) => profileColumnsRef.current.includes(col);
          
          if (hasCol('last_claim_date')) payload['last_claim_date'] = todayStr;
          if (hasCol('lastClaimDate')) payload['lastClaimDate'] = todayStr;
          
          if (hasCol('last_reward_claimed_date')) payload['last_reward_claimed_date'] = todayStr;
          if (hasCol('lastRewardClaimedDate')) payload['lastRewardClaimedDate'] = todayStr;
          if (hasCol('last_check_in_date')) payload['last_check_in_date'] = todayStr;
          if (hasCol('lastCheckInDate')) payload['lastCheckInDate'] = todayStr;
          
          if (hasCol('current_streak_day')) payload['current_streak_day'] = nextStreak;
          if (hasCol('currentStreakDay')) payload['currentStreakDay'] = nextStreak;
          if (hasCol('current_streak')) payload['current_streak'] = nextStreak;
          if (hasCol('currentStreak')) payload['currentStreak'] = nextStreak;
          
          if (hasCol('claimed_days')) payload['claimed_days'] = JSON.stringify(newClaimedDays);
          if (hasCol('claimedDays')) payload['claimedDays'] = newClaimedDays;

          // Double check other lists are persisted correctly
          if (hasCol('completed_daily_tasks')) payload['completed_daily_tasks'] = JSON.stringify(completedDailyTasks);
          if (hasCol('claimed_daily_milestones')) payload['claimed_daily_milestones'] = JSON.stringify(claimedDailyMilestones);
          if (hasCol('claimed_milestones')) payload['claimed_milestones'] = JSON.stringify(claimedMilestones);
          if (hasCol('worth_card_requests')) payload['worth_card_requests'] = JSON.stringify(worthCardRequests);

          const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', supabaseUser.id);

          if (error) {
            console.error("Supabase claim save failed:", error.message);
            triggerToast("❌ Database write failed! Reward was not claimed.");
            return;
          }

          // SUCCESS - Update state variables now!
          setCoins(nextCoins);
          setClaimedDays(newClaimedDays);
          setLastCheckInDate(todayStr);
          setCurrentStreak(nextStreak);
          
          try {
            localStorage.setItem('coinsAtStartOfDayDate', todayStr);
            localStorage.setItem('coinsAtStartOfDay', String(nextCoins));
            setCoinsAtStartOfDay(nextCoins);
          } catch (e) {}

          setPendingSync(false);
          setShowRewardModal(true);
          try {
            audioEngine.playReward();
          } catch (e) {}
          triggerToast(`🎉 +${prize} coins! Day ${checkInTargetDay} secured on database.`);
        } catch (dbError: any) {
          console.error("Database connection error during claim:", dbError);
          triggerToast("❌ Database connection error. Reward was not claimed!");
          return;
        }
      } else {
        // Guest mode fallback
        setCoins(nextCoins);
        setClaimedDays(newClaimedDays);
        setLastCheckInDate(todayStr);
        setCurrentStreak(nextStreak);
        
        try {
          localStorage.setItem('coinsAtStartOfDayDate', todayStr);
          localStorage.setItem('coinsAtStartOfDay', String(nextCoins));
          setCoinsAtStartOfDay(nextCoins);
        } catch (e) {}

        setShowRewardModal(true);
        try {
          audioEngine.playReward();
        } catch (e) {}
        triggerToast(`🎉 +${prize} coins! (Guest Mode) Day ${checkInTargetDay} claimed.`);
      }
      return;
    }

    if (adRewardType === 'daily_task') {
      setIsWatchingAd(false);
      if (activeDailyTaskId) {
        const nextCoins = coins + 100;
        awardBonusCoins(100);
        const nextCompletedTasks = [...completedDailyTasks, activeDailyTaskId];
        setCompletedDailyTasks(nextCompletedTasks);
        setPendingSync(true);
        setShowRewardModal(true);
        try {
          audioEngine.playReward();
        } catch (e) {}
        
        let label = "Daily Task 1";
        if (activeDailyTaskId === "task2") label = "Daily Task 2";
        if (activeDailyTaskId === "task3") label = "Daily Task 3";
        triggerToast(`🎉 ${label} completed! Earned +100 coins.`);
        if (supabaseUser) {
          saveSupabaseDataImmediately(nextCoins, undefined, undefined, undefined, nextCompletedTasks);
        }
      }
      return;
    }

    if (adRewardType === 'interstitial_milestone') {
      setIsWatchingAd(false);
      const nextMilestone = Math.floor(coins / 500) * 500;
      setLastAdMilestone(nextMilestone);
      setIsTapLocked(false);
      try {
        localStorage.setItem('last_ad_milestone', String(nextMilestone));
      } catch (e) {}
      setShowAdGatePopup(false);
      triggerToast("🔓 Tapping unlocked! Keep earning coins.");
      setPendingSync(true);
      setShowRewardModal(true);
      try {
        audioEngine.playReward();
      } catch (e) {}
      return;
    }

    // Normal ad rewards
    setIsWatchingAd(false);
    if (adRewardType === 'energy_refill') {
      setEnergy(maxEnergy);
    } else {
      if (supabaseUser) {
        saveSupabaseDataImmediately(coins, dailyEarnedCoins, 0);
      }
    }
    setPendingSync(true);
    setShowRewardModal(true);
    try {
      audioEngine.playReward();
    } catch (e) {}
  };

  const triggerActionAdRefill = () => {
    setAdRewardType('energy_refill');
    setAdTimer(5);
    setIsWatchingAd(true);
    triggerToast("⚡ Buffering energy refill ad stream...");
  };

  const triggerAdGateWatch = () => {
    setAdRewardType('interstitial_milestone');
    setAdTimer(5);
    setIsWatchingAd(true);
    setShowAdGatePopup(false);
  };

  return (
    <div className="h-screen w-screen bg-[#020202] text-zinc-150 flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-sans antialiased selection:bg-yellow-500 selection:text-black">
      
      {/* Background radial gold glow halo mesh */}
      <div className="absolute top-[-25%] left-[-20%] w-[80%] h-[80%] bg-radial-gradient from-yellow-500/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[80%] h-[80%] bg-radial-gradient from-yellow-500/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

      {/* --- SPLASH SCREEN LOADING BROADCAST --- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#020202] z-[99] flex flex-col items-center justify-center p-6 select-none"
          >
            {/* Pulsing launcher core visual */}
            <motion.div 
              animate={{ 
                scale: [1, 1.08, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2.2,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="w-28 h-28 rounded-full border-2 border-yellow-500/55 p-1 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.22)] mb-8"
            >
              <img 
                src={wolfFaceImg} 
                alt="Sacred launcher avatar" 
                className="w-full h-full object-cover rounded-full filter brightness-95"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-extrabold tracking-tight text-white font-display"
            >
              TAPCOIN <span className="text-yellow-500">EARNER</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xs font-mono tracking-[0.4em] mt-3.5 text-yellow-500 uppercase font-black"
            >
              CLIENT INTERFACE INITIALIZING
            </motion.p>

            <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden mt-8 border border-neutral-805">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HUD SYSTEM TOASTS --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 px-4.5 py-3 bg-yellow-500 text-neutral-950 rounded-xl font-black text-xs select-none shadow-[0_15px_40px_rgba(245,158,11,0.35)] border border-yellow-300 font-sans tracking-wide"
          >
            <Sparkles size={13} className="shrink-0 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN LOGIN OR GAME CHASSIS BOX --- */}
      {!showSplash && !supabaseUser && !isDemoUser ? (
        <LoginScreen
          onDemoLogin={() => setIsDemoUser(true)}
          triggerToast={triggerToast}
          supabaseError={supabaseError}
          hasAppliedRef={hasAppliedRef}
          setHasAppliedRef={setHasAppliedRef}
          referredBy={referredBy}
          setReferredBy={setReferredBy}
          setCoins={setCoins}
          userReferralCode={userReferralCode}
        />
      ) : !showSplash && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] h-[100dvh] max-h-[100dvh] md:max-h-[820px] md:h-[820px] flex flex-col justify-between bg-[#020202] border-0 md:border-2 border-zinc-900 rounded-none md:rounded-[38px] p-4 md:p-5 relative z-10 hover:border-zinc-800/80 transition-all shadow-none md:shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          {/* Active Tab Deck screen containers */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden mb-3">
            {/* VIEW 1: TAP GAME CORE VIEW (Pixel-for-pixel matches reference image exactly) */}
            {activeTab === 'tap' && (
              <div className="flex-1 flex flex-col justify-between py-1 select-none animate-fadeIn">
                
                {/* 2. Large Coin Balance Display with Gold styling and glow */}
                <div className="mt-1 relative select-all flex flex-col items-center">
                  <div className="w-full max-w-[340px] md:max-w-[400px] bg-black/90 border-[1.5px] border-[#FFD700] rounded-full py-2 px-6 flex items-center justify-center gap-3 shadow-[0_0_12px_rgba(255,215,0,0.2)] relative overflow-hidden">
                    
                    {/* Golden Coin Icon Columns Temple Emblem */}
                    <div className="shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-[36px] h-[36px] select-none" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.35))' }}>
                        <circle cx="50" cy="50" r="44" fill="url(#coinGradDeck)" stroke="#FFD700" strokeWidth="2" />
                        <circle cx="50" cy="50" r="39" fill="none" stroke="#CA8A04" strokeWidth="1" strokeDasharray="3,3" />
                        <path d="M50 24 L26 38 L74 38 Z" fill="#FFFBEB" stroke="#EAB308" strokeWidth="0.75" strokeLinejoin="round" />
                        <rect x="28" y="38" width="44" height="4" fill="#FFF699" />
                        <rect x="33" y="44" width="4" height="20" fill="#FFFBEB" />
                        <rect x="42" y="44" width="4" height="20" fill="#FFFBEB" />
                        <rect x="54" y="44" width="4" height="20" fill="#FFFBEB" />
                        <rect x="63" y="44" width="4" height="20" fill="#FFFBEB" />
                        <rect x="26" y="64" width="48" height="5" fill="#FFF699" />
                        <rect x="22" y="69" width="56" height="4" fill="#CA8A04" />
                        <defs>
                          <linearGradient id="coinGradDeck" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFBEB" />
                            <stop offset="35%" stopColor="#FFF27F" />
                            <stop offset="70%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Styled coins total display */}
                    <div className="font-sans font-bold text-[30px] md:text-[35px] text-[#FFD700] tracking-tight leading-none select-all">
                      {coins.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 2.5 Elegant Daily Limit Indicator Box */}
                <div id="daily-limit-box" className="mt-2.5 mb-1.5 flex items-center justify-center select-none">
                  <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2.5 shadow-sm transition-all duration-300 ${
                    dailyEarnedCoins >= 10000 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]' 
                      : dailyEarnedCoins >= 8000
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-300'
                  }`}>
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        dailyEarnedCoins >= 10000 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        dailyEarnedCoins >= 10000 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}></span>
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">
                      Today's Limit: <span className={`${dailyEarnedCoins >= 10000 ? 'text-red-500 font-black' : 'text-white font-extrabold'}`}>{dailyEarnedCoins.toLocaleString()}</span> / 10,000
                    </span>
                  </div>
                </div>

                {/* 3. Central Wolf Clicking Circle */}
                <div className="my-2 select-none flex flex-col items-center justify-center relative">
                  
                  {/* Radiating visual core ring */}
                  <div className="absolute w-[210px] h-[210px] rounded-full bg-yellow-500/5 blur-3xl opacity-20 pulse-glow pointer-events-none" />

                  {/* Main clicking trigger perfect circle */}
                  <motion.button
                    whileTap={(dailyEarnedCoins >= 10000 || isTapLocked || coins >= lastAdMilestone + 500) ? {} : { scale: 0.95 }}
                    disabled={dailyEarnedCoins >= 10000}
                    onClick={handleTap}
                    onMouseMove={(dailyEarnedCoins >= 10000 || isTapLocked || coins >= lastAdMilestone + 500) ? undefined : handleMouseMove3D}
                    onMouseLeave={(dailyEarnedCoins >= 10000 || isTapLocked || coins >= lastAdMilestone + 500) ? undefined : handleMouseLeave3D}
                    style={{
                      transform: (dailyEarnedCoins >= 10000 || isTapLocked || coins >= lastAdMilestone + 500) ? 'none' : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.scale})`,
                      transition: 'transform 0.08s cubic-bezier(0.25, 0.8, 0.25, 1)'
                    }}
                    className={`w-[210px] h-[210px] rounded-full border-[3.5px] ${
                      dailyEarnedCoins >= 10000 
                        ? 'border-zinc-700 bg-zinc-900/40 opacity-50 cursor-not-allowed shadow-none' 
                        : (isTapLocked || coins >= lastAdMilestone + 500)
                          ? 'border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.12)] bg-black/85 cursor-pointer group'
                          : 'border-[#FFD700] shadow-[0_0_35px_rgba(255,215,0,0.3)] cursor-pointer bg-black active:scale-95 group'
                    } relative overflow-hidden select-none flex items-center justify-center transition-all duration-150`}
                  >
                    <div className="w-full h-full rounded-full bg-black relative overflow-hidden flex items-center justify-center">
                      
                      {(isTapLocked || coins >= lastAdMilestone + 500) && (
                        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-4">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-1"
                          >
                            <span className="text-3xl animate-bounce">🔒</span>
                            <span className="font-display font-black text-amber-400 text-[9px] uppercase tracking-widest text-center">
                              Milestone Locked
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest text-center mt-0.5">
                              Tap to Unblock
                            </span>
                          </motion.div>
                        </div>
                      )}
                      
                      {skinMode === 'realistic' ? (
                        <div className="absolute inset-0 w-full h-full">
                          <motion.div 
                            animate={{ 
                              scale: combo >= 10 ? [1.02, 1.06, 1.02] : [1, 1.03, 1],
                              opacity: [0.9, 1, 0.9]
                            }}
                            transition={{
                              duration: combo >= 10 ? 0.8 : 3,
                              repeat: Infinity
                            }}
                            className="w-full h-full"
                          >
                            <img 
                              src={wolfFaceImg} 
                              alt="Apex Wolf core" 
                              className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </motion.div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-[105%] h-[105%] filter drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] shrink-0">
                            <g stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0.6">
                              <polygon points="50,10 32,32 50,42" />
                              <polygon points="50,10 68,32 50,42" />
                              <polygon points="32,32 20,44 38,48" />
                              <polygon points="68,32 80,44 62,48" />
                              <polygon points="38,48 50,42 62,48" />
                              <polygon points="38,48 50,75 62,48" />
                              <polygon points="20,44 14,64 38,48" />
                              <polygon points="80,44 86,64 62,48" />
                              <polygon points="38,48 30,86 50,75" />
                              <polygon points="62,48 70,86 50,75" />
                              <polygon points="30,86 50,95 50,75" />
                              <polygon points="70,86 50,95 50,75" />
                              <polygon points="20,44 30,86 14,64" />
                              <polygon points="80,44 70,86 86,64" />
                            </g>
                          </svg>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    </div>
                  </motion.button>

                  {/* Floating click particles container (Moves coins upward to collect at balance) */}
                  <div className="absolute w-[210px] h-[210px] pointer-events-none z-40 overflow-visible">
                    <AnimatePresence>
                      {particles.map((p) => {
                        const px = p.startX * 2.1;
                        const py = p.startY * 2.1;
                        
                        // Deterministic stable offset from the unique particle code to avoid re-render jumps
                        const seedValue = Math.sin(p.id);
                        const targetX = 105 + (seedValue * 15);
                        const targetY = -120 + (seedValue * 10);

                        if (p.type === 'coin') {
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 1, scale: 0.5, x: px, y: py, rotate: 0 }}
                              animate={{ 
                                opacity: [1, 1, 0.95, 0], 
                                scale: [0.5, 1.35, 0.85, 0.25], 
                                x: [px, px + (p.rotationDirection * 35), targetX], 
                                y: [py, py - 45, targetY],
                                rotate: [0, p.rotationDirection * 360, p.rotationDirection * 720]
                              }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              style={{ left: 0, top: 0 }}
                              className="absolute w-9 h-9 -ml-4.5 -mt-4.5 flex items-center justify-center overflow-visible select-none pointer-events-none"
                            >
                              <img 
                                src={goldCoinImg} 
                                alt="premium gold coin"
                                className="w-full h-full rounded-full object-cover border-[1.5px] border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.95),inset_0_0_6px_rgba(255,255,255,0.4)]"
                                referrerPolicy="no-referrer"
                              />
                            </motion.div>
                          );
                        } else if (p.type === 'sparkle') {
                          const vx = p.offsetX;
                          const vy = p.rotationDirection;
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 1, scale: 0.2, x: px, y: py }}
                              animate={{ 
                                opacity: [1, 1, 0.7, 0], 
                                scale: [0.2, 1.4, 0.9, 0],
                                x: px + vx * 2.5,
                                y: py + vy * 2.5
                              }}
                              transition={{ duration: 0.75, ease: "easeOut" }}
                              style={{ left: 0, top: 0 }}
                              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center select-none pointer-events-none z-50 overflow-visible"
                            >
                              <svg viewBox="0 0 24 24" className="w-full h-full fill-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]">
                                <path d="M12 0L14.85 9.15L24 12L14.85 14.85L12 24L9.15 14.85L0 12L9.15 9.15Z" />
                              </svg>
                            </motion.div>
                          );
                        } else {
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 1, scale: 0.9, x: px, y: py }}
                              animate={{ opacity: 0, y: py - 90, scale: 1.25 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ left: 0, top: 0 }}
                              className="absolute text-[#FFD700] font-sans font-black text-lg select-none drop-shadow-[0_2px_8px_rgba(255,215,0,0.85)] -ml-4 -mt-4"
                            >
                              {p.value}
                            </motion.div>
                          );
                        }
                      })}
                    </AnimatePresence>

                    {/* Suspected autoclicker system lock display (Removed) */}
                  </div>

                  <p className="text-center text-[13px] font-sans text-zinc-400 tracking-wide font-medium mt-3 mb-1 select-none animate-pulse">
                    Tap the wolf to earn coins!
                  </p>
                </div>

              </div>
            )}

            {/* VIEW 2: TASKS TAB */}
            {activeTab === 'tasks' && (
              <TasksTab
                claimedDays={claimedDays}
                currentStreak={currentStreak}
                lastCheckInDate={lastCheckInDate}
                getLocalDateString={getLocalDateString}
                handleClaimDailyGift={handleClaimDailyGift}
                getDailyGiftForDay={getDailyGiftForDay}
                completedDailyTasks={completedDailyTasks}
                dailyEarnedCoins={dailyEarnedCoins}
                claimedDailyMilestones={claimedDailyMilestones}
                onClaimDailyMilestone={handleClaimDailyMilestone}
                onTriggerDailyTask={(taskId, label) => {
                  setConfirmModalTaskId(taskId);
                  setConfirmModalTaskLabel(label);
                  setShowDailyTaskConfirmModal(true);
                  try {
                    audioEngine.playTap(1);
                  } catch (e) {}
                }}
              />
            )}

            {/* VIEW 3: WALLET & UPGRADES TAB */}
            {activeTab === 'wallet' && (
              <WalletTab
                coins={coins}
                worthCardRequests={worthCardRequests}
                onSubmitWorthCard={onSubmitWorthCard}
                isDispatching={isDispatching}
                triggerToast={triggerToast}
                audioEngine={audioEngine}
                isWithdrawalLocked={getRemainingDays() > 0}
                remainingWithdrawalDays={getRemainingDays()}
              />
            )}

            {/* VIEW 4: USER CONTROL PROFILE TAB */}
            {activeTab === 'profile' && (
              <ProfileTab
                careerTaps={careerTaps}
                autoclickLevel={autoclickLevel}
                multitap={multitap}
                skinMode={skinMode}
                setSkinMode={setSkinMode}
                eyeColor={eyeColor}
                setEyeColor={setEyeColor}
                fbLoading={fbLoading}
                fbUser={fbUser}
                triggerGoogleLogin={triggerGoogleLogin}
                triggerGoogleLogout={triggerGoogleLogout}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                audioEngine={audioEngine}
                coins={coins}
                setCoins={setCoins}
                username={username}
                setUsername={setUsername}
                userReferralCode={userReferralCode}
                hasAppliedRef={hasAppliedRef}
                setHasAppliedRef={setHasAppliedRef}
                referredBy={referredBy}
                setReferredBy={setReferredBy}
                referredCount={referredCount}
                setReferredCount={setReferredCount}
                triggerToast={triggerToast}
              />
            )}

          </div>

          {/* Bottom Styled horizontal 4-Tab Navigation Bar */}
          <div className="grid grid-cols-4 gap-1 bg-[#09090b] border border-zinc-900/65 p-2 rounded-[24px] select-none mt-auto shrink-0 shadow-lg relative z-[99]">
            
            {/* Tab 1: Tap Game */}
            <button
              onClick={() => {
                setActiveTab('tap');
                audioEngine.playTap(1);
              }}
              className="py-1.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            >
              <div className={`w-[54px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === 'tap' 
                  ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[inset_0_0_8px_rgba(255,215,0,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
                <Gamepad2 size={20} className="shrink-0" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider mt-1.5 transition-colors ${
                activeTab === 'tap' ? 'text-[#FFD700] font-extrabold' : 'text-zinc-500'
              }`}>
                Tap Game
              </span>
            </button>

            {/* Tab 2: Tasks */}
            <button
              onClick={() => {
                setActiveTab('tasks');
                audioEngine.playTap(1);
              }}
              className="py-1.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            >
              <div className={`w-[54px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === 'tasks' 
                  ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[inset_0_0_8px_rgba(255,215,0,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
                <List size={20} className="shrink-0" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider mt-1.5 transition-colors ${
                activeTab === 'tasks' ? 'text-[#FFD700] font-extrabold' : 'text-zinc-500'
              }`}>
                Tasks
              </span>
            </button>

            {/* Tab 3: Wallet */}
            <button
              onClick={() => {
                setActiveTab('wallet');
                audioEngine.playTap(1);
              }}
              className="py-1.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            >
              <div className={`w-[54px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === 'wallet' 
                  ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[inset_0_0_8px_rgba(255,215,0,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
                <Wallet size={20} className="shrink-0" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider mt-1.5 transition-colors ${
                activeTab === 'wallet' ? 'text-[#FFD700] font-extrabold' : 'text-zinc-500'
              }`}>
                Wallet
              </span>
            </button>

            {/* Tab 4: Profile */}
            <button
              onClick={() => {
                setActiveTab('profile');
                audioEngine.playTap(1);
              }}
              className="py-1.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            >
              <div className={`w-[54px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-[#FFD700]/10 text-[#FFD700] shadow-[inset_0_0_8px_rgba(255,215,0,0.1)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
                <User size={20} className="shrink-0" />
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider mt-1.5 transition-colors ${
                activeTab === 'profile' ? 'text-[#FFD700] font-extrabold' : 'text-zinc-500'
              }`}>
                Profile
              </span>
            </button>

          </div>

          {/* Simulated Active Ad viewing overlay stream */}
          {isWatchingAd && (
            <div id="ad-overlay" className="absolute inset-0 bg-black/98 z-[150] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <div className="relative w-22 h-22 mb-4 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-yellow-500 animate-spin [animation-duration:10s]" />
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-yellow-500/35 flex flex-col items-center justify-center z-10">
                  <span className="text-yellow-400 font-mono font-black text-2xl tracking-tighter">
                    {adTimer}s
                  </span>
                  <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 leading-none">Countdown</span>
                </div>
              </div>

              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-display select-none">
                <Sparkles className="text-yellow-400 animate-bounce animate-pulse" size={14} /> 
                {adRewardType === 'energy_refill' 
                  ? 'ENERGY RECHARGER BROADCAST' 
                  : adRewardType === 'daily_check_in'
                    ? 'STREAK CHECK-IN SPONSOR'
                    : adRewardType === 'daily_task'
                      ? 'DAILY TASK SPONSOR'
                      : adRewardType === 'interstitial_milestone'
                        ? 'MILESTONE UNLOCK SPONSOR'
                        : 'SPONSOR BROADCAST'}
              </h2>
              <p className="text-[8px] font-mono text-yellow-500 mt-1 uppercase tracking-widest font-black">
                {adRewardType === 'energy_refill' 
                  ? 'AC-DC Capacitor Auxiliary Refuel Line' 
                  : adRewardType === 'daily_check_in'
                    ? `Ad ${adsWatchedCount + 1} of ${adsRequiredCount} • Sponsor Broadcast`
                    : adRewardType === 'daily_task'
                      ? 'Watch to Earn 100 Coins • Sponsor Broadcast'
                      : adRewardType === 'interstitial_milestone'
                        ? 'Watch to Unlock Tapping • Sponsor Broadcast'
                        : 'Alpha-Network Premium Stream'}
              </p>

              {/* Sponsor simulated preview visual card */}
              <div className="w-full bg-[#09090b] border border-zinc-900 rounded-2xl p-3 my-4 flex flex-col gap-2 relative overflow-hidden shrink-0">
                <div className="w-full h-22 rounded-lg bg-zinc-950 flex flex-col items-center justify-center border border-zinc-900 overflow-hidden relative">
                  <img 
                    src={blueWolfImg} 
                    alt="Sponsor visual" 
                    className="w-full h-full object-cover filter brightness-[0.4] scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Gamepad2 className="text-yellow-400 w-9 h-9 stroke-1 animate-ping" />
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">Apex Hunt: Arena Shooter</h4>
                  <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Assemble your ultimate cyber wolf squad and dominate radioactive ruins of Sector-9!</p>
                </div>
              </div>

              {adTimer > 0 ? (
                <div className="flex flex-col gap-2 w-full select-none">
                  <div className="w-full py-2.5 bg-zinc-900/80 text-zinc-500 rounded-xl font-mono text-[9px] uppercase font-bold tracking-widest">
                    Reward unlocks in {adTimer} seconds...
                  </div>
                  <button
                    onClick={() => {
                      setIsWatchingAd(false);
                      try { audioEngine.playError(); } catch (e) {}
                      triggerToast("Reward failed! Please watch the full video to get your coins.");
                    }}
                    className="w-full py-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 font-bold text-[8.5px] uppercase tracking-widest rounded-xl border border-red-900/40 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Skip & Close Midway
                  </button>
                </div>
              ) : (
                <button
                  onClick={claimAdReward}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-300 hover:from-yellow-400 hover:to-amber-200 active:scale-[0.98] text-neutral-950 font-black text-[11px] uppercase rounded-xl border border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all cursor-pointer"
                >
                  {adRewardType === 'energy_refill' 
                    ? 'CLAIM REFILL & CONTINUE' 
                    : adRewardType === 'daily_check_in'
                      ? `CLAIM REWARD (AD ${adsWatchedCount + 1}/${adsRequiredCount})`
                      : adRewardType === 'daily_task'
                        ? 'CLAIM TASK REWARD'
                        : adRewardType === 'interstitial_milestone'
                          ? 'CLAIM UNLOCK & CONTINUE'
                          : 'UNBLOCK TAPS'}
                </button>
              )}
            </div>
          )}

          {/* Interstitial Ad view overlay */}
          {showInterstitial && (
            <div id="interstitial-overlay" className="absolute inset-0 bg-black/99 z-[85] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <div className="relative w-22 h-22 mb-4 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-amber-500 animate-spin [animation-duration:10s]" />
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-amber-500/35 flex flex-col items-center justify-center z-10">
                  <span className="text-amber-400 font-mono font-black text-2xl tracking-tighter">
                    {interstitialTimer}s
                  </span>
                  <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 leading-none">Ad Space</span>
                </div>
              </div>

              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-display select-none">
                <Sparkles className="text-amber-400 animate-bounce animate-pulse" size={14} /> 
                SPONSOR INTERSTITIAL AD
              </h2>
              <p className="text-[8px] font-mono text-amber-500 mt-1 uppercase tracking-widest font-black">
                Alpha-Network Premium Stream
              </p>

              {/* Sponsor simulated preview visual card */}
              <div className="w-full bg-[#09090b] border border-zinc-900 rounded-2xl p-3 my-4 flex flex-col gap-2 relative overflow-hidden shrink-0">
                <div className="w-full h-22 rounded-lg bg-zinc-950 flex flex-col items-center justify-center border border-zinc-900 overflow-hidden relative">
                  <img 
                    src={blueWolfImg} 
                    alt="Sponsor visual" 
                    className="w-full h-full object-cover filter brightness-[0.4] scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Gamepad2 className="text-amber-400 w-9 h-9 stroke-1 animate-ping" />
                  </div>
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">Wolf Quest: Mystic Moon</h4>
                  <p className="text-[8px] text-zinc-400 mt-0.5 leading-normal">Explore sacred lands, upgrade powerful artifacts, and unlock legendary visual wolf templates!</p>
                </div>
              </div>

              {interstitialTimer > 0 ? (
                <div className="w-full py-2.5 bg-zinc-900/80 text-zinc-500 rounded-xl font-mono text-[9px] uppercase font-bold tracking-widest leading-none font-mono">
                  Ad finishes in {interstitialTimer} seconds...
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowInterstitial(false);
                    try {
                      audioEngine.playTap(1);
                    } catch (e) {}
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 active:scale-[0.98] text-neutral-950 font-black text-[11px] uppercase rounded-xl border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                >
                  CLOSE AD & CONTINUE
                </button>
              )}
            </div>
          )}

          {/* Ad completions celebration reward modal details overlay */}
          {showRewardModal && (
            <div id="reward-modal" className="absolute inset-0 bg-black/92 z-[95] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-yellow-500/35 p-5 rounded-2xl max-w-xs flex flex-col items-center gap-3 shadow-[0_0_35px_rgba(245,158,11,0.22)] relative overflow-hidden"
              >
                <div className="w-13 h-13 rounded-full bg-yellow-500/10 border border-yellow-400/35 flex items-center justify-center mb-0.5 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-bounce">
                  <Trophy size={22} className="animate-pulse" />
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    {adRewardType === 'energy_refill' 
                      ? 'BATTERY CHARGED!' 
                      : adRewardType === 'daily_check_in'
                        ? 'DAILY GIFT CLAIMED!'
                        : adRewardType === 'daily_task'
                          ? 'TASK COMPLETED!'
                          : 'TAPS UNLOCKED!'}
                  </h3>
                  <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                    {adRewardType === 'energy_refill' 
                      ? 'Reactor Core Full Refuel' 
                      : adRewardType === 'daily_check_in'
                        ? 'Check-In Streak Advanced'
                        : adRewardType === 'daily_task'
                          ? 'Daily Reward Unlocked'
                          : 'Tapping Capacity Restored'}
                  </p>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 rounded-xl py-3 px-5 font-sans font-black text-xs text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] select-all leading-none mt-1">
                  {adRewardType === 'energy_refill' 
                    ? '100% RECHARGED' 
                    : adRewardType === 'daily_check_in'
                      ? `+${getDailyGiftForDay(checkInTargetDay)} COINS`
                      : adRewardType === 'daily_task'
                        ? '+100 COINS'
                        : '500 MORE TAPS READY'}
                </div>

                <p className="text-[8.5px] text-zinc-400 leading-normal">
                  {adRewardType === 'energy_refill' 
                    ? 'Your energy capacitor has been fully recharged back to 100%! Tap on to earn more coins.'
                    : adRewardType === 'daily_check_in'
                      ? `You successfully claimed Day ${checkInTargetDay}'s reward of ${getDailyGiftForDay(checkInTargetDay)} coins! Your active streak is now Day ${checkInTargetDay}.`
                      : adRewardType === 'daily_task'
                        ? 'You completed the daily task by watching the sponsor video. 100 coins have been added to your balance!'
                        : 'The ad sponsor limits have been reset successfully. You can now tap 500 more times!'
                  }
                </p>

                {adRewardType === 'standard' ? (
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <button
                      onClick={() => {
                        setShowRewardModal(false);
                        try {
                          audioEngine.playTap(1);
                        } catch (e) {}
                      }}
                      className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    >
                      🚀 CONTINUE TAPPING
                    </button>

                    <button
                      onClick={() => {
                        setShowRewardModal(false);
                        setAdRewardType('standard');
                        setAdTimer(5);
                        setIsWatchingAd(true);
                        try {
                          audioEngine.playTap(1);
                        } catch (e) {}
                      }}
                      className="w-full py-2 bg-[#111113] hover:bg-[#18181b] text-[#FFD700] font-black text-[9px] uppercase tracking-widest rounded-xl border border-zinc-900 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                    >
                      <span>📺 WATCH ANOTHER AD</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowRewardModal(false);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full mt-2 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md"
                  >
                    AWESOME, CONTINUE
                  </button>
                )}
              </motion.div>
            </div>
          )}

          {/* Daily Tasks Confirm Consent Dialog */}
          {showDailyTaskConfirmModal && (
            <div id="daily-task-confirm-modal" className="absolute inset-0 bg-black/95 z-[95] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-yellow-500/30 p-6 rounded-2xl max-w-xs flex flex-col items-center gap-4.5 shadow-[0_0_35px_rgba(245,158,11,0.15)] relative overflow-hidden"
              >
                <div className="w-13 h-13 rounded-full bg-yellow-500/10 border border-yellow-400/35 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <span className="text-2xl">⚡</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    {confirmModalTaskLabel}
                  </h3>
                  <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mt-1">
                    Reward: 100 Coins
                  </p>
                </div>

                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans mt-1">
                  Would you like to watch a short video to complete this task and earn 100 coins?
                </p>

                <div className="flex flex-col gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      setShowDailyTaskConfirmModal(false);
                      setAdRewardType('daily_task');
                      setActiveDailyTaskId(confirmModalTaskId);
                      setAdTimer(5);
                      setIsWatchingAd(true);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 font-black text-[9.5px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    📺 Watch Video
                  </button>

                  <button
                    onClick={() => {
                      setShowDailyTaskConfirmModal(false);
                      setConfirmModalTaskId(null);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full py-2.5 bg-[#111113] hover:bg-[#18181b] text-zinc-400 font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl border border-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancel / Not Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Daily Check-In Confirm Consent Dialog */}
          {showDailyCheckInConfirmModal && (
            <div id="daily-checkin-confirm-modal" className="absolute inset-0 bg-black/95 z-[95] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-yellow-500/30 p-6 rounded-2xl max-w-xs flex flex-col items-center gap-4.5 shadow-[0_0_35px_rgba(245,158,11,0.15)] relative overflow-hidden"
              >
                <div className="w-13 h-13 rounded-full bg-yellow-500/10 border border-yellow-400/35 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <span className="text-2xl">📅</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    Claim Your Daily Reward!
                  </h3>
                  <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest mt-1">
                    Day {confirmModalDay} • {getDailyGiftForDay(confirmModalDay)} Coins
                  </p>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1">
                  Today's Reward: <span className="text-white font-extrabold">{getDailyGiftForDay(confirmModalDay)} Coins</span>.
                  Would you like to watch a short video to claim your reward?
                  <br />
                  <span className="text-amber-500 block mt-2 text-[9px] font-mono">
                    {confirmModalDay >= 6 ? "⚠️ REQUIRES 2 ADS (BACK-TO-BACK)" : "⚡ REQUIRES 1 AD"}
                  </span>
                </p>

                <div className="flex flex-col gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      setShowDailyCheckInConfirmModal(false);
                      setAdRewardType('daily_check_in');
                      setCheckInTargetDay(confirmModalDay);
                      setAdsWatchedCount(0);
                      const reqCount = confirmModalDay >= 6 ? 2 : 1;
                      setAdsRequiredCount(reqCount);
                      
                      setAdTimer(5);
                      setIsWatchingAd(true);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 font-black text-[9.5px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    📺 Watch Ad & Claim
                  </button>

                  <button
                    onClick={() => {
                      setShowDailyCheckInConfirmModal(false);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full py-2.5 bg-[#111113] hover:bg-[#18181b] text-zinc-400 font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl border border-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancel / Not Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Streak Broken Penalty Warning Modal */}
          {showStreakBrokenModal && (
            <div id="streak-broken-modal" className="absolute inset-0 bg-black/95 z-[95] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-red-500/30 p-6 rounded-2xl max-w-xs flex flex-col items-center gap-4.5 shadow-[0_0_35px_rgba(239,68,68,0.15)] relative overflow-hidden"
              >
                <div className="w-13 h-13 rounded-full bg-red-500/10 border border-red-400/35 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="text-2xl">💔</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    Streak Broken!
                  </h3>
                  <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest mt-1">
                    Your daily check-in has reset to Day 1.
                  </p>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1">
                  Oh no! You missed a calendar day, so your daily check-in streak was reset to Day 1. Don't worry, start tapping now and keep the streak alive!
                </p>

                <div className="flex flex-col gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      setShowStreakBrokenModal(false);
                      try {
                        audioEngine.playTap(1);
                      } catch (e) {}
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl border border-red-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    CONTINUE TO GAME
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* User Choice: Refill Energy Modal Overlay */}
          {showRefillChoiceModal && (
            <div id="refill-choice-modal" className="absolute inset-0 bg-black/95 z-[95] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#050505] border border-yellow-500/30 p-6 rounded-2xl max-w-xs flex flex-col items-center gap-4.5 shadow-[0_0_35px_rgba(245,158,11,0.15)] relative overflow-hidden"
              >
                <div className="w-13 h-13 rounded-full bg-yellow-500/10 border border-yellow-500/35 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <span className="text-2xl animate-pulse">⚡</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    DEPLETED ENERGY!
                  </h3>
                  <p className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest mt-1">
                    Capacitor is Empty
                  </p>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1">
                  Do you want to continue tapping and earn up to <strong>10,000 daily coins</strong>?
                  <br />
                  <span className="text-zinc-500 block mt-2 text-[9px]">
                    Watch a sponsored 5s video to instantly refill to 100%!
                  </span>
                </p>

                <div className="flex flex-col gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      setShowRefillChoiceModal(false);
                      triggerActionAdRefill();
                    }}
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9.5px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    ⚡ YES, REFILL MY ENERGY
                  </button>

                  <button
                    onClick={() => {
                      setShowRefillChoiceModal(false);
                      audioEngine.playTap(1);
                    }}
                    className="w-full py-2.5 bg-[#111113] hover:bg-[#18181b] text-zinc-400 font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl border border-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    NO, MAYBE LATER
                  </button>
                </div>
              </motion.div>
            </div>
          )}



          {/* Daily Limit Reached Modal Overlay */}
          {(showDailyLimitModal || dailyTapCount >= 10000) && (
            <div id="daily-limit-modal" className="absolute inset-0 bg-black/98 z-[150] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0b0c10] border border-red-500/35 p-7 rounded-2xl max-w-xs flex flex-col items-center gap-5 shadow-[0_0_45px_rgba(239,68,68,0.22)] relative overflow-hidden"
              >
                {/* Decorative golden light streak */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />

                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/35 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse">
                  <span className="text-4xl">❌</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-red-500 text-xl uppercase tracking-wider leading-snug">
                    AAJ KI LIMIT KHATAM!
                  </h3>
                  <h4 className="font-display font-black text-amber-400 text-lg uppercase tracking-widest mt-1">
                    KAL AANA
                  </h4>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  You have successfully earned your 10,000 tap coins today.
                </p>

                <div className="w-full mt-1 p-3 bg-red-500/5 rounded-xl border border-red-500/15">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    Limit Resets In:
                  </p>
                  <p className="text-base font-black text-red-400 font-mono mt-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                    {dailyLimitCountdown || "00:00:00"}
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Interstitial Ad Gate Modal Overlay */}
          {showAdGatePopup && (
            <div id="ad-gate-modal" className="absolute inset-0 bg-black/98 z-[97] flex flex-col items-center justify-center p-6 text-center select-none rounded-[36px]">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0b0c10] border border-amber-500/30 p-6 rounded-2xl max-w-xs flex flex-col items-center gap-4.5 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden"
              >
                {/* Decorative golden light streak */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl" />

                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse">
                  <span className="text-3xl">📺</span>
                </div>

                <div>
                  <h3 className="font-display font-black text-white text-base uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
                    Milestone Locked!
                  </h3>
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-1 font-bold">
                    Watch a short ad to keep earning!
                  </p>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans mt-1">
                  Aapne dynamic earning checkpoint cross kiya hai! Continue karne ke liye click karein:
                </p>

                <div className="flex flex-col gap-2.5 w-full mt-1 shrink-0 z-10">
                  <button
                    onClick={triggerAdGateWatch}
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9.5px] uppercase tracking-widest rounded-xl border border-yellow-400 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    📺 Watch Ad
                  </button>

                  <button
                    onClick={() => setShowAdGatePopup(false)}
                    className="w-full py-2.5 bg-[#111113] hover:bg-[#18181b] text-zinc-400 font-extrabold text-[9.5px] uppercase tracking-widest rounded-xl border border-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Not Now
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Admin Dashboard Overlay Modal */}
          {showAdminDashboard && (
            <div id="admin-dashboard-modal" className="absolute inset-0 bg-black/95 z-[98] flex flex-col p-6 select-none rounded-[36px]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-yellow-500 animate-pulse" size={17} />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Admin Console</h3>
                    <p className="text-[8px] text-zinc-500 font-mono">STAR REWARDS DISPATCH & AUDIT TRAIL</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAdminDashboard(false);
                    try { audioEngine.playTap(1); } catch (e) {}
                  }}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800/60 cursor-pointer transition-all"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
                <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[7.5px] font-mono text-zinc-500 block uppercase font-bold">Total Logs</span>
                    <span className="text-base font-black text-white">{allAdminRequests.length}</span>
                  </div>
                  <Coins size={14} className="text-yellow-500/40" />
                </div>
                <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[7.5px] font-mono text-zinc-550 block uppercase font-bold">Pending Checks</span>
                    <span className="text-base font-black text-amber-500">
                      {allAdminRequests.filter(r => r.status === 'Processing').length}
                    </span>
                  </div>
                  <Clock size={14} className="text-amber-500/40" />
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="flex items-center gap-2 mt-3 select-none shrink-0">
                <button
                  onClick={fetchAdminRequests}
                  disabled={isLoadingAdminRequests}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-mono font-black text-[8px] uppercase tracking-wider rounded-lg border border-zinc-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <RefreshCw size={10} className={isLoadingAdminRequests ? "animate-spin text-yellow-500" : ""} />
                  {isLoadingAdminRequests ? "Loading Ledger..." : "Force Sync Ledger"}
                </button>
                <button
                  onClick={() => {
                    try { audioEngine.playTap(1); } catch (e) {}
                    if (window.confirm("Are you sure you want to clear all dispatch logs for testing?")) {
                      setWorthCardRequests([]);
                      setAllAdminRequests([]);
                      setPendingSync(true);
                      triggerToast("Ledger dispatch history cleared!");
                    }
                  }}
                  className="px-3 py-2 bg-rose-950/20 hover:bg-rose-950/45 text-rose-400 font-mono font-black text-[8px] uppercase tracking-wider rounded-lg border border-rose-900/35 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={10} />
                  Reset Logs
                </button>
              </div>

              {/* Requests List */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1 scrollbar-thin">
                {isLoadingAdminRequests ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-yellow-500" />
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Syncing Network Nodes...</span>
                  </div>
                ) : allAdminRequests.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-zinc-900 rounded-xl">
                    <span className="text-[9.5px] text-zinc-600 font-mono uppercase">No dispatch records found</span>
                  </div>
                ) : (
                  allAdminRequests.map((req) => {
                    const isPending = req.status === 'Processing';
                    return (
                      <div 
                        key={req.id} 
                        className="p-3 rounded-xl bg-[#08080a] border border-zinc-900 flex flex-col gap-2.5 text-left font-sans text-xs relative overflow-hidden"
                      >
                        {/* Status watermark bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                        {/* Top Metadata */}
                        <div className="flex justify-between items-start pl-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Star size={11} className="text-yellow-400 fill-yellow-400/25" />
                              <span className="text-zinc-200 font-black uppercase tracking-wide">
                                {req.cardName}
                              </span>
                            </div>
                            <span className="text-[8.5px] font-mono text-zinc-500 block uppercase font-bold mt-0.5">
                              User: {req.username} • UID: {req.userId.substring(0, 6)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-emerald-400 font-black block">
                              Exact Value: {req.value} INR
                            </span>
                            <span className="text-[7.5px] font-mono text-zinc-550 block uppercase">
                              Cost: {req.cost.toLocaleString()} Coins
                            </span>
                          </div>
                        </div>

                        {/* Center Section: Destination Handle Code */}
                        <div className="pl-2 bg-black/40 border border-zinc-950 p-2 rounded-lg">
                          <span className="text-[7.5px] font-mono text-zinc-550 block uppercase font-bold">Destination UPI Address:</span>
                          <span className="text-[11px] font-mono text-yellow-500 font-black select-all break-all tracking-wide font-bold">
                            {req.handle}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="pl-2 flex items-center justify-between">
                          <span className="text-[8px] font-mono text-zinc-600 uppercase">
                            {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(req.timestamp).toLocaleDateString()}
                          </span>

                          {isPending ? (
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9px] uppercase tracking-wider rounded-lg border border-yellow-400 cursor-pointer transition-all active:scale-[0.97]"
                            >
                              ✅ APPROVE & DISPATCH
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-950/30 text-emerald-400 rounded-lg text-[8px] font-mono font-black uppercase flex items-center gap-1 border border-emerald-900/35">
                              <CheckCircle2 size={10} /> Dispatched & Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </motion.div>
      )}

      {/* Footer system details copyright */}
      <div className="mt-5 text-center select-none text-[9px] font-mono text-zinc-650 flex flex-col gap-1 items-center justify-center">
        <p className="flex items-center gap-1 tracking-wider uppercase font-semibold text-zinc-650">
          <span>TapWolf Game Engine</span>
          <span>•</span>
          <span className="text-yellow-500/50 font-black">STABLE V1.4.0</span>
        </p>
        <p className="text-zinc-800 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
          Automatic cloud backup active • Guest mode enabled
        </p>
      </div>

    </div>
  );
}
