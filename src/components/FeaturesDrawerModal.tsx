import React from 'react';
import {
  Trophy,
  Gift,
  Shirt,
  Sparkles,
  Map,
  Cloud,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { hapticEffects } from '../utils/haptics';

interface FeaturesDrawerModalProps {
  onClose: () => void;
  onOpenModal: (modal: any) => void;
  hasClaimableRewards: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  playerLevel: number;
  totalTaps: number;
  totalCoinsEarned: number;
  isTelegram?: boolean;
}

export const FeaturesDrawerModal: React.FC<FeaturesDrawerModalProps> = ({
  onClose,
  onOpenModal,
  hasClaimableRewards,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  playerLevel,
  totalTaps,
  totalCoinsEarned,
  isTelegram = false,
}) => {
  const handleSelect = (modalName: string) => {
    hapticEffects.tap();
    onClose();
    onOpenModal(modalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>🎮</span> Все разделы и настройки
            </h2>
            <p className="text-xs text-zinc-400">Быстрый доступ ко всем функциям игры</p>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Mini Stats */}
        <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center text-xs">
          <div>
            <span className="text-zinc-500 text-[10px] block">Уровень</span>
            <span className="font-extrabold text-amber-400 text-sm">{playerLevel} / 165</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block">Всего кликов</span>
            <span className="font-extrabold text-white text-sm">{totalTaps}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block">Защита</span>
            <span className="font-bold text-emerald-400 text-xs flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Fair Play
            </span>
          </div>
        </div>

        {/* Feature Tiles Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-0.5 custom-scrollbar pb-2">
          {/* PvP Deal Arena */}
          <button
            onClick={() => handleSelect('deal')}
            className="p-3 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <span className="text-xl">⚔️</span>
            </div>
            <div>
              <div className="font-extrabold text-xs text-rose-300">Сделка Века</div>
              <div className="text-[10px] text-zinc-400">PvP Дуэль пальцами</div>
            </div>
          </button>

          {/* Hero Capybara Room */}
          <button
            onClick={() => handleSelect('character')}
            className="p-3 bg-amber-950/30 hover:bg-amber-900/30 border border-amber-500/40 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
              <span className="text-xl">🦫</span>
            </div>
            <div>
              <div className="font-extrabold text-xs text-amber-300">Капибарыч</div>
              <div className="text-[10px] text-zinc-400">Скины, шапки & ауры</div>
            </div>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => handleSelect('leaderboard')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Лидерборд</div>
              <div className="text-[10px] text-zinc-400">Firebase ТОП-50</div>
            </div>
          </button>

          {/* Daily Rewards */}
          <button
            onClick={() => handleSelect('rewards')}
            className="relative p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Награды</div>
              <div className="text-[10px] text-zinc-400">Стрик и Колесо</div>
            </div>
            {hasClaimableRewards && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          {/* Memes & Achievements */}
          <button
            onClick={() => handleSelect('achievements')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Мемотека</div>
              <div className="text-[10px] text-zinc-400">Цитаты и 💎</div>
            </div>
          </button>

          {/* Levels 165 Map */}
          <button
            onClick={() => handleSelect('levels')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">165 Уровней</div>
              <div className="text-[10px] text-zinc-400">Боссы и эпохи</div>
            </div>
          </button>

          {/* Cloud Save */}
          <button
            onClick={() => handleSelect('cloud')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Облако</div>
              <div className="text-[10px] text-zinc-400">
                {isTelegram ? (
                  <span className="text-emerald-400 font-semibold">Автосохранение ✓</span>
                ) : (
                  'Cloud ID & Резерв'
                )}
              </div>
            </div>
          </button>

          {/* Energy & Boosts */}
          <button
            onClick={() => handleSelect('energy_boost')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Энергия & Бусты</div>
              <div className="text-[10px] text-zinc-400">Лимиты в день</div>
            </div>
          </button>

          {/* Perks & Mastery Tree */}
          <button
            onClick={() => handleSelect('perks')}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Древо Перков</div>
              <div className="text-[10px] text-zinc-400">Таланты за уровни</div>
            </div>
          </button>

          {/* Sound Toggle Tile */}
          <button
            onClick={() => {
              hapticEffects.tap();
              onToggleSound();
            }}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Звуки</div>
              <div className="text-[10px] text-zinc-400">{soundEnabled ? 'Включены' : 'Выключены'}</div>
            </div>
          </button>

          {/* Haptics Toggle Tile */}
          <button
            onClick={() => {
              onToggleHaptics();
            }}
            className="p-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 rounded-2xl flex items-center gap-3 text-left transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
              <Smartphone className={`w-5 h-5 ${hapticsEnabled ? 'text-cyan-400' : 'text-zinc-500'}`} />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white">Вибрация</div>
              <div className="text-[10px] text-zinc-400">{hapticsEnabled ? 'Активна' : 'Отключена'}</div>
            </div>
          </button>

          {/* Telegram Mode Badge */}
          <div className="p-3 bg-sky-950/40 border border-sky-600/40 rounded-2xl flex items-center gap-2.5 text-sky-300">
            <span className="text-xl">✈️</span>
            <div>
              <div className="font-extrabold text-xs">Telegram Game</div>
              <div className="text-[10px] text-sky-400/80">TMA Ready</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
