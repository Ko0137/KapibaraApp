import React, { useState } from 'react';
import { Layers, Sparkles, TrendingUp, Key, Lock, Plus, AlertCircle } from 'lucide-react';
import { HamsterCard } from '../types/game';
import { HAMSTER_CARDS } from '../data/cards';
import { formatNumber } from '../utils/format';
import { hapticEffects } from '../utils/haptics';
import { getCardUpgradeCost } from '../utils/cardEconomics';

interface CardsModalProps {
  onClose: () => void;
  playerLevel: number;
  playerCoins: number;
  purchasedCards: Record<string, number>;
  onBuyCard: (card: HamsterCard, cost: number) => void;
}

export const CardsModal: React.FC<CardsModalProps> = ({
  onClose,
  playerLevel,
  playerCoins,
  purchasedCards,
  onBuyCard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'memes' | 'pr' | 'legal' | 'tech' | 'specials'>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'cost' | 'level' | 'purchased'>('profit');

  const filteredCards = HAMSTER_CARDS.filter(
    (c) => selectedCategory === 'all' || c.category === selectedCategory
  ).sort((a, b) => {
    const lvlA = purchasedCards[a.id] || 0;
    const lvlB = purchasedCards[b.id] || 0;
    const costA = getCardUpgradeCost(a, lvlA, playerLevel);
    const costB = getCardUpgradeCost(b, lvlB, playerLevel);

    if (sortBy === 'profit') {
      return b.profitPerHourBase - a.profitPerHourBase;
    } else if (sortBy === 'cost') {
      return costA - costB;
    } else if (sortBy === 'level') {
      return a.requiredLevel - b.requiredLevel;
    } else if (sortBy === 'purchased') {
      return lvlB - lvlA;
    }
    return 0;
  });

  // Total profit per hour from cards
  const totalCardsProfitPerHour = HAMSTER_CARDS.reduce((sum, card) => {
    const lvl = purchasedCards[card.id] || 0;
    return sum + (lvl * card.profitPerHourBase);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-emerald-500/40 w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Инвест-Карточки
                <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded-full">
                  HAMSTER
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Прибыль в час: <span className="text-emerald-400 font-extrabold">+{formatNumber(totalCardsProfitPerHour)}/ч</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Level Cost Scaling Note */}
        {playerLevel > 10 && (
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Инфляция {playerLevel} ур: стоимость карточек растет с ростом уровня игрока!</span>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="grid grid-cols-6 gap-1 my-2">
          {[
            { id: 'all', label: 'Все' },
            { id: 'memes', label: 'Мемы' },
            { id: 'pr', label: 'PR' },
            { id: 'legal', label: 'Legal' },
            { id: 'tech', label: 'Tech' },
            { id: 'specials', label: 'Спец' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => {
                hapticEffects.tap();
                setSelectedCategory(tab.id as any);
              }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Controls Bar */}
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-zinc-400">
          <span className="font-bold">Сортировка:</span>
          <div className="flex items-center gap-1">
            {[
              { id: 'profit', label: '📈 Прибыль' },
              { id: 'cost', label: '🪙 Цена' },
              { id: 'level', label: '🔒 Уровень' },
              { id: 'purchased', label: '⭐ Прокачка' },
            ].map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  hapticEffects.tap();
                  setSortBy(s.id as any);
                }}
                className={`px-2 py-0.5 rounded-lg border font-extrabold text-[10px] transition-all ${
                  sortBy === s.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredCards.map((card) => {
            const currentLvl = purchasedCards[card.id] || 0;
            const cost = getCardUpgradeCost(card, currentLvl, playerLevel);
            const isLevelLocked = playerLevel < card.requiredLevel;
            const canAfford = playerCoins >= cost;
            const nextProfit = card.profitPerHourBase;

            return (
              <div
                key={card.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLevelLocked
                    ? 'bg-zinc-950/60 border-zinc-850 opacity-60'
                    : currentLvl > 0
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-zinc-850/70 border-zinc-700/80 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {card.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">
                          {card.title}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-900 text-emerald-400 border border-zinc-800">
                          Ур. {currentLvl}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{card.description}</p>
                      
                      {/* Profit bonus */}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +{formatNumber(nextProfit)}/ч
                        </span>
                        {card.unlocksBranchName && (
                          <span className="text-amber-400 font-extrabold flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded-lg text-[10px]">
                            <Key className="w-2.5 h-2.5" /> Ветка: {card.unlocksBranchName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <div className="shrink-0 flex flex-col items-end">
                    {isLevelLocked ? (
                      <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Ур. {card.requiredLevel}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            hapticEffects.purchase();
                            onBuyCard(card, cost);
                          }
                        }}
                        disabled={!canAfford}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-transform active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>🪙 {formatNumber(cost)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Карточки пассивно приносят доход даже когда вы не в игре!
        </div>

      </div>
    </div>
  );
};
