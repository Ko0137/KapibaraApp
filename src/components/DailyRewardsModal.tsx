import React, { useState, useEffect, useMemo } from 'react';
import { DailyQuest, DailyStreakDay } from '../types/game';
import { 
  DAILY_STREAK_REWARDS, 
  getCurrentWeeklyWheelSkin, 
  generateDailyWheelItems, 
  isHappyHourNow,
  WheelRewardItem 
} from '../data/upgrades';
import { formatNumber, formatDurationHuman } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';
import { Sparkles, Clock, Flame, Zap, Award, Check, Lock, Gift } from 'lucide-react';

const weeklySkin = getCurrentWeeklyWheelSkin();

interface DailyRewardsModalProps {
  dailyStreak: number;
  lastDailyClaimTimestamp: number;
  lastWheelSpinTimestamp: number;
  wheelSpinsToday?: number;
  claimedWheelSectorIdsToday?: string[];
  gems: number;
  playerLevel: number;
  quests: DailyQuest[];
  onClaimDaily: (streakDay: DailyStreakDay) => void;
  onSpinWheel: (reward: WheelRewardItem, costGems: number, isHappyHour: boolean) => void;
  onClaimQuest: (questId: string) => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  dailyStreak,
  lastDailyClaimTimestamp,
  lastWheelSpinTimestamp,
  wheelSpinsToday = 0,
  claimedWheelSectorIdsToday = [],
  gems,
  playerLevel,
  quests,
  onClaimDaily,
  onSpinWheel,
  onClaimQuest,
  onClose
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'streak' | 'wheel' | 'quests'>('streak');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<WheelRewardItem | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dailyWheelItems = useMemo(() => generateDailyWheelItems(todayStr, playerLevel), [todayStr, playerLevel]);

