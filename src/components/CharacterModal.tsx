import React, { useState } from 'react';
import { CharacterSkin, CharacterHat, CustomCapybaraConfig } from '../types/game';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { LEVEL_PERKS } from '../data/perks';
import { computeCharacterComposite, getCompositeAvatarDisplay } from '../utils/characterComposite';
import { CharacterFighterVisual } from './CharacterFighterVisual';
import { formatNumber } from '../utils/format';
import { hapticEffects } from '../utils/haptics';
import { sound } from '../utils/audio';
import { Sparkles, Shirt, Crown, Zap, Shield, Swords, Flame, X, Lock, Check, RefreshCw, Award, Eye, Heart, Compass, Gem, Scroll, Search, Info, TrendingUp, Cpu } from 'lucide-react';

interface CharacterModalProps {
  onClose: () => void;
  playerLevel: number;
  playerCoins: number;
  playerGems: number;
  selectedSkinIdBase: string;
  selectedSkinIdOverlay: string;
  unlockedSkinIds: string[];
  selectedHatId: string;
  unlockedHatIds: string[];
  perks: Record<string, number>;
  dealStats: { dealsWon: number; dealsLost: number };
  unlockedSecretEvents?: string[];
  customConfig?: CustomCapybaraConfig;
  onSelectSkinBase: (skinId: string) => void;
  onSelectSkinOverlay: (skinId: string) => void;
  onBuySkin: (skin: CharacterSkin) => void;
  onSelectHat: (hatId: string) => void;
  onOpenPerksTree: () => void;
  onOpenResetPerksModal: () => void;
  onOpenSecretEventsModal: () => void;
  onOpenCustomizer?: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  onClose,
  playerLevel,
  playerCoins,
  playerGems,
  selectedSkinIdBase,
  selectedSkinIdOverlay,
  unlockedSkinIds,
  selectedHatId,
  unlockedHatIds,
  perks,
  dealStats,
  unlockedSecretEvents = [],
  customConfig,
  onSelectSkinBase,
  onSelectSkinOverlay,
  onBuySkin,
  onSelectHat,
  onOpenPerksTree,
  onOpenResetPerksModal,
  onOpenSecretEventsModal,
  onOpenCustomizer,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'skins' | 'hats'>('stats');
  const [skinFilter, setSkinFilter] = useState<'all' | 'unlocked' | 'shop' | 'secret'>('all');
  const [isTransforming, setIsTransforming] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  const currentSkin = CHARACTER_SKINS.find((s) => s.id === selectedSkinIdBase) || CHARACTER_SKINS[0];
  const currentHat = CHARACTER_HATS.find((h) => h.id === selectedHatId) || CHARACTER_HATS[0];

