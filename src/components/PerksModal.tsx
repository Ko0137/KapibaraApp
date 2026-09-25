import React, { useState } from 'react';
import { Award, Zap, Sparkles, Plus, Check, Lock, Key, Shield, RefreshCw, Flame, ArrowRight, X, Swords } from 'lucide-react';
import { LEVEL_PERKS, PerkDefinition } from '../data/perks';
import { hapticEffects } from '../utils/haptics';
import { sound } from '../utils/audio';

interface PerksModalProps {
  onClose: () => void;
  playerLevel: number;
  perkPoints: number;
  perks: Record<string, number>;
  purchasedCards: Record<string, number>;
  onUpgradePerk: (perkId: string) => void;
  onOpenResetModal: () => void;
  soundEnabled: boolean;
}

export const PerksModal: React.FC<PerksModalProps> = ({
  onClose,
  playerLevel,
  perkPoints,
  perks,
  purchasedCards,
  onUpgradePerk,
  onOpenResetModal,
  soundEnabled,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<
    'all' | 'str' | 'int' | 'dex' | 'fai' | 'chaos' | 'dubai_sheikh' | 'insider_trading'
  >('all');

  const filteredPerks = LEVEL_PERKS.filter(
    (p) => selectedBranch === 'all' || p.branch === selectedBranch
  );

  const handleBuy = (perk: PerkDefinition) => {
    const currentRank = perks[perk.id] || 0;
    if (currentRank >= perk.maxRank) return;
    if (perkPoints < perk.costPerRank) return;
    if (playerLevel < perk.requiredLevel) return;
    if (perk.unlockedByCardId && !(purchasedCards[perk.unlockedByCardId] > 0)) return;
    if (perk.requiredPerkId && !(perks[perk.requiredPerkId] > 0)) return;

    hapticEffects.purchase();
    if (soundEnabled) sound.playUpgrade();
    onUpgradePerk(perk.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative bg-zinc-900 border border-indigo-500/40 w-full max-w-xl rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header with explicit close button */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                Хардкорное Древо Душ
                <span className="text-[10px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                  SOULSLIKE
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Очки талантов: <span className="text-amber-400 font-black text-xs">✦ {perkPoints}</span> | Уровень: <span className="text-white font-bold">{playerLevel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                hapticEffects.tap();
                onOpenResetModal();
              }}
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-500/40 text-purple-300 text-xs font-black items-center gap-1.5 transition-colors active:scale-95"
              title="Сброс билда за реальные деньги"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>

            {/* Infallible, prominent Close Button in Header */}
            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
              }}
              className="p-2 rounded-2xl bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white border border-zinc-700 shadow-md transition-all active:scale-95 flex items-center justify-center shrink-0"
              title="Закрыть окно (X)"
              aria-label="Закрыть окно"
            >
              <X className="w-5 h-5 font-black" />
            </button>
          </div>
        </div>

        {/* Branch Filter Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-2.5">
          {[
            { id: 'all', label: 'Все ветки' },
            { id: 'str', label: '💪 Сила (STR)' },
            { id: 'int', label: '🔮 Магия (INT)' },
            { id: 'dex', label: '🥷 Ловкость' },
            { id: 'fai', label: '🔱 Вера/Шейх' },
            { id: 'chaos', label: '💀 Бездна' },
            { id: 'dubai_sheikh', label: '🇦🇪 DMCC' },
            { id: 'insider_trading', label: '🕵️ Инсайд' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                hapticEffects.tap();
                setSelectedBranch(tab.id as any);
              }}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${
                selectedBranch === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Perks list with Soulslike visual dependencies */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredPerks.map((perk) => {
            const currentRank = perks[perk.id] || 0;
            const isMax = currentRank >= perk.maxRank;
            const isLevelLocked = playerLevel < perk.requiredLevel;
            const isCardLocked = perk.unlockedByCardId
              ? !(purchasedCards[perk.unlockedByCardId] > 0)
              : false;
            const isPrereqLocked = perk.requiredPerkId
              ? !(perks[perk.requiredPerkId] > 0)
              : false;
            const canAfford = perkPoints >= perk.costPerRank;
            const isLocked = isLevelLocked || isCardLocked || isPrereqLocked;

            const prereqPerk = perk.requiredPerkId
              ? LEVEL_PERKS.find((p) => p.id === perk.requiredPerkId)
              : null;

            return (
              <div
                key={perk.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-zinc-950/60 border-zinc-850 opacity-60'
                    : isMax
                    ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                    : 'bg-zinc-800/80 border-zinc-700 hover:border-indigo-400/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {perk.icon}
                      {perk.visualWeapon && (
                        <span className="absolute -bottom-1 -right-1 text-xs bg-zinc-950 rounded-full p-0.5 border border-amber-500/50">
                          {perk.visualWeapon}
                        </span>
                      )}
                      {perk.visualBodyMutation && (
                        <span className="absolute -top-1 -right-1 text-xs bg-purple-950 rounded-full p-0.5 border border-purple-500/50">
                          🧬
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">
                          {perk.title}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-zinc-900 text-indigo-300 border border-indigo-900">
                          {currentRank} / {perk.maxRank}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{perk.description}</p>
                      
                      {/* Prerequisites warnings */}
                      {isPrereqLocked && prereqPerk && (
                        <p className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Требуется изучить: «{prereqPerk.title}»
                        </p>
                      )}

                      {isCardLocked && (
                        <p className="text-[10px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                          <Key className="w-3 h-3" /> Требуется карточка в Шахте!
                        </p>
                      )}

                      {/* Stat boosts indicator */}
                      {perk.statBonuses && (
                        <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] font-bold">
                          {perk.statBonuses.str && <span className="text-red-400 bg-red-950/40 px-1 rounded">STR +{perk.statBonuses.str}</span>}
                          {perk.statBonuses.dex && <span className="text-emerald-400 bg-emerald-950/40 px-1 rounded">DEX +{perk.statBonuses.dex}</span>}
                          {perk.statBonuses.int && <span className="text-indigo-400 bg-indigo-950/40 px-1 rounded">INT +{perk.statBonuses.int}</span>}
                          {perk.statBonuses.vit && <span className="text-amber-400 bg-amber-950/40 px-1 rounded">VIT +{perk.statBonuses.vit}</span>}
                          {perk.statBonuses.lck && <span className="text-yellow-400 bg-yellow-950/40 px-1 rounded">LCK +{perk.statBonuses.lck}</span>}
                        </div>
                      )}

                      {/* Dynamic Effect Value */}
                      <div className="text-[11px] font-semibold text-emerald-400 mt-1">
                        {currentRank > 0 ? (
                          perk.effectDescription(currentRank)
                        ) : (
                          <span className="text-zinc-500">
                            Ранг 1: {perk.effectDescription(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upgrade button / status */}
                  <div className="shrink-0 flex flex-col items-end">
                    {isMax ? (
                      <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                        <Check className="w-3 h-3" /> MAX
                      </span>
                    ) : isLocked ? (
                      <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {isLevelLocked ? `Ур. ${perk.requiredLevel}` : 'Закрыто'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(perk)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-transform active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>✦ {perk.costPerRank}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rank progress dots */}
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: perk.maxRank }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < currentRank
                          ? 'bg-indigo-500 shadow-sm shadow-indigo-400'
                          : 'bg-zinc-700/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Big Close Button */}
        <div className="pt-2 mt-2 border-t border-zinc-800 flex flex-col gap-2">
          <div className="text-[10px] text-zinc-400 text-center flex items-center justify-between">
            <span>💡 Изученные навыки визуально меняют персонажа и дают оружие</span>
            <button
              onClick={() => {
                hapticEffects.tap();
                onOpenResetModal();
              }}
              className="text-purple-400 hover:text-purple-300 font-bold underline"
            >
              Сбросить билд
            </button>
          </div>

          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition-all shadow-md"
          >
            <X className="w-4 h-4 text-zinc-400" />
            <span>Закрыть Древо Душ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