  // Happy hour state
  const [happyHourInfo, setHappyHourInfo] = useState(() => isHappyHourNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setHappyHourInfo(isHappyHourNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();
  const currentStreakDayIndex = ((dailyStreak - 1) % 7);

  // Daily Streak claim check (once every 20h)
  const canClaimDaily = now - lastDailyClaimTimestamp >= 20 * 60 * 60 * 1000;
  const timeUntilDailyClaim = Math.max(0, lastDailyClaimTimestamp + 20 * 60 * 60 * 1000 - now);

  // Time until daily reset at midnight (00:00 UTC/Local)
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const timeUntilDayReset = Math.max(0, endOfDay.getTime() - now);

  // Daily Wheel Limits: Max 3 spins per day
  const maxDailySpins = 3;
  const spinsUsed = Math.min(maxDailySpins, wheelSpinsToday);
  const spinsLeft = Math.max(0, maxDailySpins - spinsUsed);

  // Spin cost: Spin 1 = Free (0), Spin 2 = 15 gems, Spin 3 = 40 gems
  const nextSpinCost = spinsUsed === 0 ? 0 : spinsUsed === 1 ? 15 : 40;
  const canAffordNextSpin = spinsUsed === 0 || gems >= nextSpinCost;
  const isWheelLockedToday = spinsLeft <= 0;

  // Unclaimed sectors (Prevents duplicate drops on the same day!)
  const unclaimedItems = dailyWheelItems.filter(item => !claimedWheelSectorIdsToday.includes(item.id));

  // Wheel Spin Logic with No Duplicates Rule
  const handleSpin = () => {
    if (isSpinning || isWheelLockedToday) return;
    if (!canAffordNextSpin) {
      sound.playWarning();
      hapticEffects.warning();
      return;
    }

    // Available target pool: strictly items not yet claimed today
    const candidateItems = unclaimedItems.length > 0 ? unclaimedItems : dailyWheelItems;
    const winningItem = candidateItems[Math.floor(Math.random() * candidateItems.length)];
    const winningIndex = dailyWheelItems.findIndex(i => i.id === winningItem.id);

    setIsSpinning(true);
    setWheelResult(null);
    hapticEffects.feverStart();

    // Spins 6-9 full rotations + exact target angle
    const sliceCount = dailyWheelItems.length;
    const sliceAngle = 360 / sliceCount;
    const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = fullSpins + (360 - (winningIndex * sliceAngle + sliceAngle / 2));

    setWheelRotation(prev => prev + targetAngle);

    const tickInterval = setInterval(() => {
      sound.playWheelTick();
    }, 170);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWheelResult(winningItem);
      sound.playComboSuccess();
      hapticEffects.purchase();

      onSpinWheel(winningItem, nextSpinCost, happyHourInfo.active);
    }, 3600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Бонусы и Награды</h2>
              <p className="text-[11px] text-zinc-400">Ежедневные призы и Колесо Фортуны</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 my-3 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveSubTab('streak');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'streak'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📅 7 Дней
          </button>
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveSubTab('wheel');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'wheel'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎡 Колесо ({spinsLeft}/3)
          </button>
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveSubTab('quests');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'quests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📜 Квесты ({quests.filter(q => q.completed).length}/{quests.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          
          {/* TAB 1: 7-DAY STREAK */}
          {activeSubTab === 'streak' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-amber-400 font-bold block">Ваша серия входов: {dailyStreak} дней!</span>
                  <span className="text-zinc-400">Заходите каждый день, чтобы забрать Главный Сундук!</span>
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
                          ? 'bg-zinc-800 border-amber-500 shadow-md shadow-amber-500/20'
                          : isPast
                            ? 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
                            : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-zinc-300">День {item.day}</span>
                        {isPast && <span className="text-emerald-400 text-xs font-bold">✓ Забрано</span>}
                        {isCurrentDay && <span className="text-amber-400 text-xs font-bold">СЕГОДНЯ</span>}
                        {isFuture && <span className="text-zinc-500 text-xs">🔒</span>}
                      </div>

                      <div className="font-mono text-xs font-bold text-zinc-100 my-1">
                        {item.rewardText}
                      </div>

                      {isCurrentDay && (
                        <button
                          disabled={!canClaimDaily}
                          onClick={() => {
                            sound.playCoin();
                            onClaimDaily(item);
                          }}
                          className={`mt-2 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            canClaimDaily
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-md shadow-amber-500/30 hover:brightness-110 active:scale-95'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
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

          {/* TAB 2: LUCKY WHEEL (REDESIGNED: DAILY RANDOM SECTORS + 3 SPINS/DAY + NO DUPLICATES + HAPPY HOUR) */}
          {activeSubTab === 'wheel' && (
            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              
              {/* Happy Hour Active Banner */}
              {happyHourInfo.active ? (
                <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-amber-500/20 border border-amber-400 flex items-center justify-between text-xs shadow-lg animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-amber-300 text-[11px]">{happyHourInfo.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-300">
                    Осталось: {formatDurationHuman(happyHourInfo.timeRemainingMs)}
                  </span>
                </div>
              ) : (
                <div className="w-full p-2 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Счастливые часы: 08:00-11:00 и 19:00-23:00</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    Через {formatDurationHuman(happyHourInfo.timeRemainingMs)}
                  </span>
                </div>
              )}

              {/* Daily Limit & No Duplicates Status Badge */}
              <div className="flex items-center justify-between w-full px-1 text-xs">
                <span className="text-zinc-400 font-bold flex items-center gap-1">
                  <span>Попыток сегодня:</span>
                  <strong className={spinsLeft > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {spinsLeft} из 3
                  </strong>
                </span>
                <span className="text-[10px] text-amber-400 font-mono bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                  🔒 Без повторных призов
                </span>
              </div>

              {/* 12-Segment Rotating Wheel */}
              <div className="relative w-64 h-64 flex items-center justify-center my-1">
                {/* Top Pointer Arrow */}
                <div className="absolute -top-3 z-30 text-3xl text-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.9)] animate-bounce">
                  ▼
                </div>

                {/* Rotating Wheel Circle */}
                <div
                  className={`w-60 h-60 rounded-full border-4 shadow-2xl overflow-hidden relative transition-transform duration-3000 ease-out ${
                    happyHourInfo.active ? 'border-amber-400 shadow-amber-500/40' : 'border-zinc-700 shadow-purple-500/20'
                  }`}
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: isSpinning ? '3.6s' : '0s'
                  }}
                >
                  {dailyWheelItems.map((item, idx) => {
                    const sliceAngle = 360 / dailyWheelItems.length;
                    const angle = sliceAngle * idx;
                    const isClaimedToday = claimedWheelSectorIdsToday.includes(item.id);

                    return (
                      <div
                        key={item.id + idx}
                        className={`absolute w-full h-full top-0 left-0 flex items-start justify-center pt-1 text-center transition-opacity ${
                          isClaimedToday ? 'opacity-35 grayscale' : 'opacity-100'
                        }`}
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '50% 50%',
                        }}
                      >
                        <div
                          className="px-1 py-0.5 rounded text-[8px] font-black text-white max-w-[76px] truncate shadow-md border border-white/20"
                          style={{ backgroundColor: isClaimedToday ? '#3f3f46' : item.color }}
                        >
                          {isClaimedToday ? '✓ ВЫБИТО' : item.text}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Wheel Center Core Button */}
                  <div className="absolute inset-0 m-auto w-14 h-14 bg-zinc-950 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center font-black text-[10px] text-amber-300 shadow-xl z-20">
                    <span>🎡</span>
                    <span className="text-[7px] text-white tracking-widest uppercase">SPIN</span>
                  </div>
                </div>
              </div>

              {/* Wheel Result Toast */}
              {wheelResult && (
                <div className="p-3 bg-gradient-to-r from-pink-950 via-purple-950 to-amber-950 border border-amber-400 rounded-2xl text-center text-xs text-white animate-scaleUp shadow-lg w-full">
                  🎉 Вы выиграли: <strong className="text-amber-300 text-sm block mt-0.5">{wheelResult.text}</strong>!
                </div>
              )}

              {/* Action Spin Button or Daily Locked State */}
              <div className="w-full pt-1">
                {isWheelLockedToday ? (
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
                    <span className="text-xs font-black text-zinc-300 block">
                      🔒 Все 3 вращения на сегодня использованы!
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono block">
                      Новые призы и попытки через: {formatDurationHuman(timeUntilDayReset)}
                    </span>
                  </div>
                ) : (
                  <button
                    disabled={isSpinning || !canAffordNextSpin}
                    onClick={handleSpin}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer ${
                      spinsUsed === 0
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 shadow-emerald-500/30 hover:brightness-110'
                        : canAffordNextSpin
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-pink-600/30 hover:brightness-110'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <span>🎡</span>
                    {spinsUsed === 0 ? (
                      <span>КРУТИТЬ БЕСПЛАТНО! (1/3)</span>
                    ) : (
                      <span>КРУТИТЬ ЗА 💎 {nextSpinCost} ({spinsUsed + 1}/3)</span>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: DAILY QUESTS */}
          {activeSubTab === 'quests' && (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 mb-2">
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
                        ? 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
                        : canClaim
                          ? 'bg-zinc-800 border-emerald-500/70 shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-zinc-100">{quest.title}</span>
                      <span className="font-mono text-[11px] text-amber-400">
                        +{formatNumber(quest.rewardCoins)} 🪙 · +{quest.rewardGems} 💎
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-zinc-950 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {quest.current}/{quest.target}
                      </span>

                      {canClaim ? (
                        <button
                          onClick={() => {
                            sound.playCoin();
                            onClaimQuest(quest.id);
                          }}
                          className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
                        >
                          Забрать!
                        </button>
                      ) : quest.completed ? (
                        <span className="text-emerald-400 font-bold text-xs">✓ Готово</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">В процессе</span>
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