  // Trigger transformation animation on skin, hat, or level change
  React.useEffect(() => {
    setIsTransforming(true);
    const timer = setTimeout(() => {
      setIsTransforming(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [selectedSkinIdBase, selectedSkinIdOverlay, selectedHatId, playerLevel]);

  // Soulslike dynamic composite stats computation
  const stats = computeCharacterComposite(currentSkin, currentHat, perks);
  const compositeDisplay = getCompositeAvatarDisplay(currentSkin, currentHat, stats);

  // Calculate active skin-perk synergies
  const synergies: { title: string; desc: string; active: boolean; icon: string }[] = [
    {
      title: 'Титан Тяжелой Стали',
      desc: 'Скин «Мутант-Качок» + «Колоссальный Двуручник»: Урон в Сделке увеличен на 60%, шанс стана врага +35%.',
      icon: '💪⚔️',
      active: currentSkin.id === 'skin_muscle_mutant' && (perks['perk_colossal_sword'] || 0) > 0,
    },
    {
      title: 'Владыка Эфирной Слизи',
      desc: 'Скин «Эфирная Слизь» + «Сфера Архимага»: Магический крит взлетает до 5.0x и восстанавливает энергию при тапе.',
      icon: '🧪🔮',
      active: currentSkin.id === 'skin_toxic_ooze' && (perks['perk_archmage_crystal'] || 0) > 0,
    },
    {
      title: 'Теневой Клинок Самурая',
      desc: 'Скин «Самурай» + «Катана Теневого Самурая»: Скорость тапов +35%, открывая второй двойной клик-импульс.',
      icon: '⚔️🗡️',
      active: currentSkin.id === 'skin_samurai_capy' && (perks['perk_samurai_katana'] || 0) > 0,
    },
    {
      title: 'Золотое Изобилие Шейха',
      desc: 'Скин «Шейх Аль-Мактум» + «Золотой Скипетр»: Выпадение миллионных золотых кушей и пельменей х2.',
      icon: '👳🔱',
      active: currentSkin.id === 'skin_sheikh_capy' && (perks['perk_golden_scepter'] || 0) > 0,
    },
    {
      title: 'Кибернетический Разум 2077',
      desc: 'Скин «Кибер-Капибара» + «Нейросеть Киберпанка»: Автоматический пассивный крит-тап каждые 3 секунды.',
      icon: '🦾⚡',
      active: currentSkin.id === 'skin_cyber_capy' && (perks['perk_cyber_neuro'] || 0) > 0,
    },
  ];

  // Filtered skins list
  const filteredSkins = CHARACTER_SKINS.filter((skin) => {
    const isUnlocked = unlockedSkinIds.includes(skin.id);
    if (skinFilter === 'unlocked') return isUnlocked;
    if (skinFilter === 'shop') return !isUnlocked && skin.rarity !== 'secret';
    if (skinFilter === 'secret') return skin.rarity === 'secret' || skin.isSecret;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-amber-500/40 w-full max-w-2xl rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-white relative">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 inset-x-0 h-32 bg-gradient-to-b from-amber-500/20 via-purple-500/10 to-transparent pointer-events-none rounded-t-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Профиль & Билд Героя
                </h2>
                <span className="text-[10px] bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full">
                  УР. {playerLevel}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Класс: <span className="text-amber-300 font-bold">{stats.archetypeTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-2xl bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Scrollable Content Area for Hero Podium, Tabs & Lists */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1 pb-16 space-y-3">
          {/* Hero Interactive Showcase Podium - Sleek & Compact */}
          <div className="relative p-2.5 sm:p-3 rounded-2xl bg-zinc-950 border border-zinc-800 shrink-0 flex flex-col justify-center shadow-inner overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${compositeDisplay.auraCss} opacity-25 pointer-events-none`} />

            {/* Controls Bar on Top of Podium */}
            <div className="w-full flex items-center justify-between mb-1.5 z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-zinc-900/90 border border-zinc-700/80 px-2 py-0.5 rounded-full shadow-sm">
                  {stats.archetypeTitle}
                </span>
                <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">
                  Винрейт PvP: {dealStats.dealsWon}/{dealStats.dealsWon + dealStats.dealsLost}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    hapticEffects.tap();
                    setShowDetailedStats(!showDetailedStats);
                  }}
                  className={`py-0.5 px-2 rounded-full border text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                    showDetailedStats
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-zinc-800 text-amber-300 border-amber-500/40 hover:bg-zinc-700'
                  }`}
                >
                  <Info className="w-3 h-3" />
                  <span>{showDetailedStats ? 'Скрыть' : 'Подробности'}</span>
                </button>

                {onOpenCustomizer && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticEffects.tap();
                      onOpenCustomizer();
                    }}
                    className="py-0.5 px-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-extrabold text-[10px] flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>🎨 Кастомизация</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hero Avatar Visual + Transformation Morphing Particle Effect */}
            <div className="relative z-10 flex items-center gap-3 my-0.5">
              <div className="relative flex items-center justify-center shrink-0">
                {/* Particle Shockwave Ring */}
                {isTransforming && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-75 pointer-events-none scale-125 z-0" />
                    <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/40 via-purple-500/40 to-cyan-400/40 rounded-full blur-lg animate-pulse pointer-events-none z-0" />
                    <div className="absolute -top-4 text-[10px] font-black text-amber-300 bg-black/95 px-2 py-0.5 rounded-full border border-amber-400 animate-bounce shadow-xl z-30 whitespace-nowrap">
                      ✨ ТРАНСФОРМАЦИЯ! ✨
                    </div>
                    {/* Floating Sparkle Particles */}
                    <div className="absolute -top-2 -left-2 text-xs animate-ping pointer-events-none z-30">✦</div>
                    <div className="absolute -top-2 -right-2 text-xs animate-ping delay-100 pointer-events-none z-30">🌟</div>
                    <div className="absolute -bottom-2 -left-2 text-xs animate-ping delay-200 pointer-events-none z-30">💥</div>
                    <div className="absolute -bottom-2 -right-2 text-xs animate-ping delay-300 pointer-events-none z-30">⚡</div>
                  </>
                )}

                <div
                  className={`transition-all duration-300 ${
                    isTransforming
                      ? 'scale-110 rotate-2 filter brightness-125 saturate-150 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)]'
                      : 'scale-100'
                  }`}
                >
                  <CharacterFighterVisual
                    skin={currentSkin}
                    hat={currentHat}
                    stats={stats}
                    customConfig={customConfig}
                    size="md"
                    showStatsBadge={false}
                    showMutationBadges={true}
                  />
                </div>
              </div>

              <div className="text-left space-y-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">
                    {currentSkin.name}
                  </h3>
                  {currentHat.id !== 'hat_none' && currentHat.name && currentHat.name !== 'Без головного убора' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      🎩 {currentHat.name}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-zinc-400 leading-tight line-clamp-2">
                  {stats.archetypeDesc}
                </p>

                {/* Active Build Diode Visual Indicators */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[9px] font-extrabold">
                  <span className="text-zinc-500">Диоды:</span>
                  {stats.str >= 12 && <span className="bg-red-950/80 text-red-300 border border-red-700/60 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">🔴 STR +{stats.str}</span>}
                  {stats.dex >= 12 && <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">⚡ DEX +{stats.dex}</span>}
                  {stats.int >= 12 && <span className="bg-purple-950/80 text-purple-300 border border-purple-700/60 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">🔮 INT +{stats.int}</span>}
                  {stats.vit >= 12 && <span className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">🛡️ VIT +{stats.vit}</span>}
                  {stats.lck >= 12 && <span className="bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 px-1 py-0.2 rounded flex items-center gap-0.5 animate-pulse">🪙 LCK +{stats.lck}</span>}
                </div>

                {stats.activeWeaponName && (
                  <div className="text-[10px] font-extrabold text-cyan-300 flex items-center gap-1 pt-0.5">
                    <span>⚔️ {stats.activeWeaponName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Combat Power & Stats Bar */}
            <div className="relative z-10 grid grid-cols-3 gap-1.5 mt-1.5 pt-1.5 border-t border-zinc-800/80 w-full text-[10px] font-bold text-center">
              <div className="p-1 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 flex items-center justify-center gap-1">
                <Swords className="w-3 h-3 text-rose-400" />
                <span>Мощь: {stats.dealPvPPower}</span>
              </div>

              <div className="p-1 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Крит: {stats.critMultiplierFormatted}</span>
              </div>

              <div className="p-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Пассив: +{(stats.idleBonusPercent * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Detailed Stats Drawer / Breakdown */}
          {showDetailedStats && (
            <div className="p-3 rounded-2xl bg-zinc-950/90 border border-amber-500/40 text-xs space-y-2 animate-fadeIn shrink-0">
              <div className="font-extrabold text-amber-300 border-b border-zinc-800 pb-1 flex items-center justify-between">
                <span>Полный Расчет Характеристик Бойца</span>
                <span className="text-[10px] text-zinc-400">Версия Soulslike v2.5</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                  <span className="text-zinc-400 font-bold">Сила Тапа (STR):</span>
                  <div className="font-extrabold text-white text-xs">{stats.str} (Множитель: x{stats.tapPowerMultiplier.toFixed(2)})</div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                  <span className="text-zinc-400 font-bold">Шанс и Сила Крита (DEX):</span>
                  <div className="font-extrabold text-emerald-300 text-xs">{(stats.critChance * 100).toFixed(0)}% / {stats.critMultiplierFormatted}</div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                  <span className="text-zinc-400 font-bold">Пассивный Прибыль/Час (INT):</span>
                  <div className="font-extrabold text-indigo-300 text-xs">+{(stats.idleBonusPercent * 100).toFixed(0)}% к оффлайн доходу</div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-0.5">
                  <span className="text-zinc-400 font-bold">Стойкость & Энергия (VIT):</span>
                  <div className="font-extrabold text-amber-300 text-xs">+{stats.vit * 50} макс. энергии / +{(stats.energyRegenBonusPercent * 100).toFixed(0)}% реген</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('stats');
              }}
              className={`py-2 px-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                activeTab === 'stats'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Билд & Статы</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('skins');
              }}
              className={`py-2 px-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                activeTab === 'skins'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Скины ({unlockedSkinIds.length}/{CHARACTER_SKINS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('hats');
              }}
              className={`py-2 px-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
                activeTab === 'hats'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-[1.02]'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Шапки ({unlockedHatIds.length}/{CHARACTER_HATS.length})</span>
            </button>
          </div>

          {/* Tab 1: Stats & Synergies */}
          {activeTab === 'stats' && (
            <div className="space-y-3">
            {/* Soulslike RPG Stat Grid */}
            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 pb-1 border-b border-zinc-700">
                <span>Характеристики Бойца (RPG Stats)</span>
                <span className="text-amber-400 font-extrabold">Уровень: {playerLevel}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <span className="text-red-400 font-black">STR</span> Сила тапа:
                  </span>
                  <span className="font-black text-white">{stats.str}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <span className="text-emerald-400 font-black">DEX</span> Ловкость крита:
                  </span>
                  <span className="font-black text-white">{stats.dex}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <span className="text-indigo-400 font-black">INT</span> Магия эфира:
                  </span>
                  <span className="font-black text-white">{stats.int}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <span className="text-amber-400 font-black">VIT</span> Стойкость:
                  </span>
                  <span className="font-black text-white">{stats.vit}</span>
                </div>

                <div className="col-span-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <span className="text-yellow-400 font-black">LCK</span> Удача & Шейх:
                  </span>
                  <span className="font-black text-yellow-300">{stats.lck}</span>
                </div>
              </div>
            </div>

            {/* Active Synergies */}
            <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-2">
              <div className="text-xs font-bold text-zinc-400 pb-1 border-b border-zinc-700 flex items-center justify-between">
                <span>Синергии Навыков и Скина</span>
                <span className="text-[10px] text-zinc-500">Комбинации дают сверхбонусы</span>
              </div>

              <div className="space-y-2">
                {synergies.map((syn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      syn.active
                        ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-md'
                        : 'bg-zinc-900/50 border-zinc-800/60 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-xs flex items-center gap-1.5">
                        <span>{syn.icon}</span>
                        <span className={syn.active ? 'text-amber-300' : 'text-zinc-400'}>{syn.title}</span>
                      </div>
                      {syn.active ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-extrabold">
                          АКТИВНО
                        </span>
                      ) : (
                        <span className="text-[9px] text-zinc-600 font-bold">
                          Не собрано
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-snug">{syn.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  hapticEffects.tap();
                  onOpenPerksTree();
                }}
                className="py-3 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Древо Навыков</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticEffects.tap();
                  onOpenResetPerksModal();
                }}
                className="py-3 px-3 bg-gradient-to-r from-purple-700 to-rose-700 hover:from-purple-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-700/30 active:scale-95 transition-transform cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Сброс Билда</span>
              </button>
            </div>

            {/* Secret Events button */}
            <button
              type="button"
              onClick={() => {
                hapticEffects.tap();
                onOpenSecretEventsModal();
              }}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Тайный Архив Вселенной ({unlockedSecretEvents.length} раскрыто)</span>
            </button>
          </div>
        )}

        {/* Tab 2: Skins */}
        {activeTab === 'skins' && (
          <div className="space-y-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 pb-1 shrink-0 overflow-x-auto custom-scrollbar">
              {(
                [
                  { id: 'all', label: 'Все' },
                  { id: 'unlocked', label: 'В гардеробе' },
                  { id: 'shop', label: 'Магазин' },
                  { id: 'secret', label: 'Секретные' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    hapticEffects.tap();
                    setSkinFilter(f.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    skinFilter === f.id
                      ? 'bg-amber-500 text-black shadow-md font-extrabold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Skins List */}
            <div className="space-y-2">
              {filteredSkins.map((skin) => {
                const isUnlocked = unlockedSkinIds.includes(skin.id);
                const isSelectedBase = selectedSkinIdBase === skin.id;
                const isSelectedOverlay = selectedSkinIdOverlay === skin.id;
                const isSelected = isSelectedBase || isSelectedOverlay;
                const canAffordCoins = !skin.costCoins || playerCoins >= skin.costCoins;
                const canAffordGems = !skin.costGems || playerGems >= skin.costGems;
                const isLevelUnlocked = playerLevel >= (skin.requiredLevel || 1);

                return (
                  <div
                    key={skin.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                        : isUnlocked
                        ? 'bg-zinc-800/80 border-zinc-700 hover:border-amber-400/50'
                        : skin.rarity === 'secret'
                        ? 'bg-rose-950/30 border-rose-600/40 opacity-85'
                        : 'bg-zinc-950/60 border-zinc-850 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-md border border-amber-500/40 bg-zinc-950 relative">
                          <CharacterFighterVisual skin={skin} hat={currentHat} stats={stats} size="sm" showMutationBadges={false} />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs text-white">{skin.name}</h4>
                            {skin.rarity === 'secret' && (
                              <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black">
                                СЕКРЕТ
                              </span>
                            )}
                            {isSelectedBase && (
                              <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded-md font-extrabold">
                                БАЗА
                              </span>
                            )}
                            {isSelectedOverlay && (
                              <span className="text-[9px] bg-purple-500 text-black px-1.5 py-0.2 rounded-md font-extrabold">
                                НАЛОЖЕНИЕ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{skin.description}</p>
                          {skin.secretHint && !isUnlocked && (
                            <p className="text-[10px] text-rose-400 font-bold mt-0.5">
                              🔒 {skin.secretHint}
                            </p>
                          )}
                          <div className="text-[10px] font-bold text-amber-400 mt-1">
                            ✨ {skin.bonusDescription}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isUnlocked ? (
                          <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                  hapticEffects.tap();
                                  onSelectSkinBase(skin.id);
                                }}
                                className={`px-2 py-1.5 rounded-xl text-[9px] font-black transition-transform active:scale-95 shadow-sm ${isSelectedBase ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-white'}`}
                            >
                              База
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                  hapticEffects.tap();
                                  onSelectSkinOverlay(skin.id);
                                }}
                                className={`px-2 py-1.5 rounded-xl text-[9px] font-black transition-transform active:scale-95 shadow-sm ${isSelectedOverlay ? 'bg-purple-500 text-black' : 'bg-zinc-700 text-white'}`}
                            >
                              Нал.
                            </button>
                          </div>
                        ) : skin.rarity === 'secret' ? (
                          <span className="text-rose-400 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                            Секретно
                          </span>
                        ) : !isLevelUnlocked ? (
                          <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                            🔒 Ур. {skin.requiredLevel}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (canAffordCoins && canAffordGems) {
                                hapticEffects.heavyTap();
                                sound.playCardBuy();
                                onBuySkin(skin);
                              }
                            }}
                            disabled={!canAffordCoins || !canAffordGems}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-transform active:scale-95 cursor-pointer ${
                              canAffordCoins && canAffordGems
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            {skin.costCoins ? `${formatNumber(skin.costCoins)} 🪙` : ''}
                            {skin.costGems ? ` + ${skin.costGems} 💎` : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Hats */}
        {activeTab === 'hats' && (
          <div className="space-y-2">
            {CHARACTER_HATS.map((hat) => {
              const isUnlocked = unlockedHatIds.includes(hat.id);
              const isSelected = selectedHatId === hat.id;

              return (
                <div
                  key={hat.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                      : isUnlocked
                      ? 'bg-zinc-800/80 border-zinc-700 hover:border-amber-400/50'
                      : 'bg-zinc-950/60 border-zinc-850 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-md">
                        {hat.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs text-white">{hat.name}</h4>
                          {isSelected && (
                            <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded-md font-extrabold">
                              НАДЕТО
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">{hat.description}</p>
                        <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                          ✨ {hat.bonusDesc}
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">
                          Разблокировка: {hat.unlockedBy}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1">
                          <Check className="w-4 h-4" /> Надет
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            hapticEffects.tap();
                            sound.playCardBuy();
                            onSelectHat(hat.id);
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl transition-transform active:scale-95 shadow-md cursor-pointer"
                        >
                          Надеть
                        </button>
                      ) : (
                        <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Заблокировано
                        </span>
                      )}
                    </div>
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
