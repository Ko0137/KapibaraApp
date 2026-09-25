import React, { useState } from 'react';
import { Shirt, Check, Sparkles, Lock, Swords, Eye, Zap, Shield, Flame, RotateCw } from 'lucide-react';
import { CharacterSkin, CharacterHat, CustomCapybaraConfig } from '../types/game';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { computeCharacterComposite } from '../utils/characterComposite';
import { CharacterFighterVisual } from './CharacterFighterVisual';
import { formatNumber } from '../utils/format';
import { hapticEffects } from '../utils/haptics';

interface SkinsModalProps {
  onClose: () => void;
  selectedSkinId: string;
  unlockedSkinIds: string[];
  playerLevel: number;
  playerCoins: number;
  playerGems: number;
  selectedHatId?: string;
  perks?: Record<string, number>;
  immortalUnlocked?: boolean;
  customConfig?: CustomCapybaraConfig;
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skin: CharacterSkin) => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  onClose,
  selectedSkinId,
  unlockedSkinIds,
  playerLevel,
  playerCoins,
  playerGems,
  selectedHatId = 'hat_none',
  perks = {},
  immortalUnlocked = false,
  customConfig,
  onSelectSkin,
  onBuySkin,
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'secret' | 'classic' | 'legendary'>('all');
  const [previewSkinId, setPreviewSkinId] = useState<string>(selectedSkinId);
  const [isAttackingStance, setIsAttackingStance] = useState(false);
  const [inspectSide, setInspectSide] = useState<'left' | 'right'>('left');

  const activeHat = CHARACTER_HATS.find((h) => h.id === selectedHatId) || CHARACTER_HATS[0];
  const activePreviewSkin = CHARACTER_SKINS.find((s) => s.id === previewSkinId) || CHARACTER_SKINS[0];
  
  // Calculate composite stats for preview with active mutations
  const previewStats = computeCharacterComposite(
    activePreviewSkin,
    activeHat,
    perks,
    playerLevel,
    immortalUnlocked
  );

  const filteredSkins = CHARACTER_SKINS.filter((s) => {
    if (selectedTab === 'secret') return s.rarity === 'secret' || s.isSecret;
    if (selectedTab === 'classic') return s.rarity === 'common' || s.rarity === 'rare';
    if (selectedTab === 'legendary') return s.rarity === 'legendary' || s.rarity === 'epic';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-purple-500/40 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Shirt className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Гардероб & Скины Персонажа
              </h2>
              <p className="text-[11px] text-zinc-400">Все скины комбинируются с мутациями прокачки и навыками</p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticEffects.tap();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* HERO SHOWCASE PODIUM - LARGE & PROMINENT */}
        <div className="relative my-3 p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center shadow-inner overflow-hidden">
          {/* Subtle Ambient Stage Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-zinc-900/10 to-amber-950/20 pointer-events-none" />
          
          {/* Action Toolbar on Podium */}
          <div className="w-full flex items-center justify-between mb-1 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-800">
              Подиум Героя: {activePreviewSkin.name}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  hapticEffects.tap();
                  setInspectSide((prev) => (prev === 'left' ? 'right' : 'left'));
                }}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1 border border-zinc-700 shadow-sm"
                title="Повернуть персонажа"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  hapticEffects.tap();
                  setIsAttackingStance((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-all ${
                  isAttackingStance
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
                title="Переключить стойку атаки"
              >
                <Swords className="w-3.5 h-3.5" /> {isAttackingStance ? 'Бой' : 'Чилл'}
              </button>
            </div>
          </div>

          {/* Large Hero Character Visual */}
          <div className="my-2 z-10 flex flex-col items-center">
            <CharacterFighterVisual
              skin={activePreviewSkin}
              hat={activeHat}
              stats={previewStats}
              customConfig={customConfig}
              isAttacking={isAttackingStance}
              side={inspectSide}
              size="xl"
              showStatsBadge={true}
              showMutationBadges={true}
            />
          </div>

          <div className="z-10 mt-1 text-center">
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {activePreviewSkin.bonusDescription}
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[
            { id: 'all', label: 'Все' },
            { id: 'secret', label: '🦸 Секретки' },
            { id: 'classic', label: '👔 Классика' },
            { id: 'legendary', label: '👑 Легенды' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                hapticEffects.tap();
                setSelectedTab(tab.id as any);
              }}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all text-center ${
                selectedTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skins Grid List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredSkins.map((skin) => {
            const isUnlocked = unlockedSkinIds.includes(skin.id);
            const isSelected = selectedSkinId === skin.id;
            const isPreviewing = previewSkinId === skin.id;
            const isLevelLocked = skin.requiredLevel ? playerLevel < skin.requiredLevel : false;
            const canAffordCoins = !skin.costCoins || playerCoins >= skin.costCoins;
            const canAffordGems = !skin.costGems || playerGems >= skin.costGems;
            const canAfford = canAffordCoins && canAffordGems;

            const rarityColors: Record<string, string> = {
              common: 'border-zinc-700 bg-zinc-850/60',
              rare: 'border-blue-500/40 bg-blue-950/20',
              epic: 'border-purple-500/40 bg-purple-950/20',
              legendary: 'border-amber-500/50 bg-amber-950/25 shadow-md shadow-amber-500/10',
              secret: 'border-rose-500/60 bg-gradient-to-r from-rose-950/30 via-purple-950/30 to-zinc-900/60 shadow-md shadow-rose-500/15',
            };

            return (
              <div
                key={skin.id}
                onClick={() => setPreviewSkinId(skin.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isPreviewing
                    ? 'ring-2 ring-purple-500/80'
                    : ''
                } ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/40'
                    : rarityColors[skin.rarity] || 'border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {skin.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">
                        {skin.name}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          skin.rarity === 'secret'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : skin.rarity === 'legendary'
                            ? 'bg-amber-400 text-black'
                            : skin.rarity === 'epic'
                            ? 'bg-purple-600 text-white'
                            : skin.rarity === 'rare'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {skin.rarity === 'secret' ? 'СЕКРЕТ' : skin.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{skin.description}</p>
                    {skin.secretHint && !isUnlocked && (
                      <p className="text-[10px] text-rose-400/90 font-bold mt-0.5 flex items-center gap-1">
                        🔒 {skin.secretHint}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {skin.bonusDescription}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 flex flex-col items-end">
                  {isSelected ? (
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow">
                      <Check className="w-3.5 h-3.5" /> Надет
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticEffects.tap();
                        onSelectSkin(skin.id);
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-700 transition-colors shadow-sm"
                    >
                      Надеть
                    </button>
                  ) : skin.rarity === 'secret' ? (
                    <span className="bg-rose-950/60 border border-rose-600/40 text-rose-300 text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Секрет
                    </span>
                  ) : isLevelLocked ? (
                    <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Ур. {skin.requiredLevel}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canAfford) {
                          hapticEffects.purchase();
                          onBuySkin(skin);
                        }
                      }}
                      disabled={!canAfford}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-transform active:scale-95 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {skin.costCoins && <span>🪙 {formatNumber(skin.costCoins)}</span>}
                      {skin.costGems && <span>💎 {skin.costGems}</span>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-400">
          Скины дают постоянный бонус и визуально комбинируются со всеми ветками прокачки!
        </div>

      </div>
    </div>
  );
};

