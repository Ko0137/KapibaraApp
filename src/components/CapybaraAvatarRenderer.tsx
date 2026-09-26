import React from 'react';
import { CharacterSkin, CharacterHat, CustomCapybaraConfig } from '../types/game';
import { SoulslikeStats, getCompositeAvatarDisplay } from '../utils/characterComposite';
import { DEFAULT_CUSTOM_CAPYBARA } from '../data/customizerOptions';

import capyClassicImg from '../assets/images/capy_classic_1790339011736.jpg';
import capyGentlemanImg from '../assets/images/capy_gentleman_portrait_1790408815618.jpg';
import capySheikhImg from '../assets/images/capy_sheikh_portrait_1790408835368.jpg';
import capyMuscleImg from '../assets/images/capy_muscle_portrait_1790408851572.jpg';
import capyToxicImg from '../assets/images/capy_toxic_portrait_1790408867839.jpg';
import capyCyberImg from '../assets/images/capy_cyber_1790339162589.jpg';
import capySamuraiImg from '../assets/images/capy_samurai_1790339185479.jpg';
import capyPelmenImg from '../assets/images/capy_pelmen_portrait_1790408886021.jpg';
import capyGodImg from '../assets/images/capy_god_portrait_1790408905950.jpg';

import capyAssassinImg from '../assets/images/capy_assassin_portrait_1790408208592.jpg';
import capySpiderImg from '../assets/images/capy_spider_portrait_1790408223864.jpg';
import capyWolverineImg from '../assets/images/capy_wolverine_portrait_1790408236440.jpg';
import capyDeadpoolImg from '../assets/images/capy_deadpool_portrait_1790408253382.jpg';
import capyBatmanImg from '../assets/images/capy_batman_portrait_1790408269147.jpg';
import capyIronmanImg from '../assets/images/capy_ironman_portrait_1790408284062.jpg';
import capyThorImg from '../assets/images/capy_thor_portrait_1790408298370.jpg';
import capyJokerImg from '../assets/images/capy_joker_portrait_1790408317750.jpg';
import capyStrangeImg from '../assets/images/capy_strange_portrait_1790408341443.jpg';
import capyVenomImg from '../assets/images/capy_venom_portrait_1790408443804.jpg';
import capyWitcherImg from '../assets/images/capy_witcher_portrait_1790409172843.jpg';

const SKIN_PORTRAIT_MAP: Record<string, string> = {
  skin_default: capyClassicImg,
  skin_gentleman_capy: capyGentlemanImg,
  skin_sheikh_capy: capySheikhImg,
  skin_muscle_mutant: capyMuscleImg,
  skin_toxic_ooze: capyToxicImg,
  skin_cyber_capy: capyCyberImg,
  skin_cyberpunk_2077: capyCyberImg,
  skin_samurai_capy: capySamuraiImg,
  skin_pelmen_shlepa: capyPelmenImg,
  skin_god_capy: capyGodImg,
  skin_assassin_capy: capyAssassinImg,
  skin_spider_capy: capySpiderImg,
  skin_wolverine_capy: capyWolverineImg,
  skin_deadpool_capy: capyDeadpoolImg,
  skin_batman_capy: capyBatmanImg,
  skin_iron_capy: capyIronmanImg,
  skin_thor_capy: capyThorImg,
  skin_joker_capy: capyJokerImg,
  skin_dr_strange_capy: capyStrangeImg,
  skin_venom_capy: capyVenomImg,
  skin_witcher_capy: capyWitcherImg,
};


