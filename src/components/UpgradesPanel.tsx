import React, { useState } from 'react';
import { UpgradeItem, Artifact } from '../types/game';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';

interface UpgradesPanelProps {
  coins: number;
  gems: number;
  currentLevel: number;
  upgrades: UpgradeItem[];
  artifacts: Artifact[];
  purchasedUpgrades: Record<string, number>;
  purchasedArtifacts: Record<string, number>;
  prestigeCount: number;
  cosmicShards: number;
  onBuyUpgrade: (upgrade: UpgradeItem, buyCount: number) => void;
  onBuyArtifact: (artifact: Artifact) => void;
  onPrestige: () => void;
}

export const UpgradesPanel: React.FC<UpgradesPanelProps> = ({
  coins,
  gems,
  currentLevel,
  upgrades,
  artifacts,
  purchasedUpgrades,
  purchasedArtifacts,
  prestigeCount,
  cosmicShards,
  onBuyUpgrade,
  onBuyArtifact,
  onPrestige
}) => {
  const [activeTab, setActiveTab] = useState<'tap' | 'idle' | 'artifacts' | 'prestige'>('tap');
  const [buyMultiplier, setBuyMultiplier] = useState<1 | 10>(1);

  // Calculate actual cost for an upgrade given current level and buy count
  const calculateCost = (upgrade: UpgradeItem, count: number): number => {
    const curLvl = purchasedUpgrades[upgrade.id] || 0;
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, curLvl + i));
    }
    return total;
  };

  const tapUpgrades = upgrades.filter(u => u.type === 'tap' || u.type === 'crit_chance');
  const idleUpgrades = upgrades.filter(u => u.type === 'idle');

  // Prestige potential shards: 1 shard for every 5 levels above level 25
  const shardsOnPrestige = Math.max(0, Math.floor((currentLevel - 20) / 4));

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col h-[460px]">
      {/* Navigation Tabs & Multiplier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap scroll-smooth flex-1">
          <button
            onClick={() => setActiveTab('tap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'tap'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👆 Тап ({tapUpgrades.length})
          </button>
          <button
            onClick={() => setActiveTab('idle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'idle'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Авто ({idleUpgrades.length})
          </button>
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'artifacts'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💎 Реликвии
          </button>
          <button
            onClick={() => setActiveTab('prestige')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'prestige'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌌 Сброс
          </button>
        </div>

        {/* Buy Multiplier Selector (for tap & idle) */}
        {(activeTab === 'tap' || activeTab === 'idle') && (
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono self-end sm:self-auto shrink-0">
            <button
              onClick={() => setBuyMultiplier(1)}
              className={`px-2.5 py-0.5 rounded ${buyMultiplier === 1 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
            >
              1x
            </button>
            <button
              onClick={() => setBuyMultiplier(10)}
              className={`px-2.5 py-0.5 rounded ${buyMultiplier === 10 ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
            >
              10x
            </button>
          </div>
        )}
      </div>

      {/* Upgrade List View */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {/* TAP UPGRADES */}
        {activeTab === 'tap' &&
          tapUpgrades.map(upgrade => {
            const curLvl = purchasedUpgrades[upgrade.id] || 0;
            const cost = calculateCost(upgrade, buyMultiplier);
            const canAfford = coins >= cost;
            const reqLvl = upgrade.unlockedAtLevel ?? upgrade.requiredLevel ?? 1;
            const isUnlocked = currentLevel >= reqLvl;

            return (
              <div
                key={upgrade.id}
                className={`p-3 rounded-2xl border transition-all ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    : canAfford
                      ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl p-2 bg-slate-950/60 rounded-xl border border-slate-800 shrink-0">
                      {upgrade.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100 truncate">{upgrade.name}</span>
                        {curLvl > 0 && (
                          <span className="text-[11px] font-mono bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30 whitespace-nowrap">
                            ур. {curLvl}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 leading-normal truncate">{upgrade.description}</div>
                    </div>
                  </div>

                  {(() => {
                    const maxLevelAllowed = 20 + currentLevel * 8;
                    const isCapped = curLvl >= maxLevelAllowed;

                    if (!isUnlocked) {
                      return (
                        <span className="text-[11px] text-slate-500 font-mono italic shrink-0 whitespace-nowrap">
                          Ур. {upgrade.unlockedAtLevel}
                        </span>
                      );
                    }
                    if (isCapped) {
                      return (
                        <span className="text-[9px] text-amber-400 bg-amber-950/50 border border-amber-500/40 px-2 py-1 rounded-xl font-bold text-center leading-tight max-w-[80px] shrink-0">
                          Лимит ур.
                        </span>
                      );
                    }
                    return (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sound.playCoin();
                          onBuyUpgrade(upgrade, buyMultiplier);
                        }}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all min-w-[84px] shrink-0 whitespace-nowrap ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-mono text-xs">{formatNumber(cost)}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">+{buyMultiplier} Ур.</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}

        {/* IDLE UPGRADES */}
        {activeTab === 'idle' &&
          idleUpgrades.map(upgrade => {
            const curLvl = purchasedUpgrades[upgrade.id] || 0;
            const cost = calculateCost(upgrade, buyMultiplier);
            const canAfford = coins >= cost;
            const reqLvl = upgrade.unlockedAtLevel ?? upgrade.requiredLevel ?? 1;
            const isUnlocked = currentLevel >= reqLvl;

            return (
              <div
                key={upgrade.id}
                className={`p-3 rounded-2xl border transition-all ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    : canAfford
                      ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50'
                      : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl p-2 bg-slate-950/60 rounded-xl border border-slate-800 shrink-0">
                      {upgrade.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100 truncate">{upgrade.name}</span>
                        {curLvl > 0 && (
                          <span className="text-[11px] font-mono bg-slate-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30 whitespace-nowrap">
                            ур. {curLvl}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 leading-normal truncate">{upgrade.description}</div>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.playCoin();
                        onBuyUpgrade(upgrade, buyMultiplier);
                      }}
                      className={`py-1.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all min-w-[84px] shrink-0 whitespace-nowrap ${
                        canAfford
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-mono text-xs">{formatNumber(cost)}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">+{buyMultiplier} Ур.</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono italic shrink-0 whitespace-nowrap">
                      Ур. {upgrade.unlockedAtLevel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        {/* ARTIFACTS / RELICS (GEMS) */}
        {activeTab === 'artifacts' && (
          <div className="space-y-2">
            <div className="text-xs text-purple-300 bg-purple-950/30 border border-purple-800/40 p-2.5 rounded-xl flex items-center justify-between">
              <span>Постоянные реликвии усиливают все параметры игры!</span>
              <span className="font-bold font-mono text-purple-400">💎 {gems}</span>
            </div>

            {artifacts.map(artifact => {
              const curLvl = purchasedArtifacts[artifact.id] || 0;
              const cost = Math.round(artifact.costGems * Math.pow(1.5, curLvl));
              const canAfford = gems >= cost;

              return (
                <div
                  key={artifact.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-purple-800/40 hover:border-purple-500/60 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-purple-950/50 rounded-xl border border-purple-700/50">
                        {artifact.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{artifact.name}</span>
                          {curLvl > 0 && (
                            <span className="text-[11px] font-mono bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/40">
                              ур. {curLvl}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{artifact.description}</div>
                      </div>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.playCoin();
                        onBuyArtifact(artifact);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex flex-col items-center transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-purple-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-mono flex items-center gap-1">
                        <span>💎</span> {cost}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider">Улучшить</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PRESTIGE / ASCENSION */}
        {activeTab === 'prestige' && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-950/30 to-purple-950/30 border border-rose-800/50 text-center space-y-3">
            <span className="text-4xl block">🌌</span>
            <h3 className="text-lg font-black text-white">Космическое Перерождение</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Сбросьте уровни и обычные улучшения, чтобы получить <strong>Космические Осколки</strong>.
              Каждый осколок навсегда даёт <strong>+50% ко всему доходу</strong>!
            </p>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-400">Перерождений:</div>
                <div className="font-mono font-bold text-amber-400 text-sm">{prestigeCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Космических осколков:</div>
                <div className="font-mono font-bold text-rose-400 text-sm">
                  {cosmicShards} (+{cosmicShards * 50}% буст)
                </div>
              </div>
            </div>

            {currentLevel < 25 ? (
              <div className="p-3 bg-slate-900/90 rounded-xl text-xs text-amber-400 border border-amber-500/30 font-medium">
                🔒 Доступно после достижения 25-го уровня (сейчас: {currentLevel})
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-emerald-400 font-bold">
                  При перерождении вы получите: +{shardsOnPrestige} Космических Осколков!
                </div>
                <button
                  disabled={shardsOnPrestige <= 0}
                  onClick={onPrestige}
                  className={`w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${
                    shardsOnPrestige > 0
                      ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-rose-600/30 active:scale-95 hover:brightness-110'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  🚀 Переродиться (+{shardsOnPrestige} Осколков)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
