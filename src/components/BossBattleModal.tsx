import React, { useState, useEffect, useRef } from 'react';
import { GameLevel } from '../types/game';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';

// Import boss portraits
import bossLazySloth from '../assets/images/boss_lazy_sloth_1790410146391.jpg';
import bossNoodleTitan from '../assets/images/boss_noodle_titan_1790410159541.jpg';
import bossYardExpert from '../assets/images/boss_yard_expert_1790410172429.jpg';
import bossOvertimeLord from '../assets/images/boss_overtime_lord_1790410187735.jpg';
import bossNightThinker from '../assets/images/boss_night_thinker_1790410202532.jpg';
import bossSkynet3000 from '../assets/images/boss_skynet_3000_1790410218654.jpg';
import bossMechaGodzilla from '../assets/images/boss_mecha_godzilla_1790410230728.jpg';
import bossVoidEater from '../assets/images/boss_void_eater_1790410244459.jpg';
import bossInsomniaLord from '../assets/images/boss_insomnia_lord_1790410257338.jpg';
import bossBalanceCreator from '../assets/images/boss_balance_creator_1790410270827.jpg';

const BOSS_PORTRAITS: Record<string, string> = {
  'Будильник Судного Дня': bossLazySloth,
  'Лапшичный Титан': bossNoodleTitan,
  'Главный Эксперт Двора': bossYardExpert,
  'Повелитель Овертаймов': bossOvertimeLord,
  'Ночной Мыслитель': bossNightThinker,
  'Суперкомпьютер Скайнет-3000': bossSkynet3000,
  'Титанический Мехазавр': bossMechaGodzilla,
  'Пожиратель Орбит': bossVoidEater,
  'Повелитель Бессонницы': bossInsomniaLord,
  'Создатель Баланса': bossBalanceCreator,
};

interface BossBattleModalProps {
  bossLevel: GameLevel;
  tapPower: number;
  critChance: number;
  critMultiplier: number;
  totalMultiplier: number;
  isFeverActive: boolean;
  bonusBossTime: number; // from artifacts
  onVictory: (coinsReward: number, gemsReward: number) => void;
  onClose: () => void;
}