interface CapybaraAvatarRendererProps {
  customConfig?: CustomCapybaraConfig;
  skin?: CharacterSkin;
  overlaySkin?: CharacterSkin;
  hat?: CharacterHat;
  stats: SoulslikeStats;
  isAttacking?: boolean;
  isHit?: boolean;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const CapybaraAvatarRenderer: React.FC<CapybaraAvatarRendererProps> = ({
  customConfig = DEFAULT_CUSTOM_CAPYBARA,
  skin,
  overlaySkin,
  hat,
  stats,
  isAttacking = false,
  isHit = false,
  side = 'left',
  size = 'lg',
  className = '',
}) => {
  const currentSkin = skin || {
    id: 'skin_default',
    name: 'Барон',
    icon: '🦫',
    description: '',
    rarity: 'common',
    bonusDescription: '',
    bonusType: 'tap_power',
    bonusValue: 0,
  };
  const currentHat = hat || {
    id: 'hat_none',
    name: '',
    icon: '',
    description: '',
    unlockedBy: '',
    bonusDesc: '',
  };

  const display = getCompositeAvatarDisplay(currentSkin, currentHat, stats);

  const dimensionMap = {
    sm: { width: 72, height: 72 },
    md: { width: 110, height: 110 },
    lg: { width: 160, height: 160 },
    xl: { width: 220, height: 220 },
    '2xl': { width: 280, height: 280 },
  }[size];

  const attackAnimation = isAttacking
    ? side === 'left'
      ? 'translate-x-3 scale-105 -rotate-6 transition-transform duration-75'
      : '-translate-x-3 scale-105 rotate-6 transition-transform duration-75'
    : 'transition-transform duration-150';

  const hitAnimation = isHit ? 'brightness-150 saturate-200 animate-shake' : '';

  const hairStyleIcons: Record<string, string> = {
    smooth: '',
    mohawk: '🎸',
    gentleman: '🎩',
    dreadlocks: '🌴',
    anime_bangs: '⚡',
    samurai_bun: '🥷',
    royal_curls: '👑',
  };

  // Resolve base skin ID safely (handles composite IDs like skin_default_skin_spider_capy or baseSkinId)
  const baseSkinId = currentSkin.baseSkinId || (currentSkin.id.includes('_') && !SKIN_PORTRAIT_MAP[currentSkin.id] ? currentSkin.id.split('_')[0] : currentSkin.id);
  const overlaySkinId = overlaySkin?.id || currentSkin.overlaySkinId;
  const isOverlayActive = Boolean(overlaySkinId && overlaySkinId !== baseSkinId && overlaySkinId !== 'skin_default' && SKIN_PORTRAIT_MAP[overlaySkinId]);

  const isMuscularBuild =
    stats.isMuscular ||
    stats.str >= 12 ||
    stats.archetypeTitle.toLowerCase().includes('бодибилдер') ||
    stats.archetypeTitle.toLowerCase().includes('качок') ||
    stats.archetypeTitle.toLowerCase().includes('колосс');

  let portraitImg = SKIN_PORTRAIT_MAP[baseSkinId] || SKIN_PORTRAIT_MAP[currentSkin.id];

  // Dynamic image switching based on build mutations if default skin or muscle skin
  if (baseSkinId === 'skin_default' || baseSkinId === 'skin_muscle_mutant') {
    if (isMuscularBuild) {
      portraitImg = capyMuscleImg;
    } else if (stats.hasSheikhGold || stats.archetypeTitle.toLowerCase().includes('шейх')) {
      portraitImg = capySheikhImg;
    } else if (stats.archetypeTitle.toLowerCase().includes('кибер')) {
      portraitImg = capyCyberImg;
    } else if (stats.archetypeTitle.toLowerCase().includes('самурай')) {
      portraitImg = capySamuraiImg;
    }
  }

  if (isMuscularBuild && baseSkinId === 'skin_default') {
    portraitImg = capyMuscleImg;
  }

  if (!portraitImg) {
    portraitImg = capyClassicImg;
  }

  const overlayPortraitImg = isOverlayActive && overlaySkinId ? SKIN_PORTRAIT_MAP[overlaySkinId] : null;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${attackAnimation} ${hitAnimation} ${className}`}
      style={{ width: dimensionMap.width, height: dimensionMap.height }}
    >
      {/* 1. Celestial Seraph Wings behind */}
      {display.wingsIcon && (
        <div
          className={`absolute inset-0 flex items-center justify-between pointer-events-none z-0 ${
            side === 'left' ? 'scale-x-100' : '-scale-x-100'
          }`}
        >
          <span className="text-4xl sm:text-5xl animate-bounce -translate-x-5 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]">
            {display.wingsIcon}
          </span>
          <span className="text-4xl sm:text-5xl animate-bounce translate-x-5 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]">
            {display.wingsIcon}
          </span>
        </div>
      )}

      {/* 2. Cosmic Halo */}
      {display.haloIcon && (
        <div className="absolute -top-6 inset-x-0 flex justify-center text-4xl animate-spin-slow pointer-events-none drop-shadow-[0_0_16px_rgba(251,191,36,0.95)] z-0">
          {display.haloIcon}
        </div>
      )}

      {/* 3. Dynamic Aura Backdrop Glow */}
      <div className={`absolute inset-1 rounded-3xl bg-gradient-to-tr ${display.auraCss} blur-md opacity-80 z-0`} />

      {/* 4. Magic Arcane Runes Ring */}
      {display.magicIcon && (
        <div className="absolute -inset-2 rounded-full border-2 border-dashed border-purple-400/60 animate-spin-slow pointer-events-none flex items-center justify-between p-1 z-10">
          <span className="text-xs text-purple-300">✦</span>
          <span className="text-xs text-cyan-300">✦</span>
          <span className="text-xs text-pink-300">✦</span>
        </div>
      )}

      {/* 5. Lightning Speed Sparks */}
      {display.lightningIcon && (
        <div className="absolute -inset-2 flex items-center justify-between pointer-events-none text-xl text-cyan-300 animate-pulse z-20">
          <span className="animate-ping">⚡</span>
          <span className="animate-ping delay-100">⚡</span>
        </div>
      )}

      {/* 6. Gold Rain Sparkles */}
      {stats.hasSheikhGold && (
        <div className="absolute -top-3 right-0 text-lg animate-bounce pointer-events-none z-20">
          ✨🪙✨
        </div>
      )}

      {/* 7. PHOTOREALISTIC HIGH-DEF AI ARTWORK PORTRAIT BODY */}
      <div
        className={`relative w-full h-full flex items-center justify-center z-10 filter drop-shadow-2xl overflow-hidden rounded-3xl border-2 border-amber-500/50 shadow-2xl bg-zinc-950 ${
          side === 'right' ? '-scale-x-100' : 'scale-x-100'
        }`}
      >
        <img
          src={portraitImg}
          alt={currentSkin.name}
          className="w-full h-full object-cover rounded-3xl transform hover:scale-105 transition-transform duration-300"
        />

        {/* Dynamic Overlay Skin Fusion Layer (Split Dual Portrait) */}
        {isOverlayActive && overlayPortraitImg && (
          <div
            className="absolute inset-0 z-15 overflow-hidden rounded-3xl pointer-events-none"
            style={{
              clipPath: 'polygon(42% 0, 100% 0, 100% 100%, 20% 100%)',
            }}
          >
            <img
              src={overlayPortraitImg}
              alt="Overlay Fusion Skin"
              className="w-full h-full object-cover filter contrast-110 saturate-110"
            />
            {/* Holographic energy wave & glowing separator laser seam */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/25 via-cyan-400/10 to-transparent mix-blend-overlay" />
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-300 via-amber-300 to-purple-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          </div>
        )}

        {/* Dynamic Shader Glow & Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

        {/* Fusion Overlay Badge */}
        {isOverlayActive && (
          <div className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 bg-purple-950/90 border border-purple-400 text-purple-200 text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg backdrop-blur-sm animate-pulse">
            <span>✨</span>
            <span>{overlaySkin?.icon || currentSkin.overlayIcon || '🎭'}</span>
            <span className="hidden sm:inline">НАЛОЖЕНИЕ</span>
          </div>
        )}

        {/* Muscular Muscle Mutation Bicep Badge */}
        {isMuscularBuild && (
          <div className="absolute bottom-1.5 left-1.5 bg-red-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-red-400 flex items-center gap-0.5 animate-pulse shadow-lg z-30">
            <span>💪</span>
            <span>КАЧОК</span>
          </div>
        )}

        {/* Customizer hairstyle overlay icon if set */}
        {customConfig.hairStyle !== 'smooth' && hairStyleIcons[customConfig.hairStyle] && (
          <div className="absolute top-1 left-2 text-2xl filter drop-shadow-md pointer-events-none transform -rotate-6 z-20">
            {hairStyleIcons[customConfig.hairStyle]}
          </div>
        )}

        {/* Active Build Diode Indicators (LED Lights on Frame) */}
        <div className="absolute top-1 right-1 flex flex-col gap-0.5 z-30 pointer-events-none">
          {stats.str >= 15 && <span className="text-[10px] filter drop-shadow animate-pulse" title="STR Днод Силы">🔴</span>}
          {stats.dex >= 15 && <span className="text-[10px] filter drop-shadow animate-pulse" title="DEX Диод Скорости">⚡</span>}
          {stats.int >= 15 && <span className="text-[10px] filter drop-shadow animate-pulse" title="INT Диод Магии">🔮</span>}
          {stats.vit >= 15 && <span className="text-[10px] filter drop-shadow animate-pulse" title="VIT Диод Защиты">🛡️</span>}
          {stats.lck >= 15 && <span className="text-[10px] filter drop-shadow animate-pulse" title="LCK Диод Удачи">🪙</span>}
        </div>

        {/* Equipped Hat sitting atop portrait */}
        {display.hatIcon && (
          <div className="absolute top-1 inset-x-0 flex justify-center text-3xl filter drop-shadow-lg pointer-events-none z-30 animate-bounce" style={{ animationDuration: '3s' }}>
            {display.hatIcon}
          </div>
        )}

        {/* Equipped Weapon in Hand */}
        {display.weaponIcon && (
          <div
            className={`absolute bottom-1 ${
              side === 'left' ? 'right-1 rotate-12' : 'left-1 -rotate-12'
            } text-3xl filter drop-shadow-[0_0_12px_rgba(234,179,8,0.95)] pointer-events-none z-30 ${
              isAttacking
                ? side === 'left'
                  ? 'translate-x-2 -rotate-20 scale-125'
                  : '-translate-x-2 rotate-20 scale-125'
                : ''
            } transition-transform`}
          >
            {display.weaponIcon}
          </div>
        )}
      </div>

      {/* 8. Combat Attack Slash Wave */}
      {isAttacking && (
        <div
          className={`absolute ${
            side === 'left' ? 'right-0' : 'left-0'
          } text-4xl pointer-events-none z-40 animate-ping opacity-90`}
        >
          ⚔️
        </div>
      )}

      {/* 9. Spark hit effect */}
      {isHit && (
        <div className="absolute inset-0 flex items-center justify-center text-5xl z-40 pointer-events-none animate-ping">
          💥
        </div>
      )}
    </div>
  );
};
