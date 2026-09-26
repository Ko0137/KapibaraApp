import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GameLevel, FloatingNumber, CharacterSkin, CharacterHat, LossDebuff, CustomCapybaraConfig } from '../types/game';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { computeCharacterComposite, getCompositeAvatarDisplay } from '../utils/characterComposite';
import { CharacterFighterVisual } from './CharacterFighterVisual';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';
import { antiCheat } from '../utils/antiCheat';
import { Zap, ShieldAlert, Rocket, MessageCircle, Lock, Sparkles, Swords, Crown, Award, Skull, AlertCircle } from 'lucide-react';

interface AdsgramAdController {
  show: () => Promise<{ done: boolean; description: string }>;
}

declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean }) => AdsgramAdController;
    };
  }
}

interface MainTapperProps {
  onAddCoins?: (amount: number) => void;
  onShowNotification?: (title: string, message: string, type: 'success' | 'info' | 'level' | 'achievement' | 'neuromuscular' | 'telegram', icon?: string) => void;
  currentLevel: GameLevel;
  currentClicks: number;
  tapPower: number;
  critChance: number;
  critMultiplier: number;
  idleIncomePerSec: number;
  profitPerHour: number;
  totalMultiplier: number;
  isFeverActive: boolean;
  feverGauge: number; // 0 to 100
  goldenTapChance?: number;
  energy: number;
  maxEnergy: number;
  activeSkin?: CharacterSkin;
  overlaySkin?: CharacterSkin;
  activeHat?: CharacterHat;
  customConfig?: CustomCapybaraConfig;
  perks?: Record<string, number>;
  lossDebuff?: LossDebuff | null;
  immortalUnlocked?: boolean;
  isNeuromuscularActive?: boolean;
  neuromuscularCooldown?: number;
  onTriggerNeuromuscular?: () => void;
  onOpenLeaderboard?: () => void;
  onTap: (amount: number, isCrit: boolean) => void;
  onStartBoss: () => void;
  onOpenEnergyBoost: () => void;
  onOpenCharacterModal?: () => void;
  onOpenDealModal?: () => void;
}

const MEME_PHRASES = [
  'Капибара познала дзен и не парится 🦫',
  'Барон Капибарыч готовит Сделку Века! 💼',
  'Юдзу на макушке заряжает энергией 🍊',
  'В онсэне вода горячая, монеты сыпятся ♨️',
  'Капибара никогда не суетится 🧘',
  'Сделка недели на кону — готовь пальчики! ⚔️',
  'Шлёпа передаёт привет Капибарычу 🥟',
  'Не жми так сильно, шерсть помнёшь! 🦫',
  'Свидетель из Фрязино уважает Капибару 🧥',
  'Капибара-шейх скупает небоскрёбы 🇦🇪',
  'Автокликеры в Сделках не пройдут! 🥊',
  'Чиназес! Сюда эти монеты! 🥩',
  'Бархатные тяги для сверхбыстрого тапа 👟',
  'Пальцы горят, а Капибарыч богатеет 🚀',
  'Инвестировал в бассейн с мандаринами 🍊',
  'Листинг уже в следующую среду (зуб даю) ⏳',
  'Таксист сказал Капибаракоин взлетит до $500 🚕',
  'Спокоен как капибара при падении биткоина 📉',
  'Главное в жизни — чилл и 5 миллионов коинов 🏖️',
];

