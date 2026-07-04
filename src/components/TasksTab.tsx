import React from 'react';
import { Trophy, Tv, CheckCircle2, Sparkles, Lock, Gift } from 'lucide-react';

interface TasksTabProps {
  claimedDays: number[];
  currentStreak: number;
  lastCheckInDate?: string;
  getLocalDateString?: () => string;
  handleClaimDailyGift: (dayNum: number) => void;
  getDailyGiftForDay: (dayNum: number) => number;
  completedDailyTasks: string[];
  dailyEarnedCoins: number;
  claimedDailyMilestones: string[];
  onClaimDailyMilestone: (milestoneId: string, rewardCoins: number) => void;
  onTriggerDailyTask: (taskId: 'task1' | 'task2' | 'task3', label: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  claimedDays,
  currentStreak,
  lastCheckInDate,
  getLocalDateString,
  handleClaimDailyGift,
  getDailyGiftForDay,
  completedDailyTasks,
  dailyEarnedCoins,
  claimedDailyMilestones,
  onClaimDailyMilestone,
  onTriggerDailyTask
}) => {
  const dailyTasks = [
    { id: 'task1' as const, label: 'Daily Task 1', description: 'Watch 1 sponsor video to earn 100 coins.' },
    { id: 'task2' as const, label: 'Daily Task 2', description: 'Watch 1 sponsor video to earn 100 coins.' },
    { id: 'task3' as const, label: 'Daily Task 3', description: 'Watch 1 sponsor video to earn 100 coins.' },
  ];

  const milestones = [
    { id: 'daily_milestone_1', label: 'Milestone 1', description: 'Earn 3,000 coins from tapping today.', requirement: 3000, reward: 500 },
    { id: 'daily_milestone_2', label: 'Milestone 2', description: 'Earn 7,000 coins from tapping today.', requirement: 7000, reward: 500 },
    { id: 'daily_milestone_3', label: 'Milestone 3', description: 'Earn 10,000 coins from tapping today.', requirement: 10000, reward: 700 },
  ];

  // The 3 milestone rewards will only unlock after the user has successfully completed all 3 initial Daily Tasks (Task 1, 2, and 3)
  const isUnlocked = completedDailyTasks.includes('task1') && 
                     completedDailyTasks.includes('task2') && 
                     completedDailyTasks.includes('task3');

  return (
    <div className="flex-1 flex flex-col gap-4 py-1 animate-fadeIn overflow-y-auto max-h-[510px] scrollbar-thin">
      {/* Tab Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3 select-none shrink-0 border-zinc-900/40">
        <Trophy className="text-yellow-400 shrink-0" size={17} />
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-white">Daily Missions</h3>
          <p className="text-[9px] text-zinc-500 font-mono">CHALLENGE LOGS & PRIZE POOLS</p>
        </div>
      </div>

      {/* 30-Day Check-In Calendar Grid */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-4 select-none shrink-0 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black">
              📅 30-Days Check-In Calendar
            </h4>
            <p className="text-[8px] text-zinc-500 font-mono mt-0.5 uppercase">Claim rewards sequentially every day</p>
          </div>
          <span className="text-[9px] font-mono bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-500/20 font-black">
            PROGRESS: {claimedDays.length} / 30 DAYS
          </span>
        </div>

        {/* Global lock notice if already claimed today */}
        {(() => {
          const todayStr = getLocalDateString ? getLocalDateString() : new Date().toISOString().split('T')[0];
          const hasClaimedToday = lastCheckInDate === todayStr;
          if (hasClaimedToday) {
            return (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-center text-red-400 animate-pulse">
                <span className="text-xs">🔒</span>
                <span className="text-[9px] font-mono uppercase tracking-wider font-bold">
                  ALREADY CLAIMED TODAY (Come back tomorrow!)
                </span>
              </div>
            );
          }
          return null;
        })()}
        
        <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
            const isClaimed = claimedDays.includes(day);
            const todayStr = getLocalDateString ? getLocalDateString() : new Date().toISOString().split('T')[0];
            const hasClaimedToday = lastCheckInDate === todayStr;
            const isClaimableNow = !hasClaimedToday && (claimedDays.length + 1 === day);
            const giftValue = getDailyGiftForDay(day);
            const isMilestone = [7, 14, 21, 30].includes(day);

            return (
              <button
                key={day}
                disabled={isClaimed || hasClaimedToday || !isClaimableNow}
                onClick={() => handleClaimDailyGift(day)}
                className={`p-1.5 py-2 rounded-lg border flex flex-col items-center justify-between text-center transition-all cursor-pointer min-h-[52px] ${
                  isClaimed 
                    ? 'bg-zinc-950/40 border-zinc-900/50 text-zinc-600 opacity-60' 
                    : isClaimableNow
                      ? isMilestone 
                        ? 'bg-amber-500/15 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse'
                        : 'bg-[#151518] border-yellow-500 animate-pulse text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                      : isMilestone
                        ? 'bg-[#110e08] border-zinc-900/80 text-amber-600/70'
                        : 'bg-[#0f0f12] border-zinc-900 text-zinc-500 hover:border-zinc-800'
                }`}
              >
                <span className="text-[7.5px] font-mono font-bold tracking-tight">DAY {day}</span>
                <span className={`text-[10px] font-black my-0.5 select-none ${isMilestone && !isClaimed ? 'text-amber-400' : ''}`}>
                  +{giftValue} {isMilestone && !isClaimed ? '⭐' : ''}
                </span>
                <span className="text-[7px] font-bold tracking-wider uppercase scale-90">
                  {isClaimed 
                    ? 'DONE' 
                    : isClaimableNow 
                      ? 'CLAIM' 
                      : hasClaimedToday && (claimedDays.length + 1 === day)
                        ? 'TOMORROW'
                        : 'LOCKED'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Video Tasks Section */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-4 select-none shrink-0 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black flex items-center gap-1.5">
            📺 Daily Sponsor Tasks
          </h4>
          <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 px-2.5 py-0.5 rounded-full border border-zinc-800 font-bold">
            COMPLETED: {completedDailyTasks.length} / 3
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {dailyTasks.map((t) => {
            const isCompleted = completedDailyTasks.includes(t.id);

            return (
              <div
                key={t.id}
                className={`border rounded-2xl p-3 px-4 flex items-center justify-between gap-3 transition-all ${
                  isCompleted
                    ? 'bg-zinc-950/20 border-zinc-950 opacity-60'
                    : 'bg-[#0c0c0e]/80 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Tv size={13} className={isCompleted ? 'text-zinc-600' : 'text-yellow-400'} />
                    <h4 className={`text-xs font-black uppercase tracking-wide truncate ${isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {t.label}
                    </h4>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-tight truncate">{t.description}</p>
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <span className="p-1.5 bg-zinc-950 text-emerald-500 rounded-lg text-[8px] font-mono font-black uppercase flex items-center gap-1">
                      <CheckCircle2 size={10} /> DONE
                    </span>
                  ) : (
                    <button
                      onClick={() => onTriggerDailyTask(t.id, t.label)}
                      className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-black text-[9px] uppercase rounded-xl border border-yellow-300 cursor-pointer shadow-md flex items-center gap-1"
                    >
                      <Sparkles size={10} /> WATCH (+100)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Rewards Section */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-4 select-none shrink-0 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black flex items-center gap-1.5">
            🎁 Daily Tap Milestones
          </h4>
          <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 px-2.5 py-0.5 rounded-full border border-zinc-800 font-bold">
            {isUnlocked ? "UNLOCKED" : "LOCKED"}
          </span>
        </div>

        {/* Lock warning/instructions */}
        {!isUnlocked && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-2.5 px-3 flex items-center gap-2 text-left">
            <Lock size={14} className="text-yellow-500 shrink-0" />
            <p className="text-[10px] text-yellow-500/90 leading-normal font-sans font-medium">
              Complete all 3 Ad Tasks above to unlock these Milestone Bonuses!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {milestones.map((m) => {
            const isClaimed = claimedDailyMilestones.includes(m.id);
            const isMilestoneReached = dailyEarnedCoins >= m.requirement;

            return (
              <div
                key={m.id}
                className={`border rounded-2xl p-3 px-4 flex items-center justify-between gap-3 transition-all ${
                  isClaimed
                    ? 'bg-zinc-950/20 border-zinc-950 opacity-60'
                    : !isUnlocked
                      ? 'bg-[#060608]/50 border-zinc-950 opacity-50'
                      : 'bg-[#0c0c0e]/80 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isClaimed ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : !isUnlocked ? (
                      <Lock size={13} className="text-zinc-650" />
                    ) : (
                      <Gift size={13} className={isMilestoneReached ? 'text-green-400' : 'text-zinc-500'} />
                    )}
                    <h4 className={`text-xs font-black uppercase tracking-wide truncate ${isClaimed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {m.label}
                    </h4>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-tight truncate">
                    {m.description}
                  </p>
                  
                  {/* Progress bar when unlocked but not claimed */}
                  {isUnlocked && !isClaimed && (
                    <div className="w-full max-w-[155px] space-y-1 pt-1">
                      <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isMilestoneReached ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(100, (dailyEarnedCoins / m.requirement) * 100)}%` }} 
                        />
                      </div>
                      <span className="text-[7.5px] font-mono text-zinc-500 block uppercase tracking-wider">
                        Progress: {dailyEarnedCoins.toLocaleString()} / {m.requirement.toLocaleString()} ({Math.min(100, (dailyEarnedCoins / m.requirement) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {isClaimed ? (
                    <span className="p-1.5 bg-zinc-950 text-emerald-500 rounded-lg text-[8px] font-mono font-black uppercase flex items-center gap-1">
                      <CheckCircle2 size={10} /> CLAIMED
                    </span>
                  ) : !isUnlocked ? (
                    <span className="px-2 py-1 bg-zinc-950/50 border border-zinc-900/30 text-zinc-600 rounded text-[8px] font-mono uppercase tracking-wider flex items-center gap-1">
                      <Lock size={9} /> LOCKED
                    </span>
                  ) : isMilestoneReached ? (
                    <button
                      onClick={() => onClaimDailyMilestone(m.id, m.reward)}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-neutral-950 font-black text-[9px] uppercase rounded-xl border border-green-300 cursor-pointer shadow-md flex items-center gap-1"
                    >
                      CLAIM BONUS (+{m.reward})
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-[#101012] border border-zinc-900 text-zinc-500 rounded text-[8px] font-mono uppercase tracking-wider">
                      {m.requirement.toLocaleString()} Goal
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
