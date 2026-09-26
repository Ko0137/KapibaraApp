import React, { useState } from 'react';
import { DailyQuest, DailyStreakDay } from '../types/game';
import { DAILY_STREAK_REWARDS, LUCKY_WHEEL_ITEMS, getCurrentWeeklyWheelSkin } from '../data/upgrades';
import { formatNumber, formatDurationHuman } from '../utils/format';
import { sound } from '../utils/audio';

const weeklySkin = getCurrentWeeklyWheelSkin();

interface DailyRewardsModalProps {
  dailyStreak: number;
  lastDailyClaimTimestamp: number;
  lastWheelSpinTimestamp: number;
  gems: number;
  quests: DailyQuest[];
  onClaimDaily: (streakDay: DailyStreakDay) => void;
  onSpinWheel: (reward: typeof LUCKY_WHEEL_ITEMS[0], costGems: number) => void;
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  dailyStreak,
  lastDailyClaimTimestamp,
  lastWheelSpinTimestamp,
  gems,
  quests,
  onClaimDaily,
  onSpinWheel,
  onClaimQuest,
  onClose
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'streak' | 'wheel' | 'quests'>('streak');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<typeof LUCKY_WHEEL_ITEMS[0] | null>(null);

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const WHEEL_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

  // Can claim daily if more than 20 hours passed since last claim
  const canClaimDaily = now - lastDailyClaimTimestamp >= 20 * 60 * 60 * 1000;
  const timeUntilDailyClaim = Math.max(0, lastDailyClaimTimestamp + 20 * 60 * 60 * 1000 - now);

  // Wheel free spin check
  const canFreeSpin = now - lastWheelSpinTimestamp >= WHEEL_COOLDOWN_MS;
  const timeUntilFreeSpin = Math.max(0, lastWheelSpinTimestamp + WHEEL_COOLDOWN_MS - now);

  const currentStreakDayIndex = ((dailyStreak - 1) % 7);