export const MainTapper: React.FC<MainTapperProps> = ({
  onAddCoins,
  onShowNotification,
  currentLevel,
  currentClicks,
  tapPower,
  critChance,
  critMultiplier,
  idleIncomePerSec,
  profitPerHour,
  totalMultiplier,
  isFeverActive,
  feverGauge,
  goldenTapChance = 0,
  energy,
  maxEnergy,
  activeSkin,
  overlaySkin,
  activeHat,
  customConfig,
  perks = {},
  lossDebuff = null,
  immortalUnlocked = false,
  isNeuromuscularActive = false,
  neuromuscularCooldown = 0,
  onTriggerNeuromuscular,
  onOpenLeaderboard,
  onTap,
  onStartBoss,
  onOpenEnergyBoost,
  onOpenCharacterModal,
  onOpenDealModal,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);
  const [memeQuote, setMemeQuote] = useState<string>('Капибара познала дзен и не парится 🦫');

  // Adsgram state & hooks
  const [adsgramLoaded, setAdsgramLoaded] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  useEffect(() => {
    // 1. If Adsgram is already loaded globally, mark as loaded
    if (window.Adsgram) {
      setAdsgramLoaded(true);
      return;
    }

    // 2. Load the script dynamically to avoid SSR/Vite compilation issues
    const script = document.createElement('script');
    script.src = 'https://sad.adsgram.ai/js/sad.min.js';
    script.async = true;
    script.onload = () => {
      setAdsgramLoaded(true);
    };
    script.onerror = () => {
      console.warn('Failed to dynamically load Adsgram SDK script.');
    };

    document.head.appendChild(script);
  }, []);

  const handleWatchAd = () => {
    if (!adsgramLoaded || !window.Adsgram) {
      if (onShowNotification) {
        onShowNotification(
          '📺 Реклама не готова',
          'Рекламный блок Adsgram загружается. Пожалуйста, подождите секунду и нажмите снова!',
          'info',
          '⏳'
        );
      } else {
        alert('Рекламный блок Adsgram еще загружается. Пожалуйста, подождите секунду.');
      }
      return;
    }

    setAdLoading(true);

    try {
      const adController = window.Adsgram.init({ blockId: '50138' });
      adController
        .show()
        .then(() => {
          setAdLoading(false);
          // Reward: +5000 coins
          if (onAddCoins) {
            onAddCoins(5000);
          }
          if (onShowNotification) {
            onShowNotification(
              '🎬 Награда начислена!',
              'Вы успешно посмотрели рекламу и получили +5,000 🪙!',
              'success',
              '💎'
            );
          }
          sound.playComboSuccess();
        })
        .catch((err) => {
          setAdLoading(false);
          const errorMsg = err && typeof err === 'object' && 'description' in err 
            ? String(err.description) 
            : 'Просмотр рекламы был закрыт или отменен.';
          if (onShowNotification) {
            onShowNotification(
              '❌ Реклама прервана',
              errorMsg,
              'info',
              '📺'
            );
          }
        });
    } catch (e) {
      setAdLoading(false);
      console.error('Adsgram initialization error:', e);
      if (onShowNotification) {
        onShowNotification(
          '❌ Ошибка инициализации',
          'Произошла ошибка при запуске рекламы.',
          'info',
          '⚠️'
        );
      }
    }
  };

  const nextFloatingId = useRef(0);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);

  // Resolved skin & hat
  const resolvedSkin = activeSkin || CHARACTER_SKINS[0];
  const resolvedHat = activeHat || CHARACTER_HATS[0];

  // Dynamic Soulslike character stats and visuals
  const compositeStats = computeCharacterComposite(
    resolvedSkin, 
    resolvedHat, 
    perks, 
    currentLevel.level,
    immortalUnlocked
  );
  const compositeDisplay = getCompositeAvatarDisplay(resolvedSkin, resolvedHat, compositeStats);

  // Dynamic visual aura from unlocked perks
  const hasDealFire = (perks['perk_deal_fury'] || 0) > 0;
  const hasGold = (perks['perk_sheikh_wealth'] || 0) > 0 || (perks['perk_golden_tap'] || 0) > 0;
  const hasLightning = (perks['perk_lightning_fingers'] || 0) > 0;
  const hasCyber = (perks['perk_overclock'] || 0) > 0;

  let auraBorder = 'border-amber-400/90 shadow-amber-500/20';
  let auraGlow = 'from-amber-500/15 to-yellow-500/10';

  if (hasDealFire || compositeStats.activeAura === 'deal_fire') {
    auraBorder = 'border-rose-500 shadow-rose-500/40 ring-4 ring-rose-500/20';
    auraGlow = 'from-red-600/30 to-amber-500/20';
  } else if (hasGold || compositeStats.activeAura === 'gold') {
    auraBorder = 'border-yellow-300 shadow-yellow-400/40 ring-4 ring-yellow-400/30';
    auraGlow = 'from-yellow-500/30 to-amber-400/15';
  } else if (hasLightning || compositeStats.activeAura === 'lightning') {
    auraBorder = 'border-cyan-400 shadow-cyan-400/30 ring-4 ring-cyan-400/20';
    auraGlow = 'from-cyan-500/25 to-blue-500/15';
  } else if (hasCyber) {
    auraBorder = 'border-purple-400 shadow-purple-500/30 ring-4 ring-purple-500/20';
    auraGlow = 'from-purple-500/25 to-pink-500/15';
  } else if (compositeStats.activeAura === 'magic') {
    auraBorder = 'border-indigo-400 shadow-indigo-500/30 ring-4 ring-indigo-500/20';
    auraGlow = 'from-indigo-500/25 to-purple-500/15';
  }

  // Rotate meme quote every 6 seconds smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      const random = MEME_PHRASES[Math.floor(Math.random() * MEME_PHRASES.length)];
      setMemeQuote(random);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const addFloatingNumber = useCallback((x: number, y: number, text: string, isCrit: boolean) => {
    const id = ++nextFloatingId.current;
    const offsetX = x + (Math.random() * 20 - 10);
    const offsetY = y + (Math.random() * 14 - 7);

    setFloatingNumbers((prev) => [
      ...prev.slice(-18),
      { id, x: offsetX, y: offsetY, text, isCrit, isFever: isFeverActive },
    ]);

    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((item) => item.id !== id));
    }, 650);
  }, [isFeverActive]);

  // Main Tap handler - completely stable, strictly bounded
  const handleTap = (clientX: number, clientY: number, containerRect: any, isTrusted: boolean = true) => {
    // 1. Strict Energy Limit Check
    if (energy <= 0) {
      sound.playCoin();
      hapticEffects.warning();
      setAntiCheatWarning('⚡ Энергия закончилась! Отдохни или жми Буст!');
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setAntiCheatWarning(null), 1800);
      return;
    }

    // 2. Anti-cheat check
    const validation = antiCheat.registerTap(isTrusted);
    if (!validation.allowed) {
      sound.playError();
      hapticEffects.warning();
      setAntiCheatWarning(validation.warning || 'Защита от автокликера активна');
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setAntiCheatWarning(null), 2000);
      return;
    }

    // 3. Roll Critical hit
    const isCrit = Math.random() < critChance;
    let earned = tapPower * totalMultiplier;
    if (isCrit) {
      earned *= critMultiplier;
    }
    if (isFeverActive) {
      earned *= 5; // 5x during Fever
    }
    if (isNeuromuscularActive) {
      earned *= 5; // 5x during Neuromuscular Impulse Mode!
    }

    // Roll Golden Tap chance (gives 10x instant burst)
    const isGoldenTap = goldenTapChance > 0 && Math.random() < goldenTapChance;
    if (isGoldenTap) {
      earned *= 10;
    }

    earned = Math.max(1, Math.round(earned));

    // Audio & Haptics feedback
    // sound.playTap(isCrit, isFeverActive || !!isNeuromuscularActive);
    if (isCrit || isNeuromuscularActive) {
      hapticEffects.crit();
    } else {
      hapticEffects.tap();
    }

    // Trigger parent tap
    onTap(earned, isCrit);

    // Floating text feedback centered inside button
    const rectLeft = containerRect && typeof containerRect.left === 'number' ? containerRect.left : 0;
    const rectTop = containerRect && typeof containerRect.top === 'number' ? containerRect.top : 0;
    const relativeX = clientX - rectLeft;
    const relativeY = clientY - rectTop;
    const textLabel = isNeuromuscularActive
      ? `⚡ +${formatNumber(earned)} (НЕЙРО-ТАП x5!)`
      : isGoldenTap
      ? `🌟 +${formatNumber(earned)} (x10 ЗОЛОТОЙ ТАП!)`
      : isCrit
      ? `💥 +${formatNumber(earned)} (КРИТ x${critMultiplier}!)`
      : `+${formatNumber(earned)}`;

    addFloatingNumber(relativeX, relativeY, textLabel, isCrit || isGoldenTap);

    // Periodic meme quote on tap count
    tapCountRef.current += 1;
    if (tapCountRef.current % 35 === 0) {
      const random = MEME_PHRASES[Math.floor(Math.random() * MEME_PHRASES.length)];
      setMemeQuote(random);
    }
  };

  // Pointer & Touch handlers strictly bound
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPressed(true);
    const target = e.currentTarget as HTMLElement | SVGElement;
    let rect = { left: 0, top: 0, width: 224, height: 224 };
    if (target && 'getBoundingClientRect' in target && typeof target.getBoundingClientRect === 'function') {
      try {
        rect = target.getBoundingClientRect();
      } catch (err) {
        console.warn('Failed to getBoundingClientRect on pointer down:', err);
      }
    }
    handleTap(e.clientX, e.clientY, rect, e.isTrusted);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Multi-touch support for legitimate fast finger taps
    const target = e.currentTarget as HTMLElement | SVGElement;
    let rect = { left: 0, top: 0, width: 224, height: 224 };
    if (target && 'getBoundingClientRect' in target && typeof target.getBoundingClientRect === 'function') {
      try {
        rect = target.getBoundingClientRect();
      } catch (err) {
        console.warn('Failed to getBoundingClientRect on touch start:', err);
      }
    }
    Array.from(e.changedTouches).forEach((touch) => {
      handleTap(touch.clientX, touch.clientY, rect, true);
    });
    setIsPressed(true);
  };

  const isOutOfEnergy = energy <= 0;
  const levelProgress = Math.min(100, Math.round((currentClicks / currentLevel.clicksRequired) * 100));

  const isDebuffActive = lossDebuff && lossDebuff.expiresAt > Date.now();
  const debuffSecondsLeft = isDebuffActive ? Math.max(0, Math.round((lossDebuff.expiresAt - Date.now()) / 1000)) : 0;
  const debuffMins = Math.floor(debuffSecondsLeft / 60);
  const debuffSecs = debuffSecondsLeft % 60;

  return (
    <div className="flex flex-col items-center justify-between flex-1 w-full max-w-md mx-auto px-4 py-2 select-none">
      
      {/* Top Banner: Soulslike Archetype & Hero Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-1 mb-1">
        <button
          onClick={onOpenCharacterModal}
          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 shadow-sm hover:border-amber-400 transition-all active:scale-95 max-w-[145px] sm:max-w-[170px] min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-base shrink-0">
            {overlaySkin && overlaySkin.id !== resolvedSkin.id ? `${resolvedSkin.icon}${overlaySkin.icon}` : compositeDisplay.bodyIcon}
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-[8px] font-black uppercase text-amber-400 truncate">
              {compositeStats.archetypeTitle}
            </div>
            <div className="text-[10px] font-extrabold text-white leading-none truncate mt-0.5">
              {resolvedSkin.name}
            </div>
            {overlaySkin && overlaySkin.id !== resolvedSkin.id && (
              <div className="text-[8px] font-bold text-purple-300 leading-none truncate mt-0.5">
                ✨ +{overlaySkin.name}
              </div>
            )}
          </div>
        </button>

        {/* Quick Action Buttons: Leaderboard, Neuromuscular Tap, Deal Arena */}
        <div className="flex items-center gap-1.5">
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="p-2 rounded-2xl bg-zinc-900/90 border border-amber-500/40 text-amber-300 hover:text-amber-200 active:scale-95 transition-all shadow-sm"
              title="Таблица Рекордов"
            >
              <Award className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {onTriggerNeuromuscular && (
            <button
              type="button"
              onClick={onTriggerNeuromuscular}
              disabled={!!neuromuscularCooldown && neuromuscularCooldown > 0}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border text-xs font-black transition-all active:scale-95 ${
                isNeuromuscularActive
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-400/50 shadow-lg shadow-rose-600/40'
                  : neuromuscularCooldown && neuromuscularCooldown > 0
                  ? 'bg-zinc-800 text-zinc-500 border-zinc-700 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500 text-black border-amber-300 shadow-md shadow-rose-500/20'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isNeuromuscularActive ? 'animate-bounce text-white' : 'text-black'}`} />
              <span>
                {isNeuromuscularActive
                  ? 'НЕЙРО-ТАП x5!'
                  : neuromuscularCooldown && neuromuscularCooldown > 0
                  ? `${neuromuscularCooldown}с`
                  : '⚡ Нейро-Тап'}
              </span>
            </button>
          )}

          {onOpenDealModal && (
            <button
              type="button"
              onClick={onOpenDealModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/50 text-rose-300 text-xs font-black shadow-md active:scale-95 transition-all"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Сделка</span>
            </button>
          )}
        </div>
      </div>

      {/* Loss Debuff Banner if Active */}
      {isDebuffActive && (
        <div className="w-full mb-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center justify-between text-xs text-red-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-sm">📉</span>
            <div>
              <span className="font-black text-red-300 block">{lossDebuff.name}</span>
              <span className="text-[10px] text-red-400 font-bold">
                -{Math.round(lossDebuff.percent * 100)}% к доходу (Осталось {debuffMins}:{debuffSecs < 10 ? `0${debuffSecs}` : debuffSecs})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Level & Boss Header Box */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 shadow-md mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">
              Уровень {currentLevel.level}: {currentLevel.name}
            </span>
            {currentLevel.tier === 'immortal' && (
              <span className="text-[9px] font-black bg-purple-900 text-purple-200 border border-purple-500/60 px-1.5 py-0.2 rounded">
                IMMORTAL
              </span>
            )}
            {currentLevel.tier === 'divine' && (
              <span className="text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.2 rounded">
                DIVINE
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-zinc-400">
            {currentLevel.isBoss ? '⚠️ БОСС РЕЙД' : `${levelProgress}%`}
          </span>
        </div>

        {/* Level progress bar or boss banner */}
        {!currentLevel.isBoss ? (
          <div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 relative overflow-hidden shadow-lg ${
                  currentLevel.tier === 'immortal'
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-purple-500/50'
                    : currentLevel.tier === 'divine'
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 shadow-amber-400/50'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-amber-500/30'
                }`}
                style={{ width: `${levelProgress}%` }}
              >
                {/* Animated shimmer ray sweep across progress fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                {/* Glowing edge light dot at current progress head */}
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white rounded-full blur-[1px] animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5 font-mono">
              <span>{formatNumber(currentClicks)} тапов</span>
              <span>Цель: {formatNumber(currentLevel.clicksRequired)}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartBoss}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-xs shadow-md shadow-red-600/30 active:scale-95 transition-transform flex items-center justify-center gap-1.5 animate-pulse"
          >
            <span>⚔️</span>
            <span>БИТВА С БОССОМ #{currentLevel.level}</span>
            <span>⚔️</span>
          </button>
        )}
      </div>

      {/* Fever Bar */}
      <div className="w-full px-1 mb-2">
        <div className="flex items-center justify-between text-[11px] mb-0.5 font-bold">
          <span className={isFeverActive ? 'text-pink-400 animate-pulse' : 'text-zinc-400'}>
            🔥 {isFeverActive ? 'ЛИХОРАДКА: x5 ДОХОД!' : 'Шкала Ярости'}
          </span>
          <span className="text-amber-400 font-mono text-[10px]">
            {isFeverActive ? 'АКТИВНА' : `${feverGauge}%`}
          </span>
        </div>
        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className={`h-full transition-all duration-100 rounded-full ${
              isFeverActive
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-orange-500 to-amber-400'
            }`}
            style={{ width: `${isFeverActive ? 100 : feverGauge}%` }}
          />
        </div>
      </div>

      {/* MAIN TAPPER CIRCLE: Composite Layering (Capybara + Wings + Mutation + Hat + Weapon + Aura) */}
      <div className="relative flex items-center justify-center w-64 h-64 my-1 select-none">
        
        {/* Divine/Immortal Wings behind */}
        {compositeDisplay.wingsIcon && (
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none text-4xl opacity-85 z-0">
            <span className="animate-bounce -translate-x-6 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
              {compositeDisplay.wingsIcon}
            </span>
            <span className="animate-bounce translate-x-6 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
              {compositeDisplay.wingsIcon}
            </span>
          </div>
        )}

        {/* Subtle Static Glow Behind Button (reflects unlocked Skill Tree aura!) */}
        <div
          className={`absolute inset-4 rounded-full pointer-events-none transition-all duration-300 ${
            isFeverActive
              ? 'bg-gradient-to-tr from-pink-500/25 to-amber-500/25 blur-xl opacity-100'
              : `bg-gradient-to-tr ${auraGlow} blur-lg opacity-80`
          }`}
        />

        {/* The Clickable Button Circle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handlePointerUp}
          className={`relative flex items-center justify-center w-56 h-56 rounded-full cursor-pointer touch-none select-none transition-transform duration-75 active:scale-95 shadow-2xl border-4 ${
            isOutOfEnergy
              ? 'border-zinc-700 bg-zinc-900 opacity-60 cursor-not-allowed'
              : isFeverActive
              ? 'border-pink-400 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-pink-500/30'
              : `${auraBorder} bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950`
          }`}
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* Inner Golden Rim */}
          <div className="absolute inset-2 rounded-full border-2 border-amber-500/20 pointer-events-none" />

          {/* Halo / Cosmic Ring */}
          {compositeDisplay.haloIcon && (
            <div className="absolute -top-5 inset-x-0 flex justify-center text-3xl animate-spin-slow pointer-events-none drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
              {compositeDisplay.haloIcon}
            </div>
          )}

          {/* Magic Arcane Orbiting Runes */}
          {compositeDisplay.magicIcon && (
            <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-spin-slow pointer-events-none flex items-center justify-between p-1 z-10">
              <span className="text-xs">✦</span>
              <span className="text-xs">✦</span>
            </div>
          )}

          {/* Lightning Sparks for DEX Mutation */}
          {compositeDisplay.lightningIcon && (
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none text-base text-cyan-300 animate-pulse z-20">
              <span className="animate-ping">⚡</span>
              <span className="animate-ping delay-100">⚡</span>
            </div>
          )}

          {/* Equipped Hat Overlay */}
          {compositeDisplay.hatIcon && (
            <span className="absolute -top-4 text-3xl filter drop-shadow z-20 pointer-events-none animate-bounce" style={{ animationDuration: '3s' }}>
              {compositeDisplay.hatIcon}
            </span>
          )}

          {/* Muscle Bulge Overlay */}
          {compositeDisplay.muscleIcon && (
            <span className="absolute bottom-6 right-6 text-xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20 pointer-events-none animate-pulse">
              {compositeDisplay.muscleIcon}
            </span>
          )}

          {/* Armor Plating Overlay */}
          {compositeDisplay.armorIcon && (
            <span className="absolute bottom-6 left-6 text-sm bg-zinc-900/80 border border-amber-500/60 rounded-full p-0.5 z-20 pointer-events-none drop-shadow-md">
              {compositeDisplay.armorIcon}
            </span>
          )}

          {/* Weapon in Hand Overlay */}
          {compositeDisplay.weaponIcon && (
            <span className="absolute -bottom-2 -left-2 text-2xl bg-zinc-950/80 rounded-xl p-1 border border-amber-500/60 shadow-lg z-20 pointer-events-none animate-pulse">
              {compositeDisplay.weaponIcon}
            </span>
          )}

          {/* Internal Character Avatar - Dynamic Capybara Hero Visual */}
          <div className="flex flex-col items-center justify-center pointer-events-none z-10">
            <div className={`transition-transform duration-75 ${isPressed ? 'scale-90 rotate-2' : 'scale-100'}`}>
              <CharacterFighterVisual
                skin={resolvedSkin}
                overlaySkin={overlaySkin}
                hat={resolvedHat}
                stats={compositeStats}
                customConfig={customConfig}
                size="md"
                showStatsBadge={false}
                showMutationBadges={false}
              />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 mt-0.5 drop-shadow-md">
              {isOutOfEnergy
                ? 'НЕТ ЭНЕРГИИ ⚡'
                : isFeverActive
                ? '⚡ МЕГА-ТАП! ⚡'
                : overlaySkin && overlaySkin.id !== resolvedSkin.id
                ? `⚡ ФУЗИЯ: ${resolvedSkin.name} + ${overlaySkin.name} ⚡`
                : 'ТАПАЙ!'}
            </span>
          </div>

          {/* Out of energy lock icon overlay */}
          {isOutOfEnergy && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center pointer-events-none">
              <Lock className="w-8 h-8 text-amber-400 mb-1" />
              <span className="text-[10px] font-extrabold text-amber-300 uppercase">Жди или Буст</span>
            </div>
          )}

          {/* Floating score damage items */}
          {floatingNumbers.map((fn) => (
            <div
              key={fn.id}
              className={`absolute pointer-events-none font-black text-lg animate-float-num whitespace-nowrap drop-shadow-md z-30 ${
                fn.isCrit ? 'text-yellow-300 text-xl font-extrabold' : 'text-amber-200'
              }`}
              style={{
                left: `${fn.x}px`,
                top: `${fn.y}px`,
              }}
            >
              {fn.text}
            </div>
          ))}
        </div>
      </div>

      {/* Anti-cheat warning alert banner */}
      {antiCheatWarning && (
        <div className="w-full my-1 bg-red-950/90 border border-red-500/60 rounded-xl px-3 py-1.5 text-center text-xs font-bold text-red-300 flex items-center justify-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{antiCheatWarning}</span>
        </div>
      )}

      {/* Meme Phrase Quote Box */}
      <div className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-2 my-1 text-center text-xs text-amber-200/90 font-medium flex items-center justify-center gap-1.5 shadow-inner">
        <MessageCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate italic">"{memeQuote}"</span>
      </div>

      {/* Adsgram Rewarded Ad Banner Button */}
      <div className="w-full my-1">
        <button
          onClick={handleWatchAd}
          disabled={adLoading}
          className={`w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs shadow-md border border-purple-400/30 flex items-center justify-between gap-2 active:scale-95 transition-all relative overflow-hidden ${
            adLoading ? 'opacity-80 cursor-wait' : 'hover:brightness-110'
          }`}
        >
          {/* Shimmer loading ray overlay if active */}
          {adLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0 animate-pulse">🎬</span>
            <div className="text-left">
              <span className="block font-black tracking-wide uppercase text-[10px] text-yellow-300">
                Бесплатные Монеты
              </span>
              <span className="text-[11px] text-zinc-100 font-bold">
                {adLoading ? 'Загрузка видео...' : 'Смотреть рекламу за награду'}
              </span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/20 px-2.5 py-1 rounded-xl text-yellow-300 font-bold font-mono text-[11px] shrink-0 flex items-center gap-1">
            <span>+5,000</span>
            <span className="text-xs">🪙</span>
          </div>
        </button>
      </div>

      {/* Bottom Energy & Boost Bar */}
      <div className="w-full flex items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 shadow-md">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Энергия
            </span>
            <span className="font-mono text-zinc-300 text-xs">
              {energy} / {maxEnergy}
            </span>
          </div>
          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                energy < maxEnergy * 0.2
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.min(100, (energy / maxEnergy) * 100)}%` }}
            />
          </div>
        </div>

        {/* Boost modal trigger */}
        <button
          onClick={onOpenEnergyBoost}
          className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-transform shrink-0"
        >
          <Rocket className="w-3.5 h-3.5 text-black" />
          <span>Буст ⚡</span>
        </button>
      </div>

    </div>
  );
};
