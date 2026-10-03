import React, { useEffect, useState } from 'react';
import { Swords, X, Check, Clock, Coins, Shield } from 'lucide-react';
import { DuelChallengeData } from '../services/multiplayerService';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';

interface IncomingChallengeModalProps {
  challenge: DuelChallengeData;
  onAccept: (challenge: DuelChallengeData) => void;
  onDecline: (challengeId: string) => void;
}

export const IncomingChallengeModal: React.FC<IncomingChallengeModalProps> = ({
  challenge,
  onAccept,
  onDecline,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(1, Math.round((challenge.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    sound.playWarning();
    hapticEffects.feverStart();

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((challenge.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDecline(challenge.challengeId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge, onDecline]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border-2 border-red-500 w-full max-w-sm rounded-3xl p-5 shadow-2xl text-white text-center space-y-4 relative overflow-hidden animate-bounce-short">
        
        {/* Shimmer top pulse bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 animate-pulse" />

        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-3xl shadow-lg shadow-red-600/30 animate-pulse">
            <Swords className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Title & Challenger */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-red-400 tracking-widest bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/40">
            Прямой вызов на бой
          </span>
          <h3 className="text-lg font-black text-white">ВАС ВЫЗВАЛИ НА ДУЭЛЬ!</h3>
          <p className="text-xs text-zinc-400">
            Игрок <strong className="text-white font-black">{challenge.fromName}</strong> бросил вам вызов!
          </p>
        </div>

        {/* Opponent & Bet Card */}
        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">{challenge.fromAvatar || '🦫'}</span>
            <div>
              <span className="font-black text-xs text-white block">{challenge.fromName}</span>
              <span className="text-[10px] text-amber-400 font-mono">Ур. {challenge.fromLevel}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-zinc-400 block font-bold">Ставка на кон:</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              +{formatNumber(challenge.betCoins)} 🪙
            </span>
          </div>
        </div>

        {/* Expiry Countdown Timer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Авто-отклонение через: {secondsLeft}с</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              hapticEffects.feverStart();
              sound.playComboSuccess();
              onAccept(challenge);
            }}
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-black font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ПРИНЯТЬ ВЫЗОВ</span>
          </button>

          <button
            onClick={() => {
              hapticEffects.tap();
              onDecline(challenge.challengeId);
            }}
            className="py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Отклонить</span>
          </button>
        </div>

      </div>
    </div>
  );
};
