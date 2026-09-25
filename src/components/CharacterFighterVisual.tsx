import React from 'react';
import { CharacterSkin, CharacterHat, CustomCapybaraConfig } from '../types/game';
import { SoulslikeStats } from '../utils/characterComposite';
import { CapybaraAvatarRenderer } from './CapybaraAvatarRenderer';
import { DEFAULT_CUSTOM_CAPYBARA } from '../data/customizerOptions';

interface CharacterFighterVisualProps {
  skin: CharacterSkin;
  hat: CharacterHat;
  stats: SoulslikeStats;
  customConfig?: CustomCapybaraConfig;
  isAttacking?: boolean;
  isHit?: boolean;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStatsBadge?: boolean;
  showMutationBadges?: boolean;
  name?: string;
  rank?: string;
}

export const CharacterFighterVisual: React.FC<CharacterFighterVisualProps> = ({
  skin,
  hat,
  stats,
  customConfig = DEFAULT_CUSTOM_CAPYBARA,
  isAttacking = false,
  isHit = false,
  side = 'left',
  size = 'md',
  showStatsBadge = false,
  showMutationBadges = false,
  name,
  rank
}) => {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Name and Rank above fighter */}
      {name && (
        <div className="mb-2 text-center">
          <div className="text-xs font-black text-white flex items-center justify-center gap-1">
            {name}
            {stats.tier === 'immortal' && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-black shadow-sm">IMMORTAL</span>}
            {stats.tier === 'divine' && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black shadow-sm">DIVINE</span>}
          </div>
          {rank && <span className="text-[10px] text-zinc-400 font-bold">{rank}</span>}
        </div>
      )}

      {/* Main Fighter Body Container */}
      <CapybaraAvatarRenderer
        customConfig={customConfig}
        skin={skin}
        hat={hat}
        stats={stats}
        isAttacking={isAttacking}
        isHit={isHit}
        side={side}
        size={size}
      />

      {/* Mutation Badges Display */}
      {showMutationBadges && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1 max-w-[260px]">
          {stats.isMuscular && (
            <span className="text-[9px] bg-red-950/90 border border-red-500/60 text-red-300 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
              💪 Мускулатура (STR {stats.str})
            </span>
          )}
          {stats.hasSpeedSparks && (
            <span className="text-[9px] bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
              ⚡ Молния (DEX {stats.dex})
            </span>
          )}
          {stats.hasMagicRunes && (
            <span className="text-[9px] bg-purple-950/90 border border-purple-500/60 text-purple-300 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
              🔮 Руны (INT {stats.int})
            </span>
          )}
          {stats.hasTitanArmor && (
            <span className="text-[9px] bg-amber-950/90 border border-amber-500/60 text-amber-300 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
              🛡️ Броня (VIT {stats.vit})
            </span>
          )}
          {stats.hasSheikhGold && (
            <span className="text-[9px] bg-yellow-950/90 border border-yellow-500/60 text-yellow-300 px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 shadow-sm">
              🔱 Золото (LCK {stats.lck})
            </span>
          )}
        </div>
      )}

      {/* Stats Badge */}
      {showStatsBadge && (
        <div className="mt-2 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-400 shadow-md">
          <span>⚔️ Рейтинг: {stats.dealPvPPower}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-red-400">Крит: {stats.critMultiplierFormatted}</span>
        </div>
      )}
    </div>
  );
};