export const BossBattleModal: React.FC<BossBattleModalProps> = ({
  bossLevel,
  tapPower,
  critChance,
  critMultiplier,
  totalMultiplier,
  isFeverActive,
  bonusBossTime,
  onVictory,
  onClose
}) => {
  const maxHp = bossLevel.bossHp || bossLevel.clicksRequired * 2;
  const [currentHp, setCurrentHp] = useState(maxHp);
  const totalTime = (bossLevel.bossTimeLimit || 35) + bonusBossTime;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isDefeated, setIsDefeated] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isBossHurt, setIsBossHurt] = useState(false);
  const [recentDamage, setRecentDamage] = useState<{ id: number; text: string; isCrit: boolean }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsFailed(true);
          return 0;
        }
        return Math.max(0, +(prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleBossTap = (e: React.PointerEvent) => {
    if (isDefeated || isFailed) return;

    const isCrit = Math.random() * 100 < critChance;
    const critMult = isCrit ? critMultiplier : 1;
    const feverMult = isFeverActive ? 4 : 1;
    const damage = Math.round(tapPower * critMult * feverMult * totalMultiplier);

    sound.playBossHit();
    if (isCrit) {
      hapticEffects.crit();
    } else {
      hapticEffects.bossHit();
    }

    setIsBossHurt(true);
    setTimeout(() => setIsBossHurt(false), 120);

    const dmgId = Date.now() + Math.random();
    setRecentDamage(prev => [...prev.slice(-10), {
      id: dmgId,
      text: isCrit ? `КРИТ -${formatNumber(damage)}!` : `-${formatNumber(damage)}`,
      isCrit
    }]);

    setTimeout(() => {
      setRecentDamage(prev => prev.filter(d => d.id !== dmgId));
    }, 600);

    setCurrentHp(prev => {
      const nextHp = prev - damage;
      if (nextHp <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsDefeated(true);
        sound.playBossVictory();
        hapticEffects.bossDefeat();


        const rewardCoins = bossLevel.rewardCoins * 3;
        const rewardGems = bossLevel.rewardGems * 2;

        setTimeout(() => {
          onVictory(rewardCoins, rewardGems);
        }, 1500);

        return 0;
      }
      return nextHp;
    });
  };

  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const timePercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  const bossPortrait = BOSS_PORTRAITS[bossLevel.bossName || ''];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-red-950/40 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl shadow-red-950/60 text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-red-600/30 text-red-400 border border-red-500/50 px-3 py-1 rounded-full">
            Уровень {bossLevel.level} · БИТВА С БОССОМ
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <h2 className="text-2xl font-black text-white mt-1">
          {bossLevel.bossName || bossLevel.name}
        </h2>
        {bossLevel.quote && (
          <p className="text-xs text-red-300 italic mt-0.5">
            «{bossLevel.quote}»
          </p>
        )}

        {/* Timer Bar */}
        <div className="mt-4 mb-2">
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span className="flex items-center gap-1 text-red-400 font-bold">
              ⏱️ Осталось времени:
            </span>
            <span className={`font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse text-sm' : 'text-slate-200'}`}>
              {timeLeft.toFixed(1)} сек
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                timeLeft < 8 ? 'bg-red-600 animate-pulse' : 'bg-amber-400'
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
            <span>Здоровье Босса (HP)</span>
            <span className="text-red-400 font-bold">
              {formatNumber(currentHp)} / {formatNumber(maxHp)} ({hpPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-red-800">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-100"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Boss Interactive Target */}
        <div className="relative flex flex-col items-center justify-center my-4">
          <div
            onPointerDown={handleBossTap}
            className={`relative flex items-center justify-center w-48 h-48 rounded-full border-4 cursor-pointer transition-transform duration-75 active:scale-90 overflow-hidden ${
              isBossHurt
                ? 'scale-90 border-red-500 shadow-lg shadow-red-500/80'
                : 'border-red-600/70 shadow-2xl'
            }`}
          >
            {bossPortrait ? (
              <img 
                src={bossPortrait} 
                alt={bossLevel.bossName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`text-7xl transition-transform ${isBossHurt ? 'rotate-6 scale-95' : 'scale-100'}`}>
                {bossLevel.icon}
              </span>
            )}

            {/* Damage numbers */}
            {recentDamage.map(d => (
              <span
                key={d.id}
                className={`absolute pointer-events-none font-black text-lg animate-float-num ${
                  d.isCrit ? 'text-yellow-300 text-xl' : 'text-red-300'
                }`}
                style={{ top: '20%' }}
              >
                {d.text}
              </span>
            ))}
          </div>

          <div className="mt-3 text-xs font-bold text-red-400 uppercase tracking-widest animate-pulse">
            ТАПАЙ ИЗО ВСЕХ СИЛ!
          </div>
        </div>

        {/* Defeat State */}
        {isDefeated && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 animate-bounce">
            <div className="text-2xl font-black">🎉 БОСС ПОВЕРЖЕН! 🎉</div>
            <div className="text-sm mt-1">
              Награда: +{formatNumber(bossLevel.rewardCoins * 3)} монет и +{bossLevel.rewardGems * 2} 💎
            </div>
          </div>
        )}

        {/* Failed State */}
        {isFailed && !isDefeated && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/90 border border-red-600 text-red-200">
            <div className="text-xl font-bold">💀 Время вышло! Босс ускользнул!</div>
            <p className="text-xs text-slate-300 mt-1">
              Прокачай силу тапа в магазине улучшений или активируй бустер и попробуй снова!
            </p>
            <button
              onClick={onClose}
              className="mt-3 py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase"
            >
              Вернуться и прокачаться
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

