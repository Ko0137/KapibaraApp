import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, ShieldAlert, Trophy, Zap, AlertTriangle, Flame, Clock, 
  User, X, Check, Award, History, TrendingUp, TrendingDown, Sparkles, 
  Users, Radio, Globe, Shield, Skull
} from 'lucide-react';
import { DealOpponent, CharacterSkin, CharacterHat, DealHistoryItem, LossDebuff } from '../types/game';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { computeCharacterComposite, SoulslikeStats } from '../utils/characterComposite';
import { CharacterFighterVisual } from './CharacterFighterVisual';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';
import { getApiUrl } from '../utils/api';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db, ensureAuthenticated } from '../services/firebase';

interface DealModalProps {
  onClose: () => void;
  playerLevel: number;
  playerCoins: number;
  playerName: string;
  selectedSkinId: string;
  selectedHatId: string;
  perks: Record<string, number>;
  dealStats: {
    dealsWon: number;
    dealsLost: number;
    totalCoinsWon: number;
    lastDealTimestamp: number;
    lastWeeklyDealTimestamp: number;
    penaltiesPaid: number;
  };
  dealHistory?: DealHistoryItem[];
  immortalUnlocked?: boolean;
  onCompleteDeal: (
    won: boolean, 
    coinsWon: number, 
    opponent: DealOpponent, 
    userClicks: number, 
    oppClicks: number,
    debuff?: LossDebuff | null
  ) => void;
  onPayPenalty: (penaltyAmount: number, debuff?: LossDebuff) => void;
}

