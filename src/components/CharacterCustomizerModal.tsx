import React, { useState } from 'react';
import { Sparkles, Palette, Scissors, Smile, Zap, Check, RotateCw, X, Shield, Swords } from 'lucide-react';
import { CustomCapybaraConfig } from '../types/game';
import {
  FUR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  TEETH_OPTIONS,
  EYE_OPTIONS,
  DEFAULT_CUSTOM_CAPYBARA,
} from '../data/customizerOptions';
import { CapybaraAvatarRenderer } from './CapybaraAvatarRenderer';
import { computeCharacterComposite } from '../utils/characterComposite';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { hapticEffects } from '../utils/haptics';
import { sound } from '../utils/audio';

interface CharacterCustomizerModalProps {
  initialConfig?: CustomCapybaraConfig;
  initialPerks?: Record<string, number>;
  onSave: (config: CustomCapybaraConfig, allocatedPerks: Record<string, number>) => void;
  onClose?: () => void;
  isFirstLaunch?: boolean;
}

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  initialConfig = DEFAULT_CUSTOM_CAPYBARA,
  initialPerks = {},
  onSave,
  onClose,
  isFirstLaunch = false,
}) => {
  const [config, setConfig] = useState<CustomCapybaraConfig>({
    ...DEFAULT_CUSTOM_CAPYBARA,
    ...initialConfig,
  });

  const [activeTab, setActiveTab] = useState<'fur' | 'hair' | 'teeth' | 'eyes' | 'stats'>('fur');
  const [inspectSide, setInspectSide] = useState<'left' | 'right'>('left');

  // Initial 5 Skill Points allocation
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({
    perk_heavy_bones: initialPerks['perk_heavy_bones'] || 0, // STR
    perk_swift_claws: initialPerks['perk_swift_claws'] || 0, // DEX
    perk_mana_spark: initialPerks['perk_mana_spark'] || 0,   // INT
    perk_vitality_core: initialPerks['perk_vitality_core'] || 0, // VIT
    perk_sheikh_wealth: initialPerks['perk_sheikh_wealth'] || 0, // LCK
  });

  const totalAllocated = Object.values(allocatedPoints).reduce((a, b) => a + b, 0);
  const remainingPoints = Math.max(0, 5 - totalAllocated);

  const previewStats = computeCharacterComposite(
    CHARACTER_SKINS[0],
    CHARACTER_HATS[0],
    { ...initialPerks, ...allocatedPoints },
    1,
    false
  );

  const handlePointChange = (perkId: string, delta: number) => {
    const cur = allocatedPoints[perkId] || 0;
    if (delta > 0 && remainingPoints <= 0) return;
    if (delta < 0 && cur <= 0) return;

    hapticEffects.tap();
    sound.playUpgrade();
    setAllocatedPoints((prev) => ({
      ...prev,
      [perkId]: Math.max(0, cur + delta),
    }));
  };

  const handleFinish = () => {
    hapticEffects.purchase();
    sound.playLevelUp();
    onSave({ ...config, initialSetupDone: true }, allocatedPoints);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-zinc-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Palette className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                {isFirstLaunch ? 'Создание Твоей Капибары' : 'Гардероб & Кастомизация'}
                <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded-full">
                  BUILD
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Настрой шерсть, стиль, зубы и первые 5 очков навыков</p>
            </div>
          </div>
          {onClose && !isFirstLaunch && (
            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
              }}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* LIVE LARGE SHOWCASE STAGE */}
        <div className="relative my-2 p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center shadow-inner overflow-hidden">
          <div className="w-full flex items-center justify-between mb-1 z-10">
            <span className="text-[10px] font-black uppercase text-amber-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
              {config.furColorName} • {config.hairStyleName}
            </span>
            <button
              onClick={() => {
                hapticEffects.tap();
                setInspectSide((prev) => (prev === 'left' ? 'right' : 'left'));
              }}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1 border border-zinc-700 shadow-sm"
              title="Развернуть"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-2 z-10 flex flex-col items-center justify-center">
            <CapybaraAvatarRenderer
              customConfig={config}
              skin={CHARACTER_SKINS[0]}
              hat={CHARACTER_HATS[0]}
              stats={previewStats}
              side={inspectSide}
              size="xl"
            />
          </div>

          {/* Active Mutation Indicators */}
          <div className="z-10 flex flex-wrap items-center justify-center gap-1 mt-1">
            {previewStats.isMuscular && (
              <span className="text-[9px] bg-red-950/80 border border-red-500/50 text-red-300 px-1.5 py-0.5 rounded font-black">
                💪 Мускулатура (STR {previewStats.str})
              </span>
            )}
            {previewStats.hasSpeedSparks && (
              <span className="text-[9px] bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 px-1.5 py-0.5 rounded font-black">
                ⚡ Скорость (DEX {previewStats.dex})
              </span>
            )}
            {previewStats.hasMagicRunes && (
              <span className="text-[9px] bg-purple-950/80 border border-purple-500/50 text-purple-300 px-1.5 py-0.5 rounded font-black">
                🔮 Эфир (INT {previewStats.int})
              </span>
            )}
            {previewStats.hasTitanArmor && (
              <span className="text-[9px] bg-amber-950/80 border border-amber-500/50 text-amber-300 px-1.5 py-0.5 rounded font-black">
                🛡️ Броня (VIT {previewStats.vit})
              </span>
            )}
          </div>
        </div>

        {/* Customizer Subtabs */}
        <div className="grid grid-cols-5 gap-1 mb-2.5">
          {[
            { id: 'fur', label: '🎨 Шерсть' },
            { id: 'hair', label: '✂️ Прическа' },
            { id: 'teeth', label: '🦷 Зубы' },
            { id: 'eyes', label: '👁️ Взгляд' },
            { id: 'stats', label: '✦ 5 Очков' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                hapticEffects.tap();
                setActiveTab(tab.id as any);
              }}
              className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition-all text-center ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {/* 1. FUR COLOR */}
          {activeTab === 'fur' && (
            <div className="grid grid-cols-2 gap-2">
              {FUR_COLOR_OPTIONS.map((f) => {
                const isSelected = config.furColor === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      hapticEffects.tap();
                      setConfig((prev) => ({
                        ...prev,
                        furColor: f.id,
                        furColorHex: f.hex,
                        furColorName: f.name,
                      }));
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl border border-white/20 shrink-0 shadow-md"
                      style={{ backgroundColor: f.hex }}
                    />
                    <div>
                      <span className="font-extrabold text-xs text-white block">{f.name}</span>
                      <span className="text-[10px] text-zinc-400 leading-tight">{f.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. HAIRSTYLE */}
          {activeTab === 'hair' && (
            <div className="space-y-1.5">
              {HAIR_STYLE_OPTIONS.map((h) => {
                const isSelected = config.hairStyle === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      hapticEffects.tap();
                      setConfig((prev) => ({
                        ...prev,
                        hairStyle: h.id,
                        hairStyleName: h.name,
                        hairStyleIcon: h.icon,
                      }));
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{h.icon}</span>
                      <div>
                        <span className="font-extrabold text-xs text-white block">{h.name}</span>
                        <span className="text-[10px] text-zinc-400">{h.description}</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-zinc-800 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                      {h.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. TEETH & FANGS */}
          {activeTab === 'teeth' && (
            <div className="space-y-1.5">
              {TEETH_OPTIONS.map((t) => {
                const isSelected = config.teethStyle === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      hapticEffects.tap();
                      setConfig((prev) => ({
                        ...prev,
                        teethStyle: t.id,
                        teethStyleName: t.name,
                        teethStyleIcon: t.icon,
                      }));
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <span className="font-extrabold text-xs text-white block">{t.name}</span>
                        <span className="text-[10px] text-zinc-400">{t.description}</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-zinc-800 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 4. EYES & EXPRESSION */}
          {activeTab === 'eyes' && (
            <div className="space-y-1.5">
              {EYE_OPTIONS.map((e) => {
                const isSelected = config.eyeStyle === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      hapticEffects.tap();
                      setConfig((prev) => ({
                        ...prev,
                        eyeStyle: e.id,
                        eyeStyleName: e.name,
                        eyeStyleIcon: e.icon,
                      }));
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/40'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{e.icon}</span>
                      <div>
                        <span className="font-extrabold text-xs text-white block">{e.name}</span>
                        <span className="text-[10px] text-zinc-400">{e.description}</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-zinc-800 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                      {e.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 5. INITIAL 5 PERK POINTS ALLOCATION */}
          {activeTab === 'stats' && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-amber-300 block">
                    Доступно очков навыков: {remainingPoints} из 5
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Распредели первые 5 очков — от них зависит стартовая мутация!
                  </span>
                </div>
                <span className="text-2xl">✦</span>
              </div>

              {[
                {
                  id: 'perk_heavy_bones',
                  title: '💪 Сила Тапа (STR)',
                  desc: 'Увеличивает силу каждого клика и развивает рельефные мышцы.',
                  color: 'text-red-400',
                },
                {
                  id: 'perk_swift_claws',
                  title: '⚡ Ловкость & Скорость (DEX)',
                  desc: 'Повышает шанс крита и окружает капибару искрами молний.',
                  color: 'text-cyan-400',
                },
                {
                  id: 'perk_mana_spark',
                  title: '🔮 Магия & Эфир (INT)',
                  desc: 'Усиливает критический множитель и призывает руны.',
                  color: 'text-purple-400',
                },
                {
                  id: 'perk_vitality_core',
                  title: '🛡️ Стойкость (VIT)',
                  desc: 'Увеличивает запас энергии и дарует титановую броню.',
                  color: 'text-amber-400',
                },
                {
                  id: 'perk_sheikh_wealth',
                  title: '🔱 Удача & Шейх (LCK)',
                  desc: 'Повышает выпадение золотых кушей и пельменей.',
                  color: 'text-yellow-400',
                },
              ].map((stat) => {
                const count = allocatedPoints[stat.id] || 0;
                return (
                  <div
                    key={stat.id}
                    className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <span className={`font-extrabold text-xs block ${stat.color}`}>{stat.title}</span>
                      <span className="text-[10px] text-zinc-400">{stat.desc}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePointChange(stat.id, -1)}
                        disabled={count <= 0}
                        className="w-7 h-7 rounded-xl bg-zinc-800 disabled:opacity-30 text-white font-black text-sm flex items-center justify-center border border-zinc-700"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-black text-xs text-amber-300">{count}</span>
                      <button
                        onClick={() => handlePointChange(stat.id, 1)}
                        disabled={remainingPoints <= 0}
                        className="w-7 h-7 rounded-xl bg-amber-500 disabled:opacity-30 text-black font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="pt-3 border-t border-zinc-800">
          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            {isFirstLaunch ? 'СОХРАНИТЬ И НАЧАТЬ ИГРУ!' : 'ПРИМЕНИТЬ КАСТОМИЗАЦИЮ'}
          </button>
        </div>

      </div>
    </div>
  );
};
