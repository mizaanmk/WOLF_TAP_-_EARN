import React, { useState } from 'react';
import { Shield, RefreshCw, Star, Diamond, CheckCircle2, Gift, Clock, Sparkles, Lock } from 'lucide-react';
import { WorthCardRequest } from '../types';

interface WalletTabProps {
  coins: number;
  worthCardRequests: WorthCardRequest[];
  onSubmitWorthCard: (cardId: string, handle: string) => void;
  isDispatching: boolean;
  triggerToast: (msg: string) => void;
  audioEngine: any;
  isWithdrawalLocked: boolean;
  remainingWithdrawalDays: number;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  coins,
  worthCardRequests,
  onSubmitWorthCard,
  isDispatching,
  triggerToast,
  audioEngine,
  isWithdrawalLocked,
  remainingWithdrawalDays
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('card_500');
  const [handleCode, setHandleCode] = useState<string>('');

  const worthCards = [
    { id: 'card_500', name: 'Worth 500 Card', value: 500, cost: 1000000, label: '10 Lakh' },
    { id: 'card_600', name: 'Worth 600 Card', value: 600, cost: 1200000, label: '12 Lakh' },
    { id: 'card_700', name: 'Worth 700 Card', value: 700, cost: 1400000, label: '14 Lakh' },
    { id: 'card_800', name: 'Worth 800 Card', value: 800, cost: 1600000, label: '16 Lakh' },
    { id: 'card_900', name: 'Worth 900 Card', value: 900, cost: 1800000, label: '18 Lakh' },
    { id: 'card_1000', name: 'Worth 1000 Card', value: 1000, cost: 2000000, label: '20 Lakh' },
  ];

  const selectedCard = worthCards.find(c => c.id === selectedCardId) || worthCards[0];

