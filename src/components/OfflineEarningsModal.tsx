import React from 'react';
import { formatNumber, formatDurationHuman } from '../utils/format';
import { sound } from '../utils/audio';

interface OfflineEarningsModalProps {
  elapsedMs: number;
  coinsEarned: number;
  gems: number;
  onClaim: (multiply: boolean) => void;
  onClose: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  elapsedMs,
  coinsEarned,
  gems,
  onClaim,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl text-center">
        <span className="text-5xl block animate-bounce mb-2">😴💤</span>
        <h2 className="text-xl font-black text-white">С возвращением!</h2>
        <p className="text-xs text-slate-300 mt-1">
          Пока вы отдыхали (<strong>{formatDurationHuman(elapsedMs)}</strong>), ваши помощники натапали гору золота!
        </p>

        <div className="my-5 p-4 bg-slate-950/80 rounded-2xl border border-indigo-500/30">
          <span className="text-xs text-slate-400 block uppercase tracking-wider">Заработано оффлайн:</span>
          <span className="font-mono text-3xl font-black text-amber-400 drop-shadow">
            +{formatNumber(coinsEarned)} 🪙
          </span>
        </div>

        <div className="space-y-2">
          {/* Double with gems button */}
          <button
            disabled={gems < 3}
            onClick={() => {
              sound.playCoin();
              onClaim(true);
            }}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              gems >= 3
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 active:scale-95 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>💎 3</span>
            <span>Удвоить награду (x2)!</span>
          </button>

          {/* Regular Claim button */}
          <button
            onClick={() => {
              sound.playCoin();
              onClaim(false);
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs rounded-xl"
          >
            Забрать обычно
          </button>
        </div>
      </div>
    </div>
  );
};
