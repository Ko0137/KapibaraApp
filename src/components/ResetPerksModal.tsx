import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Check, Gem, Scroll, X, CreditCard, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';

interface ResetPerksModalProps {
  onClose: () => void;
  playerGems: number;
  respecTokens: number;
  totalPerkPointsToRefund: number;
  onConfirmReset: (method: 'token' | 'gems' | 'donate') => void;
}

export const ResetPerksModal: React.FC<ResetPerksModalProps> = ({
  onClose,
  playerGems,
  respecTokens,
  totalPerkPointsToRefund,
  onConfirmReset,
}) => {
  // Auto select available method
  const defaultMethod = respecTokens > 0 ? 'token' : playerGems >= 50 ? 'gems' : 'donate';
  const [selectedMethod, setSelectedMethod] = useState<'token' | 'gems' | 'donate'>(defaultMethod);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const canAffordGems = playerGems >= 50;

  const handleExecuteReset = () => {
    hapticEffects.heavyTap();
    sound.playUpgrade();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccessNotice(true);
      setTimeout(() => {
        onConfirmReset(selectedMethod);
        onClose();
      }, 1100);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-purple-500/50 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white relative">
        
        {/* Background ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                Сброс Билда & Навыков
                <span className="text-[10px] bg-purple-500 text-black font-extrabold px-1.5 py-0.5 rounded-full">
                  SOULSLIKE
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Перераспределение очков и пересборка класса</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success overlay */}
        {successNotice ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">Память Капибары Очищена!</h3>
            <p className="text-xs text-emerald-400 mt-1">
              Возвращено <span className="font-extrabold text-amber-300">✦ {totalPerkPointsToRefund} очков талантов</span>
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar py-3 pr-1 space-y-3">
            {/* Lore Box */}
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-zinc-300 space-y-1">
              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-purple-400" />
                Очищение Памяти Капибарыча
              </div>
              <p className="text-zinc-400 leading-snug">
                Сбросив древо навыков, вы моментально вернете <span className="text-amber-400 font-extrabold">✦ {totalPerkPointsToRefund} очков</span> и сможете свободно собрать другой класс (Мутанта-Качка, Мага Эфира, Самурая или Золотого Шейха).
              </p>
            </div>

            {/* Payment Options */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300">Выберите способ сброса:</div>

              {/* Option 1: Respec Scroll Token */}
              <div
                onClick={() => {
                  if (respecTokens > 0) {
                    hapticEffects.tap();
                    setSelectedMethod('token');
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedMethod === 'token'
                    ? 'bg-purple-900/50 border-purple-400 ring-2 ring-purple-400/40 shadow-lg'
                    : respecTokens > 0
                    ? 'bg-zinc-800/80 border-zinc-700 hover:border-purple-400/50'
                    : 'bg-zinc-950/40 border-zinc-850 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 text-xl shrink-0">
                    📜
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                      Свиток Забвения Душ
                      {respecTokens > 0 && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-md font-bold">
                          В наличии: {respecTokens} шт.
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {respecTokens > 0 ? 'Бесплатное списание из инвентаря' : 'Свитков нет в инвентаре'}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-purple-300 shrink-0">
                  {respecTokens > 0 ? '1 Свиток' : '0 шт.'}
                </div>
              </div>

              {/* Option 2: Gems */}
              <div
                onClick={() => {
                  if (canAffordGems) {
                    hapticEffects.tap();
                    setSelectedMethod('gems');
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedMethod === 'gems'
                    ? 'bg-indigo-900/50 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg'
                    : canAffordGems
                    ? 'bg-zinc-800/80 border-zinc-700 hover:border-indigo-400/50'
                    : 'bg-zinc-950/40 border-zinc-850 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-xl shrink-0">
                    💎
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">Кристаллы Эфира</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Баланс: <span className="text-indigo-300 font-bold">{playerGems} 💎</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black text-indigo-300 flex items-center gap-1 shrink-0">
                  <Gem className="w-3.5 h-3.5" /> 50 💎
                </div>
              </div>

              {/* Option 3: Real Money / VIP / Stars */}
              <div
                onClick={() => {
                  hapticEffects.tap();
                  setSelectedMethod('donate');
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedMethod === 'donate'
                    ? 'bg-emerald-900/50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                    : 'bg-zinc-800/80 border-zinc-700 hover:border-emerald-400/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xl shrink-0">
                    💳
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white flex items-center gap-1">
                      VIP Сброс за $0.99 / Stars ⭐
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded font-black">VIP</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Мгновенное очищение без траты кристаллов</div>
                  </div>
                </div>
                <div className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded-xl shrink-0">
                  ⭐ 50 Stars / $0.99
                </div>
              </div>
            </div>

            {/* Warning info */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300/90">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>После клика все очки навыков будут полностью возвращены на баланс.</span>
            </div>

            {/* Action buttons footer */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs rounded-2xl transition-colors active:scale-95"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={
                  isProcessing ||
                  (selectedMethod === 'token' && respecTokens <= 0) ||
                  (selectedMethod === 'gems' && !canAffordGems)
                }
                className="flex-[2] py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Сброс билда...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Подтвердить Сброс ({selectedMethod === 'token' ? '1 Свиток' : selectedMethod === 'gems' ? '50 💎' : '$0.99'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