  // Wheel Spin Logic
  const handleSpin = (isFree: boolean) => {
    if (isSpinning) return;
    if (!isFree && gems < 5) return;

    setIsSpinning(true);
    setWheelResult(null);

    // Pick random slice
    const sliceCount = LUCKY_WHEEL_ITEMS.length;
    const sliceAngle = 360 / sliceCount;
    const winningIndex = Math.floor(Math.random() * sliceCount);
    const winningItem = LUCKY_WHEEL_ITEMS[winningIndex];

    // Spins 5-8 full rotations + slice target
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = fullSpins + (360 - (winningIndex * sliceAngle + sliceAngle / 2));

    setWheelRotation(prev => prev + targetAngle);

    // Play ticks during spin
    const tickInterval = setInterval(() => {
      sound.playWheelTick();
    }, 180);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWheelResult(winningItem);
      sound.playCoin();

      if (winningItem.type === 'jackpot') {
      }

      onSpinWheel(winningItem, isFree ? 0 : 5);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h2 className="text-lg font-black text-white">Бонусы и Награды</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 mt-3 mb-4 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('streak')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'streak'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📅 7 Дней
          </button>
          <button
            onClick={() => setActiveSubTab('wheel')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'wheel'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎡 Колесо Удачи
          </button>
          <button
            onClick={() => setActiveSubTab('quests')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'quests'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 Задания ({quests.filter(q => q.completed).length}/{quests.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* 7-DAY STREAK TAB */}
          {activeSubTab === 'streak' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-400 font-bold block">Ваша серия входов: {dailyStreak} дней!</span>
                  <span className="text-slate-400">Заходите каждый день, чтобы забрать Главный Сундук!</span>
                </div>
                <span className="text-3xl">🔥</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DAILY_STREAK_REWARDS.map((item, idx) => {
                  const isCurrentDay = idx === currentStreakDayIndex;
                  const isPast = idx < currentStreakDayIndex;
                  const isFuture = idx > currentStreakDayIndex;

                  return (
                    <div
                      key={item.day}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        idx === 6 ? 'col-span-2 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border-amber-500/50' : ''
                      } ${
                        isCurrentDay
                          ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-500/20'
                          : isPast
                            ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                            : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">День {item.day}</span>
                        {isPast && <span className="text-emerald-400 text-xs">✓ Забрано</span>}
                        {isCurrentDay && <span className="text-amber-400 text-xs font-bold">СЕГОДНЯ</span>}
                        {isFuture && <span className="text-slate-500 text-xs">🔒</span>}
                      </div>

                      <div className="font-mono text-xs font-bold text-slate-100 my-1">
                        {item.rewardText}
                      </div>

                      {isCurrentDay && (
                        <button
                          disabled={!canClaimDaily}
                          onClick={() => {
                            sound.playCoin();
                            onClaimDaily(item);
                          }}
                          className={`mt-2 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                            canClaimDaily
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 hover:brightness-110 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {canClaimDaily ? 'Забрать награду!' : `Через ${formatDurationHuman(timeUntilDailyClaim)}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LUCKY WHEEL TAB */}
          {activeSubTab === 'wheel' && (
            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              
              {/* Weekly Rare Jackpot Skin Banner */}
              <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-red-950/70 via-purple-950/70 to-zinc-900 border border-red-500/50 flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{weeklySkin.icon}</span>
                  <div>
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase block">Скин Недели в Колесе (Ротация):</span>
                    <span className="text-xs font-black text-white">{weeklySkin.name}</span>
                  </div>
                </div>
                <span className="text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse shadow">
                  MYTHIC
                </span>
              </div>

              {/* 12-Segment Wheel Container */}
              <div className="relative w-64 h-64 flex items-center justify-center my-1">
                {/* Top Pointer Arrow */}
                <div className="absolute -top-3 z-30 text-3xl text-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)] animate-bounce">
                  ▼
                </div>

                {/* Rotating Wheel Circle */}
                <div
                  className="w-60 h-60 rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden relative transition-transform duration-3000 ease-out"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: isSpinning ? '3.5s' : '0s'
                  }}
                >
                  {LUCKY_WHEEL_ITEMS.map((item, idx) => {
                    const sliceAngle = 360 / LUCKY_WHEEL_ITEMS.length;
                    const angle = sliceAngle * idx;
                    return (
                      <div
                        key={idx}
                        className="absolute w-full h-full top-0 left-0 flex items-start justify-center pt-1.5 text-center"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '50% 50%',
                        }}
                      >
                        <div
                          className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-black text-white max-w-[80px] truncate shadow-md border border-white/20"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.text}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Wheel Center Button */}
                  <div className="absolute inset-0 m-auto w-14 h-14 bg-zinc-950 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center font-black text-[10px] text-amber-300 shadow-xl z-20">
                    <span>🎡</span>
                    <span className="text-[8px] text-white">SPIN</span>
                  </div>
                </div>
              </div>

              {/* Wheel Result Toast */}
              {wheelResult && (
                <div className="p-3 bg-gradient-to-r from-pink-950 via-purple-950 to-amber-950 border border-amber-400 rounded-2xl text-center text-xs text-white animate-scaleUp shadow-lg">
                  🎉 Вы выиграли: <strong className="text-amber-300 text-sm block mt-0.5">{wheelResult.text}</strong>!
                </div>
              )}

              {/* Spin Buttons */}
              <div className="flex gap-2 w-full pt-1">
                <button
                  disabled={!canFreeSpin || isSpinning}
                  onClick={() => handleSpin(true)}
                  className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    canFreeSpin && !isSpinning
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canFreeSpin ? 'Бесплатный спин!' : `Бесплатно через ${formatDurationHuman(timeUntilFreeSpin)}`}
                </button>

                <button
                  disabled={gems < 5 || isSpinning}
                  onClick={() => handleSpin(false)}
                  className={`py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    gems >= 5 && !isSpinning
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>💎 5</span>
                  <span>Крутить</span>
                </button>
              </div>
            </div>
          )}

          {/* QUESTS TAB */}
          {activeSubTab === 'quests' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 mb-2">
                Выполняйте ежедневные задания для быстрого фарма монет и кристаллов:
              </div>

              {quests.map(quest => {
                const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));
                const canClaim = quest.current >= quest.target && !quest.completed;

                return (
                  <div
                    key={quest.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      quest.completed
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                        : canClaim
                          ? 'bg-slate-800 border-emerald-500/70 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-100">{quest.title}</span>
                      <span className="font-mono text-[11px] text-amber-400">
                        +{formatNumber(quest.rewardCoins)} 🪙 · +{quest.rewardGems} 💎
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {quest.current}/{quest.target}
                      </span>

                      {canClaim ? (
                        <button
                          onClick={() => {
                            sound.playCoin();
                            onClaimQuest(quest.id);
                          }}
                          className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md"
                        >
                          Забрать!
                        </button>
                      ) : quest.completed ? (
                        <span className="text-emerald-400 font-bold text-xs">✓ Готово</span>
                      ) : (
                        <span className="text-slate-500 text-xs">В процессе</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
