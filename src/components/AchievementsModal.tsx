import React from 'react';
import { Award, CheckCircle2, Lock, Sparkles, Volume2 } from 'lucide-react';
import { MEME_ACHIEVEMENTS } from '../data/memeAchievements';
import { hapticEffects } from '../utils/haptics';
import { sound } from '../utils/audio';

interface AchievementsModalProps {
  onClose: () => void;
  playerLevel: number;
  unlockedAchievements: string[];
  onClaimAchievement: (achievementId: string, rewardGems: number) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  onClose,
  playerLevel,
  unlockedAchievements,
  onClaimAchievement,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-yellow-500/40 w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-white flex flex-wrap items-center gap-1.5 leading-tight">
                <span>Мемотека & Достижения</span>
                <span className="text-[9px] bg-yellow-500 text-black font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  MEMES & SOUNDS 🔊
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">
                Открыто {unlockedAchievements.length} из {MEME_ACHIEVEMENTS.length} легендарных мемов
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Achievements list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1 custom-scrollbar">
          {MEME_ACHIEVEMENTS.map((ach) => {
            const isEligible = playerLevel >= ach.requiredLevel;
            const isClaimed = unlockedAchievements.includes(ach.id);

            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isClaimed
                    ? 'bg-zinc-850/80 border-yellow-500/40'
                    : isEligible
                    ? 'bg-yellow-950/30 border-yellow-500/70 shadow-lg shadow-yellow-500/10 ring-1 ring-yellow-400/30'
                    : 'bg-zinc-950/60 border-zinc-850 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEligible) {
                          hapticEffects.tap();
                          sound.playAchievement();
                        }
                      }}
                      title={isEligible ? "Нажми, чтобы прослушать мемный звук" : "Заблокировано"}
                      className={`w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-2xl shrink-0 shadow-inner transition-transform active:scale-95 ${
                        isEligible ? 'hover:border-yellow-400 cursor-pointer' : ''
                      }`}
                    >
                      {isEligible ? ach.icon : '🔒'}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-white truncate">
                          {ach.title}
                        </span>
                        <span className="text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded-md border border-zinc-800 whitespace-nowrap">
                          Ур. {ach.requiredLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug break-words">{ach.conditionDesc}</p>
                      {isEligible && (
                        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                          <p className="text-[11px] text-yellow-300 font-semibold italic bg-yellow-950/40 p-1.5 rounded-xl border border-yellow-800/40 flex-1 break-words leading-tight min-w-0">
                            {ach.memeQuote}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              hapticEffects.tap();
                              sound.playAchievement();
                            }}
                            className="p-1.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 transition-transform active:scale-90 shrink-0"
                            title="Слушать мемный звук"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="shrink-0 flex flex-col items-end pl-1">
                    {isClaimed ? (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-xl whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Получено
                      </span>
                    ) : isEligible ? (
                      <button
                        type="button"
                        onClick={() => {
                          hapticEffects.goldenCatch();
                          sound.playAchievement();
                          onClaimAchievement(ach.id, ach.rewardGems);
                        }}
                        className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 transition-transform active:scale-95 animate-bounce cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>+{ach.rewardGems} 💎</span>
                      </button>
                    ) : (
                      <span className="text-zinc-500 text-[9px] font-bold flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl whitespace-nowrap">
                        <Lock className="w-2.5 h-2.5" /> Ур. {ach.requiredLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-zinc-800 text-center text-[11px] text-zinc-400 shrink-0">
          Проходи уровни, открывай любимые мемы и забирай горы кристаллов!
        </div>

      </div>
    </div>
  );
};
