import React, { useState } from 'react';
import { SecretEvent } from '../types/game';
import { SECRET_EVENTS } from '../data/secretEvents';
import { CHARACTER_SKINS } from '../data/skins';
import { Sparkles, Check, Gift, EyeOff, Radio, Compass, Shield, X, Award, HelpCircle } from 'lucide-react';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';

interface SecretEventsModalProps {
  onClose: () => void;
  unlockedSecretEvents: string[];
  unlockedSkinIds?: string[];
  onClaimSecretSkin?: (skinId: string) => void;
}

export const SecretEventsModal: React.FC<SecretEventsModalProps> = ({
  onClose,
  unlockedSecretEvents,
  unlockedSkinIds = [],
  onClaimSecretSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'secret_skins'>('events');

  const unlockedSet = new Set(unlockedSecretEvents);

  // CRITICAL REQUIREMENT: Only show events that are ALREADY UNLOCKED.
  // Do NOT show locked events and do NOT reveal total count.
  const discoveredEvents = SECRET_EVENTS.filter((ev) => unlockedSet.has(ev.id));

  // Secret Superhero Crossover Skins
  const secretSkins = CHARACTER_SKINS.filter((s) => s.rarity === 'secret' || s.isSecret);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                Тайный Архив Вселенной
                <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded-full">
                  SECRETS
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Скрытые события мира Капибары и тайные супергерои</p>
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

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveTab('events');
            }}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Раскрытые Тайны ({discoveredEvents.length})
          </button>
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveTab('secret_skins');
            }}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'secret_skins'
                ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Секретные Скины (Marvel/DC)
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'events' ? (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {discoveredEvents.length === 0 ? (
              <div className="my-6 p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-3 text-amber-400 animate-pulse">
                  <EyeOff className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-sm text-white mb-1">Ни одной тайны пока не обнаружено</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Секретные события скрыты по всему миру: пробуй необычные комбинации тапов, побеждай в Сделках, тапай ночью, прокачивай редкие перки и исследуй неизведанное!
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-full">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>Радар аномалий активен...</span>
                </div>
              </div>
            ) : (
              discoveredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-2xl border bg-gradient-to-r from-amber-950/25 via-zinc-900/60 to-zinc-900 border-amber-500/40 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20">
                        {event.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-xs text-white truncate">
                            {event.title}
                          </h4>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-md font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                            <Check className="w-2.5 h-2.5" /> Открыто
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-300 mt-0.5 leading-tight break-words">
                          {event.revealedDesc}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-amber-400">
                          <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            Награда получена:{' '}
                            {event.rewardType === 'gems' && `${event.rewardValue} 💎 Кристаллов`}
                            {event.rewardType === 'skin' && `Скин «${event.rewardValue}»`}
                            {event.rewardType === 'hat' && `Головной убор «${event.rewardValue}»`}
                            {event.rewardType === 'perk_point' && `+${event.rewardValue} Очков Навыков ✦`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Secret Superhero Skins Altarium */
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-rose-950/40 border border-purple-500/40 text-xs text-zinc-300">
              <span className="font-black text-amber-300 block mb-0.5">🌌 Мультивселенная Секретных Героев</span>
              Раскрывая тайны и секретные достижения, вы разблокируете легендарных персонажей Marvel, DC и культовых игровых франшиз!
            </div>

            {secretSkins.map((skin) => {
              const isUnlocked = unlockedSkinIds.includes(skin.id);

              return (
                <div
                  key={skin.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isUnlocked
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-500/15'
                      : 'bg-zinc-950/80 border-zinc-800/80 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {isUnlocked ? skin.icon : '❓'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-white truncate">
                          {isUnlocked ? skin.name : 'Секретный Герой Мультивселенной'}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-600 text-white whitespace-nowrap">
                          {skin.universe ? skin.universe.toUpperCase() : 'SECRET'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight break-words">
                        {isUnlocked ? skin.description : skin.secretHint}
                      </p>
                      <p className="text-[11px] font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate">{skin.bonusDescription}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <span className="bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 whitespace-nowrap">
                        <Check className="w-3.5 h-3.5" /> Открыт
                      </span>
                    ) : (
                      <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap">
                        Тайное условие
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2.5 mt-2 border-t border-zinc-800 text-[10px] text-zinc-400 text-center">
          Каждое скрытое действие приближает вас к новым скинам мультивселенной.
        </div>

      </div>
    </div>
  );
};