export const DealModal: React.FC<DealModalProps> = ({
  onClose,
  playerLevel,
  playerCoins,
  playerName,
  selectedSkinId,
  selectedHatId,
  perks,
  dealStats,
  dealHistory = [],
  immortalUnlocked = false,
  onCompleteDeal,
  onPayPenalty,
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'players' | 'history'>('arena');
  const [phase, setPhase] = useState<'lobby' | 'countdown' | 'battle' | 'result'>('lobby');
  const [realPlayers, setRealPlayers] = useState<DealOpponent[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<DealOpponent | null>(null);

  // User Player Visual Stats
  const playerSkin = CHARACTER_SKINS.find((s) => s.id === selectedSkinId) || CHARACTER_SKINS[0];
  const playerHat = CHARACTER_HATS.find((h) => h.id === selectedHatId) || CHARACTER_HATS[0];
  const playerStats = computeCharacterComposite(playerSkin, playerHat, perks, playerLevel, immortalUnlocked);

  // Fetch real online/registered players from Firestore cloudSaves collection (falling back to seeds)
  useEffect(() => {
    let isMounted = true;
    async function loadOpponents() {
      try {
        await ensureAuthenticated();
        
        // Define fallback seed opponents
        const seedOpponents: DealOpponent[] = [
          {
            id: 'TAP-DUB1',
            nickname: 'Шейх Капибар 🇦🇪',
            level: 42,
            coins: 18500000,
            avatarIcon: '🦫',
            auraEffect: 'deal_fire',
            tapPower: 924,
            dealRank: '💼 Акула Сделок',
            equippedSkinId: 'skin_sheikh_capy',
            equippedHatId: 'hat_crown',
            equippedWeaponId: 'scepter',
            bodyMutation: 'normal',
            isOnline: true,
            tier: 'mortal'
          },
          {
            id: 'TAP-SAM8',
            nickname: 'Капи-Рёнин 2077 🥷',
            level: 89,
            coins: 98000000,
            avatarIcon: '🦫',
            auraEffect: 'deal_fire',
            tapPower: 1958,
            dealRank: '👑 Крипто-Владыка',
            equippedSkinId: 'skin_samurai_capy',
            equippedHatId: 'hat_shades',
            equippedWeaponId: 'katana',
            bodyMutation: 'normal',
            isOnline: true,
            tier: 'mortal'
          },
          {
            id: 'TAP-TIT9',
            nickname: 'Титан Колосс 💪',
            level: 168,
            coins: 1200000000,
            avatarIcon: '👑',
            auraEffect: 'divine_light',
            tapPower: 3696,
            dealRank: '👑 Крипто-Владыка',
            equippedSkinId: 'skin_muscle_mutant',
            equippedHatId: 'hat_demon_horns',
            equippedWeaponId: 'greatsword',
            bodyMutation: 'muscle',
            isOnline: true,
            tier: 'divine'
          },
          {
            id: 'TAP-ARC3',
            nickname: 'Архимаг Эфира 🔮',
            level: 210,
            coins: 4500000000,
            avatarIcon: '👑',
            auraEffect: 'divine_light',
            tapPower: 4620,
            dealRank: '✨ Божественный Серафим',
            equippedSkinId: 'skin_toxic_ooze',
            equippedHatId: 'hat_archmage_hood',
            equippedWeaponId: 'crystal_orb',
            bodyMutation: 'slime',
            isOnline: true,
            tier: 'divine'
          },
          {
            id: 'TAP-IMM1',
            nickname: 'Бессмертный Абсолют 🌌',
            level: 295,
            coins: 58000000000,
            avatarIcon: '🌌',
            auraEffect: 'immortal_void',
            tapPower: 6490,
            dealRank: '🌌 Бессмертный Владыка',
            equippedSkinId: 'skin_god_capy',
            equippedHatId: 'hat_cosmic_crown',
            equippedWeaponId: 'scythe',
            bodyMutation: 'immortal',
            isOnline: true,
            tier: 'immortal'
          }
        ];

        // Query Firestore cloudSaves collection
        const q = query(collection(db, 'cloudSaves'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedOpponents: DealOpponent[] = [];

        querySnapshot.forEach((docSnap) => {
          const r = docSnap.data();
          let sData: any = {};
          try {
            sData = typeof r.saveData === 'string' ? JSON.parse(r.saveData) : r.saveData || {};
          } catch (e) {
            sData = {};
          }

          const perks = sData.perks || {};
          let weapon: any = undefined;
          if (perks['perk_colossal_sword']) weapon = 'greatsword';
          else if (perks['perk_katana_shadow']) weapon = 'katana';
          else if (perks['perk_gold_scepter']) weapon = 'scepter';
          else if (perks['perk_crystal_orb']) weapon = 'crystal_orb';
          else if (perks['perk_abyss_scythe']) weapon = 'scythe';

          let body: any = 'normal';
          const lvl = Number(r.level) || 1;
          if (lvl > 265 || sData.immortalUnlocked) body = 'immortal';
          else if (lvl > 165) body = 'divine';
          else if (perks['perk_muscle_mutation']) body = 'muscle';
          else if (perks['perk_slime_mutation']) body = 'slime';
          else if (perks['perk_skeleton_frame']) body = 'skeleton';

          const tier = lvl > 265 ? 'immortal' : (lvl > 165 ? 'divine' : 'mortal');
          const isOnline = r.updatedAt ? (Date.now() - new Date(r.updatedAt).getTime()) < 1000 * 60 * 15 : false;

          fetchedOpponents.push({
            id: r.cloudId || docSnap.id,
            nickname: r.playerName || 'Игрок',
            level: lvl,
            coins: Math.max(15000, Number(r.coins) || 0),
            avatarIcon: body === 'immortal' ? '🌌' : (body === 'divine' ? '👑' : '🦫'),
            auraEffect: body === 'immortal' ? 'immortal_void' : (body === 'divine' ? 'divine_light' : 'deal_fire'),
            tapPower: Math.max(80, Math.round(lvl * 22)),
            dealRank: lvl > 265 ? '🌌 Бессмертный Владыка' : (lvl > 165 ? '✨ Божественный Серафим' : (lvl > 80 ? '👑 Крипто-Владыка' : '💼 Акула Сделок')),
            equippedSkinId: sData.selectedSkinId || 'skin_default',
            equippedHatId: sData.selectedHatId || 'hat_none',
            equippedWeaponId: weapon,
            bodyMutation: body,
            isOnline: isOnline,
            tier: tier
          });
        });

        // Merge fetched and seeds
        const allOpponents = [...fetchedOpponents];
        seedOpponents.forEach(seed => {
          if (!allOpponents.some(o => o.id === seed.id)) {
            allOpponents.push(seed);
          }
        });

        if (isMounted) {
          setRealPlayers(allOpponents);
          
          // Matchmaking logic
          const sortedByLevelDiff = [...allOpponents].sort(
            (a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel)
          );
          setSelectedOpponent(sortedByLevelDiff[0] || allOpponents[0]);
        }
      } catch (err) {
        console.error('Failed to load real duel opponents:', err);
      } finally {
        if (isMounted) setLoadingPlayers(false);
      }
    }
    loadOpponents();
    return () => { isMounted = false; };
  }, [playerLevel]);

  // Battle Mechanics State
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdown, setCountdown] = useState(3);
  const [userClicks, setUserClicks] = useState(0);
  const [opponentClicks, setOpponentClicks] = useState(0);
  const [userAttacking, setUserAttacking] = useState(false);
  const [userHit, setUserHit] = useState(false);
  const [oppAttacking, setOppAttacking] = useState(false);
  const [oppHit, setOppHit] = useState(false);
  const [battleResult, setBattleResult] = useState<{ won: boolean; coinsDelta: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const oppIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userClicksRef = useRef(0);
  const oppClicksRef = useRef(0);
  const finishCalledRef = useRef(false);

  // Fallback opponent if none loaded yet
  const activeOpponent: DealOpponent = selectedOpponent || {
    id: 'opp_default',
    nickname: 'Шейх Капибар 🇦🇪',
    level: Math.max(1, playerLevel),
    coins: Math.max(50000, Math.round(playerCoins * 0.9)),
    avatarIcon: '👑',
    auraEffect: 'deal_fire',
    tapPower: Math.max(80, Math.round(playerLevel * 20)),
    dealRank: 'Акула Сделок',
    equippedSkinId: 'skin_sheikh_capy',
    equippedHatId: 'hat_crown',
    equippedWeaponId: 'scepter',
    bodyMutation: playerLevel > 165 ? 'divine' : 'normal',
    tier: playerLevel > 165 ? 'divine' : 'mortal',
    isOnline: true
  };

  // Opponent Visual Model
  const oppSkin = CHARACTER_SKINS.find((s) => s.id === activeOpponent.equippedSkinId) || CHARACTER_SKINS[0];
  const oppHat = CHARACTER_HATS.find((h) => h.id === activeOpponent.equippedHatId) || CHARACTER_HATS[0];
  const oppStats: SoulslikeStats = computeCharacterComposite(
    oppSkin,
    oppHat,
    {},
    activeOpponent.level,
    activeOpponent.tier === 'immortal'
  );

  // 50% Penalty calculation on refusal
  const penaltyAmount = Math.max(1000, Math.round(playerCoins * 0.5));

  // Tug of war calculation (-50 to +50)
  const totalClicks = userClicks + opponentClicks;
  const tugBalance = totalClicks > 0 ? ((userClicks - opponentClicks) / Math.max(20, totalClicks)) * 100 : 0;
  const clampedTug = Math.max(-50, Math.min(50, tugBalance));

  // Finish battle safely
  const finishBattle = () => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);
    if (oppIntervalRef.current) clearInterval(oppIntervalRef.current);

    const finalUserClicks = userClicksRef.current;
    const finalOppClicks = oppClicksRef.current;

    const won = finalUserClicks >= finalOppClicks;
    const coinsDelta = won
      ? Math.max(50000, Math.round(activeOpponent.coins * 0.6))
      : penaltyAmount;

    setBattleResult({ won, coinsDelta });

    if (won) {
      sound.playLevelUp();
      sound.playComboSuccess();
    } else {
      sound.playWarning();
      sound.playError();
      hapticEffects.warning();
    }

    // Generate loss debuff if lost: -40% income for 15 minutes
    const lossDebuff: LossDebuff | undefined = won ? undefined : {
      name: 'Шок Поражения в Сделке',
      desc: '-40% к пассивному доходу и регену энергии на 15 минут',
      percent: 0.4,
      expiresAt: Date.now() + 1000 * 60 * 15,
      icon: '📉'
    };

    // Defer parent update to ensure it does not execute synchronously inside child render/state-update phase
    setTimeout(() => {
      onCompleteDeal(won, coinsDelta, activeOpponent, finalUserClicks, finalOppClicks, lossDebuff);
    }, 0);
  };

  // Countdown Phase
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        sound.playTick();
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        setPhase('battle');
        sound.playFeverStart();
        startBattle();
      }
    }
  }, [phase, countdown]);

  // Battle Countdown Timer
  useEffect(() => {
    if (phase !== 'battle') return;

    if (timeLeft <= 0) {
      finishBattle();
      return;
    }

    const t = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 4 && next > 0) sound.playTick();
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const startBattle = () => {
    finishCalledRef.current = false;
    setTimeLeft(15);
    setUserClicks(0);
    setOpponentClicks(0);
    userClicksRef.current = 0;
    oppClicksRef.current = 0;

    // Opponent automated realistic tapping engine based on his PvP power
    const oppBaseSpeedMs = Math.max(120, 240 - Math.min(140, (activeOpponent.tapPower || 100) / 5));
    oppIntervalRef.current = setInterval(() => {
      const willClick = Math.random() > 0.15;
      if (willClick) {
        oppClicksRef.current += 1;
        setOpponentClicks((c) => c + 1);
        setOppAttacking(true);
        setUserHit(true);
        setTimeout(() => {
          setOppAttacking(false);
          setUserHit(false);
        }, 100);
      }
    }, oppBaseSpeedMs);
  };

  // User Tap Action
  const handleUserTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'battle') return;
    hapticEffects.tap();
    sound.playTap();

    userClicksRef.current += 1;
    setUserClicks((prev) => prev + 1);
    setUserAttacking(true);
    setOppHit(true);
    setTimeout(() => {
      setUserAttacking(false);
      setOppHit(false);
    }, 100);
  };

  const handleRefuseDeal = () => {
    sound.playWarning();
    hapticEffects.warning();
    const debuff: LossDebuff = {
      name: 'Штраф за Отказ от Сделки',
      desc: '-30% к доходу на 10 минут за бегство с Арены',
      percent: 0.3,
      expiresAt: Date.now() + 1000 * 60 * 10,
      icon: '🚫'
    };
    setTimeout(() => {
      onPayPenalty(penaltyAmount, debuff);
      onClose();
    }, 0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (oppIntervalRef.current) clearInterval(oppIntervalRef.current);
    };
  }, []);

  // Calculate history stats
  const totalDeals = (dealStats.dealsWon || 0) + (dealStats.dealsLost || 0);
  const winRate = totalDeals > 0 ? Math.round(((dealStats.dealsWon || 0) / totalDeals) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-red-500/50 w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                СДЕЛКА ВЕКА
                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  PvP ДУЭЛЬ
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                15 секунд • Ставка на банк • Реальные игроки
              </p>
            </div>
          </div>
          {phase === 'lobby' && (
            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
              }}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs (Only in lobby) */}
        {phase === 'lobby' && (
          <div className="grid grid-cols-3 gap-1 my-3 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('arena');
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'arena'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" /> Арена
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('players');
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" /> В Сети ({realPlayers.length})
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('history');
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" /> Лог ({dealHistory.length})
            </button>
          </div>
        )}

        {/* TAB 1: ARENA LOBBY */}
        {phase === 'lobby' && activeTab === 'arena' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            
            {/* Real Opponent Profile Match */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase text-red-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Сбалансированный Соперник
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> В СЕТИ
                </span>
              </div>

              {/* Two Fighters Face-Off Showcase */}
              <div className="grid grid-cols-2 gap-3 items-center bg-black/40 p-3 rounded-2xl border border-zinc-800">
                
                {/* User Fighter Visual */}
                <div className="flex flex-col items-center">
                  <CharacterFighterVisual
                    skin={playerSkin}
                    hat={playerHat}
                    stats={playerStats}
                    side="left"
                    size="md"
                    name={playerName}
                    rank={`Ур. ${playerLevel}`}
                  />
                  <div className="mt-2 text-center">
                    <span className="text-[10px] bg-zinc-800 text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
                      ⚔️ Сила: {playerStats.dealPvPPower}
                    </span>
                  </div>
                </div>

                {/* Opponent Fighter Visual */}
                <div className="flex flex-col items-center">
                  <CharacterFighterVisual
                    skin={oppSkin}
                    hat={oppHat}
                    stats={oppStats}
                    side="right"
                    size="md"
                    name={activeOpponent.nickname}
                    rank={`Ур. ${activeOpponent.level}`}
                  />
                  <div className="mt-2 text-center">
                    <span className="text-[10px] bg-zinc-800 text-red-400 font-extrabold px-2 py-0.5 rounded-full">
                      ⚔️ Сила: {activeOpponent.tapPower}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stake info */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Выигрыш за победу:</span>
                  <span className="text-xs font-black text-emerald-400">
                    +{formatNumber(Math.round(activeOpponent.coins * 0.6))} 🪙
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Штраф за отказ (50%):</span>
                  <span className="text-xs font-black text-red-400">
                    -{formatNumber(penaltyAmount)} 🪙
                  </span>
                </div>
              </div>
            </div>

            {/* Debuff Warning on Loss */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5">
              <Skull className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-extrabold text-amber-300 block">
                  Дебафф при поражении / отказе:
                </span>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  При проигрыше накладывается <strong className="text-white">Шок Поражения</strong>: -40% к пассивному доходу и регенерации энергии на 15 минут!
                </p>
              </div>
            </div>

            {/* Anti-cheat Notice */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Аппаратный Анти-Кликер
              </span>
              <span className="text-emerald-400 font-extrabold">АКТИВЕН</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  hapticEffects.heavyTap();
                  sound.playFeverStart();
                  setPhase('countdown');
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 text-white font-black text-base shadow-xl shadow-red-600/40 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Swords className="w-5 h-5" /> ПРИНЯТЬ ВЫЗОВ (15 СЕК)
              </button>

              <button
                onClick={handleRefuseDeal}
                className="w-full py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/40 text-zinc-300 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Отказаться со штрафом 50% (-{formatNumber(penaltyAmount)} 🪙)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REAL ONLINE PLAYERS LIST (OPEN CHALLENGE) */}
        {phase === 'lobby' && activeTab === 'players' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <div className="p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl text-[11px] text-blue-200">
              <span className="font-extrabold block text-blue-300">🌐 Список реальных игроков:</span>
              Вы можете бросить вызов любому игроку в сети — от новичка до миллиардера!
            </div>

            {loadingPlayers ? (
              <div className="text-center py-8 text-zinc-400 text-xs">Поиск игроков в сети...</div>
            ) : realPlayers.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">Игроков в сети пока нет</div>
            ) : (
              realPlayers.map((opp) => {
                const isSelected = selectedOpponent?.id === opp.id;
                return (
                  <div
                    key={opp.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/30 border-red-500 shadow-md shadow-red-500/20'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl shrink-0">
                        {opp.avatarIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{opp.nickname}</span>
                          <span className="text-[10px] bg-zinc-800 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                            Ур. {opp.level}
                          </span>
                          {opp.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="В сети" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          <span>🪙 {formatNumber(opp.coins)}</span>
                          <span>•</span>
                          <span className="text-red-400 font-bold">⚔️ Сила: {opp.tapPower}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        hapticEffects.tap();
                        setSelectedOpponent(opp);
                        setActiveTab('arena');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md shadow-red-600/30"
                    >
                      {isSelected ? 'Выбран' : 'Вызвать'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: DEAL HISTORY */}
        {phase === 'lobby' && activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {/* Winrate Stats Card */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">Винрейт</span>
                <span className="text-base font-black text-amber-400">{winRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">Победы / Бои</span>
                <span className="text-base font-black text-emerald-400">
                  {dealStats.dealsWon || 0} / {totalDeals}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">Выиграно 🪙</span>
                <span className="text-xs font-black text-yellow-400">
                  +{formatNumber(dealStats.totalCoinsWon || 0)}
                </span>
              </div>
            </div>

            {/* History Items */}
            {dealHistory.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                История дуэлей пуста. Проведите свой первый бой на Арене!
              </div>
            ) : (
              <div className="space-y-2">
                {dealHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      item.won
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-red-950/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-base border border-zinc-700">
                        {item.opponentAvatar || '🦫'}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          {item.opponentName}
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              item.won ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
                            }`}
                          >
                            {item.won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Клики: {item.userClicks} vs {item.opponentClicks}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-black block ${
                          item.won ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {item.won ? '+' : '-'}{formatNumber(item.coinsChange)} 🪙
                      </span>
                      <span className="text-[9px] text-zinc-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PHASE 2: COUNTDOWN */}
        {phase === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-xs uppercase font-extrabold text-red-400 tracking-widest mb-3 animate-pulse">
              ПРИГОТОВИТЬ ПАЛЬЦЫ
            </span>
            <div className="text-8xl font-black text-amber-400 animate-ping">
              {countdown > 0 ? countdown : 'БОЙ!'}
            </div>
          </div>
        )}

        {/* PHASE 3: LIVE BATTLE ARENA (BOTH FIGHTERS SHOWN CLASHING) */}
        {phase === 'battle' && (
          <div className="flex-1 flex flex-col items-center justify-between py-2">
            
            {/* Timer and Taps Counter */}
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" />
                Время: <strong className="text-amber-400 text-sm font-black">{timeLeft}с</strong>
              </span>
              <span className="text-xs font-bold text-zinc-400">
                Ваши тапы: <strong className="text-emerald-400 text-sm font-black">{userClicks}</strong>
              </span>
            </div>

            {/* Visual Clash Battlefield (User Fighter vs Opponent Fighter) */}
            <div className="w-full my-3 p-3 rounded-2xl bg-gradient-to-b from-black/80 to-zinc-950 border border-red-500/40 flex flex-col items-center relative overflow-hidden shadow-inner">
              
              <div className="w-full grid grid-cols-2 gap-4 items-center justify-items-center relative z-10">
                {/* User Fighter Left */}
                <div className="flex flex-col items-center">
                  <CharacterFighterVisual
                    skin={playerSkin}
                    hat={playerHat}
                    stats={playerStats}
                    side="left"
                    size="lg"
                    isAttacking={userAttacking}
                    isHit={userHit}
                    name={playerName}
                  />
                  <div className="mt-1 text-center">
                    <span className="text-xs font-black text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      {userClicks} ⚡
                    </span>
                  </div>
                </div>

                {/* Opponent Fighter Right */}
                <div className="flex flex-col items-center">
                  <CharacterFighterVisual
                    skin={oppSkin}
                    hat={oppHat}
                    stats={oppStats}
                    side="right"
                    size="lg"
                    isAttacking={oppAttacking}
                    isHit={oppHit}
                    name={activeOpponent.nickname}
                  />
                  <div className="mt-1 text-center">
                    <span className="text-xs font-black text-red-400 bg-black/60 px-2 py-0.5 rounded-full border border-red-500/40">
                      {opponentClicks} ⚔️
                    </span>
                  </div>
                </div>
              </div>

              {/* Tug-of-War Realtime Clashing Bar */}
              <div className="w-full mt-3 px-2">
                <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
                  <span className="text-emerald-400">ВЫ ({userClicks})</span>
                  <span className="text-amber-400">⚔️ ПЕРЕТЯГИВАНИЕ ⚔️</span>
                  <span className="text-red-400">СОПЕРНИК ({opponentClicks})</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-700 relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-75"
                    style={{ width: `${50 + clampedTug}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-75"
                    style={{ width: `${50 - clampedTug}%` }}
                  />
                  {/* Center Clashing Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,1)] transition-all duration-75"
                    style={{ left: `calc(${50 + clampedTug}% - 4px)` }}
                  />
                </div>
              </div>
            </div>

            {/* Giant Red Tap Hit Button */}
            <button
              onMouseDown={handleUserTap}
              onTouchStart={handleUserTap}
              className="w-full h-24 rounded-3xl bg-gradient-to-r from-red-600 via-orange-500 to-rose-600 text-white font-black text-2xl shadow-2xl shadow-red-600/60 border-2 border-red-400 flex items-center justify-center gap-3 transition-transform active:scale-95 animate-pulse"
            >
              <Flame className="w-8 h-8 animate-bounce" />
              ТАПАЙ ИЗО ВСЕХ СИЛ!
              <Zap className="w-8 h-8 animate-bounce" />
            </button>
          </div>
        )}

        {/* PHASE 4: RESULT SCREEN */}
        {phase === 'result' && battleResult && (
          <div className={`flex-1 flex flex-col items-center justify-center py-6 text-center space-y-5 relative overflow-hidden rounded-3xl ${
            battleResult.won ? 'animate-fadeIn' : 'animate-shake'
          }`}>
            {/* Self-contained CSS for rich animations */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes dealSunburst {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes dealCoinFloat {
                0% { transform: translateY(120px) rotate(0deg) scale(0.5); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 0.8; }
                100% { transform: translateY(-160px) rotate(360deg) scale(1.3); opacity: 0; }
              }
              @keyframes dealAshFloat {
                0% { transform: translateY(-100px) rotate(0deg) scale(0.8); opacity: 0; }
                30% { opacity: 0.8; }
                100% { transform: translateY(180px) rotate(-180deg) scale(1.1); opacity: 0; }
              }
              @keyframes dealGlitch {
                0%, 100% { transform: scale(1) translate(0); }
                20% { transform: scale(1.05) translate(-2px, 2px); filter: hue-rotate(15deg); }
                40% { transform: scale(0.95) translate(2px, -2px); }
                60% { transform: scale(1.02) translate(-1px, -1px); }
                80% { transform: scale(0.98) translate(1px, 1px); }
              }
              @keyframes pulseRadiance {
                0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
                50% { transform: scale(1.1); box-shadow: 0 0 35px rgba(245, 158, 11, 0.6); }
              }
              .animate-deal-sunburst {
                animation: dealSunburst 20s linear infinite;
              }
              .animate-deal-coin-1 { animation: dealCoinFloat 2.2s infinite ease-out; }
              .animate-deal-coin-2 { animation: dealCoinFloat 1.8s infinite ease-out; animation-delay: 0.3s; }
              .animate-deal-coin-3 { animation: dealCoinFloat 2.5s infinite ease-out; animation-delay: 0.6s; }
              .animate-deal-coin-4 { animation: dealCoinFloat 2s infinite ease-out; animation-delay: 0.9s; }
              .animate-deal-coin-5 { animation: dealCoinFloat 2.3s infinite ease-out; animation-delay: 1.2s; }
              
              .animate-deal-ash-1 { animation: dealAshFloat 3.5s infinite ease-in; }
              .animate-deal-ash-2 { animation: dealAshFloat 2.8s infinite ease-in; animation-delay: 0.5s; }
              .animate-deal-ash-3 { animation: dealAshFloat 4s infinite ease-in; animation-delay: 1.2s; }
              .animate-deal-ash-4 { animation: dealAshFloat 3.2s infinite ease-in; animation-delay: 1.8s; }
              
              .animate-deal-glitch {
                animation: dealGlitch 1.5s ease-in-out infinite;
              }
              .animate-deal-radiance {
                animation: pulseRadiance 2s ease-in-out infinite;
              }
            ` }} />

            {/* VICTORY PRESENTATION */}
            {battleResult.won ? (
              <>
                {/* Background sunburst spinner */}
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-35 flex items-center justify-center pointer-events-none">
                  <div className="w-[450px] h-[450px] rounded-full animate-deal-sunburst" 
                       style={{ 
                         background: 'repeating-conic-gradient(from 0deg, rgba(245, 158, 11, 0.15) 0deg 18deg, transparent 18deg 36deg)'
                       }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                </div>

                {/* Flying coin shower particles */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                  <span className="absolute text-2xl animate-deal-coin-1" style={{ left: '15%' }}>🪙</span>
                  <span className="absolute text-3xl animate-deal-coin-2" style={{ left: '35%' }}>🪙</span>
                  <span className="absolute text-xl animate-deal-coin-3" style={{ left: '55%' }}>🪙</span>
                  <span className="absolute text-2xl animate-deal-coin-4" style={{ left: '75%' }}>🪙</span>
                  <span className="absolute text-3xl animate-deal-coin-5" style={{ left: '85%' }}>🪙</span>
                </div>

                {/* Glorious Trophy Wrapper */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-yellow-300 relative z-10 animate-deal-radiance">
                    <Trophy className="w-10 h-10 text-white animate-bounce" />
                  </div>
                  <span className="absolute top-0 right-0 text-lg animate-ping">✨</span>
                  <span className="absolute bottom-1 left-1 text-lg animate-pulse">🌟</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full">
                    ВЕЛИКОЛЕПНЫЙ ТРИУМФ
                  </span>
                  <h3 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                    СДЕЛКА ЗАКРЫТА!
                  </h3>
                </div>

                <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">
                  Вы превзошли тактику игрока <strong className="text-white">{activeOpponent.nickname}</strong>, нанеся рекордные <strong className="text-yellow-400">{userClicks} тапов</strong> в секунду!
                </p>
              </>
            ) : (
              /* DEFEAT PRESENTATION */
              <>
                {/* Background blood red vignette */}
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-40 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25)_0%,rgba(0,0,0,0.85)_100%)]" />
                  <div className="absolute inset-0 border-2 border-red-500/30 rounded-3xl animate-pulse" />
                </div>

                {/* Ominous dropping ash and blood particles */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                  <span className="absolute text-lg animate-deal-ash-1" style={{ left: '20%' }}>🩸</span>
                  <span className="absolute text-sm animate-deal-ash-2" style={{ left: '45%' }}>⚫</span>
                  <span className="absolute text-xl animate-deal-ash-3" style={{ left: '65%' }}>🩸</span>
                  <span className="absolute text-xs animate-deal-ash-4" style={{ left: '80%' }}>⚫</span>
                </div>

                {/* Dark Glitching Skull Wrapper */}
                <div className="relative flex items-center justify-center animate-deal-glitch">
                  <div className="absolute w-24 h-24 rounded-full bg-red-600/10 blur-xl animate-pulse" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-zinc-950 flex items-center justify-center shadow-lg border-2 border-red-500/40 relative z-10">
                    <Skull className="w-10 h-10 text-red-500" />
                  </div>
                  <span className="absolute top-1 left-2 text-red-500 text-sm animate-pulse">⚡</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-red-400 uppercase bg-red-950/50 border border-red-500/30 px-3 py-1 rounded-full">
                    КРАХ НА АРЕНЕ
                  </span>
                  <h3 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-600">
                    БОЙ ПРОИГРАН
                  </h3>
                </div>

                <p className="text-xs text-zinc-300 max-w-xs leading-relaxed">
                  Игрок <strong className="text-white">{activeOpponent.nickname}</strong> оказался быстрее в этот раз ({opponentClicks} vs {userClicks} кликов). Вы упустили инициативу...
                </p>
              </>
            )}

            {/* Shared results and rewards display card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 w-full max-w-xs shadow-inner relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-zinc-900/40 blur-md pointer-events-none" />
              <span className="text-[10px] text-zinc-500 block font-black uppercase tracking-wide">
                {battleResult.won ? 'Заработанная выручка:' : 'Понесенные потери:'}
              </span>
              <span
                className={`text-2xl font-black block mt-0.5 ${
                  battleResult.won ? 'text-emerald-400 drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)]' : 'text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.3)]'
                }`}
              >
                {battleResult.won ? '+' : '-'}{formatNumber(battleResult.coinsDelta)} 🪙
              </span>
            </div>

            {/* Debuff Banner on Loss */}
            {!battleResult.won && (
              <div className="p-3 rounded-2xl bg-amber-950/55 border border-amber-500/40 text-[11px] text-amber-300 max-w-xs leading-tight flex items-start gap-2 text-left">
                <span className="text-base leading-none">📉</span>
                <div>
                  <strong className="text-white block font-bold">Получен дебафф:</strong>
                  «Шок Поражения» (-40% дохода и энергии на 15 минут).
                </div>
              </div>
            )}

            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
              }}
              className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-transform active:scale-95 shadow-lg ${
                battleResult.won 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:brightness-110 shadow-amber-500/20' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              ПОДТВЕРДИТЬ РЕЗУЛЬТАТ
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
