import React from 'react';
import { Sparkles, CheckCircle2, Lock, Gift, Zap } from 'lucide-react';
import { HAMSTER_CARDS, DAILY_COMBO_CARD_IDS, DAILY_COMBO_REWARD_COINS } from '../data/cards';
import { formatNumber } from '../utils/format';
import { hapticEffects } from '../utils/haptics';
import { sound } from '../utils/audio';

interface DailyComboModalProps {
  onClose: () => void;
  ownedCards: Record<string, number>;
  dailyComboClaimedDate?: string;
  onClaimDailyCombo: () => void;
  onOpenCards: () => void;
}

export const DailyComboModal: React.FC<DailyComboModalProps> = ({
  onClose,
  ownedCards,
  dailyComboClaimedDate,
  onClaimDailyCombo,
  onOpenCards,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const isClaimedToday = dailyComboClaimedDate === today;

  const comboCards = DAILY_COMBO_CARD_IDS.map((cardId) => {
    const cardDef = HAMSTER_CARDS.find((c) => c.id === cardId);
    const level = ownedCards[cardId] || 0;
    const isUnlocked = level > 0;
    return {
      cardDef,
      level,
      isUnlocked,
    };
  });

  const unlockedCount = comboCards.filter((c) => c.isUnlocked).length;
  const isReadyToClaim = unlockedCount === 3 && !isClaimedToday;

  const handleClaim = () => {
    if (!isReadyToClaim) return;
    hapticEffects.bossDefeat();
    sound.playLevelUp();
    onClaimDailyCombo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-amber-500/40 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Мемное Комбо Дня
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold px-1.5 py-0.5 rounded-full">
                  5,000,000 🪙
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Собери 3 карты дня и сорви мега-куш!</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Reward Showcase Banner */}
        <div className="my-3 p-3 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 rounded-2xl border border-amber-500/30 text-center">
          <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
            Главный Приз Дня
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono my-0.5">
            +{formatNumber(DAILY_COMBO_REWARD_COINS)} КОИНОВ
          </div>
          <p className="text-[10px] text-zinc-400">
            {isClaimedToday
              ? '✅ Награда за сегодня уже получена! Новое комбо через 24 часа.'
              : `Прокачай все 3 карты хотя бы на 1 уровень (${unlockedCount}/3)`}
          </p>
        </div>

        {/* 3 Combo Cards Display */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {comboCards.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center min-h-[120px] transition-all ${
                item.isUnlocked
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-zinc-850/80 border-zinc-750'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-center text-2xl shadow-inner">
                {item.cardDef?.icon || '❓'}
              </div>
              <div className="my-1">
                <span className="font-extrabold text-[11px] text-white line-clamp-1">
                  {item.cardDef?.title || 'Секретная карта'}
                </span>
                <span className="text-[9px] text-zinc-400 block">
                  {item.isUnlocked ? `Ур. ${item.level}` : 'Не куплена'}
                </span>
              </div>
              {item.isUnlocked ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Готово
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                  <Lock className="w-3 h-3" /> Закрыто
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Claim / Go to Cards Actions */}
        <div className="mt-3 space-y-2">
          {isClaimedToday ? (
            <div className="w-full py-2.5 rounded-2xl bg-zinc-800 text-zinc-400 font-extrabold text-xs text-center border border-zinc-700">
              🎉 Комбо забрано! Возвращайся завтра
            </div>
          ) : isReadyToClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm shadow-lg shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 animate-pulse"
            >
              <Gift className="w-4 h-4 fill-black" />
              <span>ЗАБРАТЬ 5,000,000 КОИНОВ!</span>
            </button>
          ) : (
            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
                onOpenCards();
              }}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Купить карты в Шахте ({unlockedCount}/3)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
