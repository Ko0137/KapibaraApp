import React from 'react';
import { CharacterSkin, CharacterHat, CustomCapybaraConfig } from '../types/game';
import { SoulslikeStats, getCompositeAvatarDisplay } from '../utils/characterComposite';
import { DEFAULT_CUSTOM_CAPYBARA } from '../data/customizerOptions';

import capyClassicImg from '../assets/images/capy_classic_1790339011736.jpg';
import capyGentlemanImg from '../assets/images/capy_gentleman_1790339112719.jpg';
import capySheikhImg from '../assets/images/capy_sheikh_1790339129520.jpg';
import capyMuscleImg from '../assets/images/capy_muscle_1790339144067.jpg';
import capyCyberImg from '../assets/images/capy_cyber_1790339162589.jpg';
import capySamuraiImg from '../assets/images/capy_samurai_1790339185479.jpg';

const SKIN_PORTRAIT_MAP: Record<string, string> = {
  skin_default: capyClassicImg,
  skin_gentleman_capy: capyGentlemanImg,
  skin_sheikh_capy: capySheikhImg,
  skin_muscle_mutant: capyMuscleImg,
  skin_cyber_capy: capyCyberImg,
  skin_cyberpunk_2077: capyCyberImg, // Keeping existing logic for now
  skin_samurai_capy: capySamuraiImg,
};

interface CapybaraAvatarRendererProps {
  customConfig?: CustomCapybaraConfig;
  skin?: CharacterSkin;
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

  const skinId = currentSkin.id;
  const isMuscularBuild =
    stats.isMuscular ||
    stats.str >= 12 ||
    stats.archetypeTitle.toLowerCase().includes('бодибилдер') ||
    stats.archetypeTitle.toLowerCase().includes('качок') ||
    stats.archetypeTitle.toLowerCase().includes('колосс');

  let portraitImg = SKIN_PORTRAIT_MAP[skinId];

  // Dynamic image switching based on build mutations if default skin or muscle skin
  if (skinId === 'skin_default' || skinId === 'skin_muscle_mutant') {
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

  if (isMuscularBuild && skinId === 'skin_default') {
    portraitImg = capyMuscleImg;
  }

  if (!portraitImg) {
    portraitImg = capyClassicImg;
  }

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

        {/* Dynamic Shader Glow & Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

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