  const handleDispatchSubmit = () => {
    if (isWithdrawalLocked) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast(`Withdrawal is locked! Unlocks in ${remainingWithdrawalDays} days.`);
      return;
    }
    if (!selectedCardId) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Please select a Worth Card first.");
      return;
    }
    const cleanHandle = handleCode.trim();
    if (!cleanHandle) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast("Please enter your delivery handle address.");
      return;
    }
    
    // Check if the user has enough coins
    if (coins < selectedCard.cost) {
      try { audioEngine.playError(); } catch (e) {}
      triggerToast(`Insufficient balance! Need ${selectedCard.cost.toLocaleString()} coins.`);
      return;
    }

    // Call submit handler
    onSubmitWorthCard(selectedCard.id, cleanHandle);
    setHandleCode('');
  };

  return (
    <div className="flex-1 flex flex-col gap-4 py-1 animate-fadeIn overflow-y-auto max-h-[510px] scrollbar-thin">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3 select-none shrink-0 border-zinc-900/40">
        <Diamond className="text-yellow-400 shrink-0" size={17} />
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-white">Worth Cards Deck</h3>
          <p className="text-[9px] text-zinc-500 font-mono">REDEEM WORTH STAR CARDS & MANAGE LOGS</p>
        </div>
      </div>

      {/* Withdrawal Lock Status HUD */}
      <div className="bg-zinc-950/85 border border-zinc-900 rounded-2xl p-3.5 flex items-center justify-between select-none shadow-[inset_0_0_12px_rgba(251,191,36,0.02)] shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
            remainingWithdrawalDays > 0 
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-500 animate-pulse' 
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500'
          }`}>
            {remainingWithdrawalDays > 0 ? (
              <Lock size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )}
          </div>
          <div>
            <span className="text-[8.5px] font-mono text-zinc-500 uppercase block tracking-wider">
              SECURE PAYOUT STATUS
            </span>
            <span className="text-[11.5px] font-bold text-white leading-normal block">
              {remainingWithdrawalDays > 0 ? (
                <>Withdrawal unlocks in <span className="text-amber-500 font-black">{remainingWithdrawalDays} days</span></>
              ) : (
                <span className="text-emerald-400 font-extrabold">Withdrawal Unlocked! ✅</span>
              )}
            </span>
          </div>
        </div>
        {remainingWithdrawalDays > 0 && (
          <span className="text-[8px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-wider animate-pulse">
            LOCKED
          </span>
        )}
      </div>

      {/* Available Net Assets Balance Card */}
      <div className="bg-[#0d0d10] border border-zinc-900 p-4 rounded-2xl relative overflow-hidden select-all shrink-0">
        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
          AVAILABLE NET ASSETS
        </span>
        <h2 className="text-2xl font-black text-yellow-500 mt-1 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
          {coins.toLocaleString()} <span className="text-xs text-zinc-400 uppercase font-mono font-bold">Coins</span>
        </h2>
        <div className="text-[8px] font-mono text-zinc-500 mt-2 flex items-center gap-1 uppercase select-none">
          <Shield size={9} className="text-emerald-500" /> Secure dispatch ledger active
        </div>
      </div>

      {/* Worth Cards Grid Section */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-4 select-none shrink-0 shadow-lg space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black flex items-center gap-1.5">
            💎 Select Worth Card
          </h4>
          <span className="text-[8.5px] font-mono text-zinc-500 uppercase font-black">
            Term: Star Rewards
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {worthCards.map((card) => {
            const isSelected = selectedCardId === card.id;
            const canAfford = coins >= card.cost;

            return (
              <button
                key={card.id}
                onClick={() => {
                  setSelectedCardId(card.id);
                  try { audioEngine.playTap(1); } catch (e) {}
                }}
                className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1c1c24] to-[#111116] border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.15)] text-yellow-400'
                    : 'bg-[#0a0a0c] border-zinc-900/80 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                {/* Glowing subtle background pattern */}
                <div className="absolute -right-3 -top-3 w-10 h-10 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star size={11} className={isSelected ? 'text-yellow-400 fill-yellow-400/25' : 'text-zinc-600'} />
                  <span className="text-[11px] font-black uppercase tracking-wide truncate">
                    Worth {card.value}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[8px] font-mono text-zinc-500 block uppercase">COST:</span>
                  <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-yellow-400' : canAfford ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {card.label} Coins
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute right-2.5 top-2.5 w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Card summary & Masked Form */}
        <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex flex-col gap-3">
          <div>
            <span className="text-[8.5px] font-mono text-zinc-550 uppercase block">Selected Destination Card</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black text-white uppercase">{selectedCard.name}</span>
              <span className="text-[9px] font-mono bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/10 font-bold">
                Cost: {selectedCard.cost.toLocaleString()} Coins
              </span>
            </div>
          </div>

          {/* Masked Input Field (User hint for UPI) */}
          <div className="space-y-1.5 text-left">
            <label className="text-[9.5px] font-mono font-black text-zinc-400 uppercase tracking-wider block">
              Enter Delivery Address / Handle Code:
            </label>
            
            <input 
              type="text" 
              value={handleCode}
              onChange={(e) => setHandleCode(e.target.value)}
              placeholder="Example: 9359xxxxxx@apl , 8788xxxxxxxx@ybl , 7757xxxxxxxx@paytm"
              className="bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-yellow-500/50 w-full select-text transition-all"
            />
          </div>

          {isDispatching ? (
            <div className="py-2.5 px-3 bg-[#111114] border border-yellow-500/25 rounded-xl flex items-center justify-between text-[10px] font-mono text-yellow-500 uppercase font-black animate-pulse">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin text-yellow-400 shrink-0" />
                Validating Ledger Route...
              </span>
              <span>WAIT</span>
            </div>
          ) : (
            <button
              disabled={isWithdrawalLocked}
              onClick={handleDispatchSubmit}
              className={`w-full py-2.5 font-black text-[9.5px] uppercase tracking-wider rounded-xl border transition-all shadow-[0_4px_12px_rgba(245,158,11,0.15)] ${
                isWithdrawalLocked 
                  ? 'bg-zinc-800 border-zinc-750 text-zinc-500 cursor-not-allowed opacity-60' 
                  : 'bg-yellow-500 hover:bg-yellow-400 text-neutral-950 border-yellow-400 cursor-pointer active:scale-[0.98]'
              }`}
            >
              {isWithdrawalLocked 
                ? `🔒 Locked (Unlocks in ${remainingWithdrawalDays} days)` 
                : '🚀 Dispatch Card Request'}
            </button>
          )}
        </div>
      </div>

      {/* Delivery Logs / Dispatch History */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-4 select-none shrink-0 shadow-lg space-y-2.5">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-black flex items-center gap-1.5">
            📦 Dispatch Logs & Delivery History
          </h4>
          <span className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-2.5 py-0.5 rounded-full border border-zinc-800 font-bold">
            TOTAL: {worthCardRequests.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-none">
          {worthCardRequests.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-zinc-900/60 rounded-xl">
              <span className="text-[9.5px] text-zinc-650 font-mono uppercase">No records found</span>
            </div>
          ) : (
            [...worthCardRequests].reverse().map((req) => (
              <div 
                key={req.id} 
                className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-[#08080a] border border-zinc-900 flex items-center text-[10px] font-sans"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Star size={9.5} className="text-yellow-400" />
                    <span className="text-zinc-200 font-black uppercase truncate">{req.cardName}</span>
                  </div>
                  <div className="text-[8.5px] text-zinc-500 font-mono tracking-tight truncate max-w-[170px]">
                    Handle: {req.handle}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {req.status === 'Dispatched' ? (
                    <span className="p-1 px-1.5 bg-emerald-950/20 text-emerald-400 rounded-md text-[8px] font-mono font-black uppercase flex items-center gap-1 border border-emerald-900/30">
                      <CheckCircle2 size={10} /> DISPATCHED
                    </span>
                  ) : (
                    <span className="p-1 px-1.5 bg-amber-950/20 text-amber-500 rounded-md text-[8px] font-mono font-black uppercase flex items-center gap-1 border border-amber-900/30 animate-pulse">
                      <Clock size={10} /> PROCESSING
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
