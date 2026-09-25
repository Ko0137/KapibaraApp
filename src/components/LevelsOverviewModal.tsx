import React, { useState } from 'react';
import { GameLevel } from '../types/game';
import { GAME_LEVELS } from '../data/levels';
import { formatNumber } from '../utils/format';

interface LevelsOverviewModalProps {
  currentLevelNumber: number;
  completedBosses: number[];
  onClose: () => void;
}

export const LevelsOverviewModal: React.FC<LevelsOverviewModalProps> = ({
  currentLevelNumber,
  completedBosses,
  onClose
}) => {
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique eras
  const eras = Array.from(new Set(GAME_LEVELS.map(l => l.era)));

  const filteredLevels = GAME_LEVELS.filter(level => {
    const matchesEra = selectedEra === 'all' || level.era === selectedEra;
    const matchesQuery = !searchQuery || 
      level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      level.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      level.level.toString() === searchQuery;
    return matchesEra && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-black text-white">Карта Эволюции (165 Уровней)</h2>
              <span className="text-[11px] text-slate-400">
                Текущий уровень: <strong className="text-amber-400">{currentLevelNumber} / 165</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-2 mt-3 mb-3">
          <input
            type="text"
            placeholder="Поиск по названию или номеру уровня..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedEra('all')}
              className={`px-3 py-1 rounded-xl whitespace-nowrap font-bold transition-all ${
                selectedEra === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Все эпохи (165)
            </button>
            {eras.map(era => (
              <button
                key={era}
                onClick={() => setSelectedEra(era)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap font-bold transition-all ${
                  selectedEra === era
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>

        {/* Levels Grid / List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredLevels.map(level => {
            const isCurrent = level.level === currentLevelNumber;
            const isCompleted = level.level < currentLevelNumber;
            const isLocked = level.level > currentLevelNumber;
            const isBossDefeated = completedBosses.includes(level.level);

            return (
              <div
                key={level.level}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-500/20'
                    : isCompleted
                      ? 'bg-slate-950/60 border-slate-800/60'
                      : 'bg-slate-900/40 border-slate-800/40 opacity-60'
                } ${level.isBoss ? 'border-red-500/40 bg-red-950/15' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-11 h-11 bg-slate-950 rounded-xl border border-slate-800 text-2xl">
                    {level.icon}
                    {isCompleted && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        #{level.level}
                      </span>
                      <span className="font-bold text-sm text-slate-100">
                        {level.name}
                      </span>
                      {level.isBoss && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                          {isBossDefeated ? 'БОСС ✓' : 'БОСС'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 italic line-clamp-1">
                      {level.description}
                    </div>
                  </div>
                </div>

                <div className="text-right pl-2">
                  {isCurrent ? (
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full">
                      СЕЙЧАС
                    </span>
                  ) : isCompleted ? (
                    <span className="text-emerald-400 font-bold text-xs font-mono">
                      Пройден
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">
                      🔒 {formatNumber(level.clicksRequired)} тапов
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
