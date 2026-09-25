import React from 'react';
import { BatteryCharging, Zap, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { hapticEffects } from '../utils/haptics';

interface EnergyBoostModalProps {
  onClose: () => void;
  energy?: number;
  currentEnergy?: number;
  maxEnergy: number;
  fullEnergyBoostsLeft: number;
  turboBoostsLeft: number;
  onUseFullEnergy: () => void;
  onUseTurboBoost?: () => void;
  onUseTurbo?: () => void;
}

export const EnergyBoostModal: React.FC<EnergyBoostModalProps> = ({
  onClose,
  energy,
  currentEnergy,
  maxEnergy,
  fullEnergyBoostsLeft,
  turboBoostsLeft,
  onUseFullEnergy,
  onUseTurboBoost,
  onUseTurbo,
}) => {
  const actualEnergy = typeof currentEnergy === 'number' ? currentEnergy : (energy ?? 0);
  const handleTurbo = () => {
    if (onUseTurbo) onUseTurbo();
    else if (onUseTurboBoost) onUseTurboBoost();
  };
  const energyPercent = Math.min(100, Math.round((actualEnergy / maxEnergy) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-cyan-500/40 w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Бустеры & Запас Энергии
              </h2>
              <p className="text-xs text-zinc-400">Суточные лимиты предотвращают спидран игры</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Current Energy Bar */}
        <div className="my-3 p-4 bg-zinc-800/80 rounded-2xl border border-zinc-700/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-cyan-400" /> Текущая Энергия
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {energy} / {maxEnergy} ({energyPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>Восстановление: +3 ед. в секунду</span>
            <span>1 тап = 1 энергия</span>
          </p>
        </div>

        {/* Boosters List with Daily Caps */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {/* Boost 1: Full Energy Refill */}
          <div className="p-3.5 bg-zinc-800/60 rounded-2xl border border-cyan-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-2xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">
                    Полная Энергия (Full Refill)
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded-full font-bold">
                    {fullEnergyBoostsLeft} / 6 в день
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Мгновенно восстанавливает 100% энергии до максимума.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (fullEnergyBoostsLeft > 0) {
                  hapticEffects.purchase();
                  onUseFullEnergy();
                }
              }}
              disabled={fullEnergyBoostsLeft <= 0}
              className={`text-xs font-black px-3 py-2 rounded-xl shrink-0 transition-transform active:scale-95 ${
                fullEnergyBoostsLeft > 0
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {fullEnergyBoostsLeft > 0 ? 'Зарядить' : 'Лимит'}
            </button>
          </div>

          {/* Boost 2: Turbo Frenzy Strike */}
          <div className="p-3.5 bg-zinc-800/60 rounded-2xl border border-pink-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-2xl shrink-0">
                🚀
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">
                    Турбо-Шлёп (x5 урон на 20 сек)
                  </span>
                  <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-1.5 py-0.5 rounded-full font-bold">
                    {turboBoostsLeft} / 3 в день
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Умножает силу тапа в 5 раз и активирует режим безумия.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (turboBoostsLeft > 0) {
                  hapticEffects.feverStart();
                  handleTurbo();
                }
              }}
              disabled={turboBoostsLeft <= 0}
              className={`text-xs font-black px-3 py-2 rounded-xl shrink-0 transition-transform active:scale-95 ${
                turboBoostsLeft > 0
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {turboBoostsLeft > 0 ? 'Включить' : 'Лимит'}
            </button>
          </div>

          {/* Fair-Play Limit explanation */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-zinc-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Защита от быстрого прохождения:</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Бустеры ограничены суточными квотами (обновляются в 00:00). Это гарантирует долгий и честный игровой процесс на 165+ уровней.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Лимиты бустеров сбрасываются каждые 24 часа!
        </div>

      </div>
    </div>
  );
};
