import React, { useState, useEffect, useRef } from 'react';
import { 
  Swords, ShieldAlert, Trophy, Zap, AlertTriangle, Flame, Clock, 
  User, X, Check, Award, History, TrendingUp, TrendingDown, Sparkles, 
  Users, Radio, Globe, Shield, Skull, RefreshCw, Plus, Play
} from 'lucide-react';
import { DealOpponent, CharacterSkin, CharacterHat, DealHistoryItem, LossDebuff, CustomCapybaraConfig } from '../types/game';
import { CHARACTER_SKINS, CHARACTER_HATS } from '../data/skins';
import { computeCharacterComposite, SoulslikeStats } from '../utils/characterComposite';
import { CharacterFighterVisual } from './CharacterFighterVisual';
import { formatNumber } from '../utils/format';
import { sound } from '../utils/audio';
import { hapticEffects } from '../utils/haptics';
import { 
  subscribeToActivePlayers, 
  createDuelRoom, 
  joinDuelRoom, 
  subscribeToDuelRoom, 
  updateDuelTap, 
  finishDuelRoom, 
  leaveDuelRoom, 
  listenToWaitingRooms,
  DuelRoomData 
} from '../services/multiplayerService';
import { auth } from '../services/firebase';

interface DealModalProps {
  onClose: () => void;
  playerLevel: number;
  playerCoins: number;
  playerName: string;
  selectedSkinId?: string;
  selectedSkinIdBase?: string;
  selectedSkinIdOverlay?: string;
  selectedHatId: string;
  perks: Record<string, number>;
  customConfig?: CustomCapybaraConfig;
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
  selectedSkinIdBase,
  selectedSkinIdOverlay,
  selectedHatId,
  perks,
  customConfig,
  dealStats,
  dealHistory = [],
  immortalUnlocked = false,
  onCompleteDeal,
  onPayPenalty,
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'players' | 'live_rooms' | 'history'>('arena');
  const [phase, setPhase] = useState<'lobby' | 'countdown' | 'battle' | 'result'>('lobby');
  const [realPlayers, setRealPlayers] = useState<DealOpponent[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<DealOpponent | null>(null);
  const [playerFilter, setPlayerFilter] = useState<'all' | 'online' | 'match'>('online');

  // Live Duel Room state
  const [waitingRooms, setWaitingRooms] = useState<DuelRoomData[]>([]);
  const [currentLiveRoomId, setCurrentLiveRoomId] = useState<string | null>(null);
  const [liveRoomData, setLiveRoomData] = useState<DuelRoomData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [betCoinsChoice, setBetCoinsChoice] = useState(10000);
  const [roomStatusMessage, setRoomStatusMessage] = useState<string | null>(null);

  // User Player Visual Stats
  const actualSkinId = selectedSkinIdBase || selectedSkinId || 'skin_default';
  const playerSkin = CHARACTER_SKINS.find((s) => s.id === actualSkinId) || CHARACTER_SKINS[0];
  const overlaySkinId = selectedSkinIdOverlay;
  const playerOverlaySkin = overlaySkinId && overlaySkinId !== actualSkinId ? CHARACTER_SKINS.find((s) => s.id === overlaySkinId) : undefined;
  const playerHat = CHARACTER_HATS.find((h) => h.id === selectedHatId) || CHARACTER_HATS[0];
  const playerStats = computeCharacterComposite(playerSkin, playerHat, perks, playerLevel, immortalUnlocked);

  // Subscribe to real live players in real-time from Firestore
  useEffect(() => {
    setLoadingPlayers(true);
    const unsubscribe = subscribeToActivePlayers((players, count) => {
      setRealPlayers(players);
      setOnlineCount(count);
      setLoadingPlayers(false);

      // Auto pick closest matched opponent if none chosen yet
      if (!selectedOpponent && players.length > 0) {
        const sorted = [...players].sort(
          (a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel)
        );
        setSelectedOpponent(sorted[0]);
      }
    });

    const unsubRooms = listenToWaitingRooms((rooms) => {
      setWaitingRooms(rooms);
    });

    return () => {
      unsubscribe();
      unsubRooms();
    };
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

  // Active opponent
  const activeOpponent: DealOpponent = selectedOpponent || (realPlayers.length > 0 ? realPlayers[0] : {
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
  });

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
  const finishBattle = (forcedWinnerId?: string) => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);
    if (oppIntervalRef.current) clearInterval(oppIntervalRef.current);

    const finalUserClicks = userClicksRef.current;
    const finalOppClicks = oppClicksRef.current;

    const won = forcedWinnerId ? forcedWinnerId === auth.currentUser?.uid : finalUserClicks >= finalOppClicks;
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

    // Finish live room in Firestore if applicable
    if (currentLiveRoomId) {
      finishDuelRoom(currentLiveRoomId, won ? (auth.currentUser?.uid || 'user') : (activeOpponent.id || 'opp'));
    }

    // Generate loss debuff if lost: -40% income for 15 minutes
    const lossDebuff: LossDebuff | undefined = won ? undefined : {
      name: 'Шок Поражения в Сделке',
      desc: '-40% к пассивному доходу и регену энергии на 15 минут',
      percent: 0.4,
      expiresAt: Date.now() + 1000 * 60 * 15,
      icon: '📉'
    };

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

  // Live Room Subscription
  useEffect(() => {
    if (!currentLiveRoomId) return;

    const unsub = subscribeToDuelRoom(currentLiveRoomId, (room) => {
      if (!room) return;
      setLiveRoomData(room);

      if (room.status === 'starting' && phase === 'lobby') {
        setCountdown(3);
        setPhase('countdown');
      }

      // Sync opponent clicks in real-time
      if (isHost && typeof room.guestTaps === 'number') {
        oppClicksRef.current = room.guestTaps;
        setOpponentClicks(room.guestTaps);
      } else if (!isHost && typeof room.hostTaps === 'number') {
        oppClicksRef.current = room.hostTaps;
        setOpponentClicks(room.hostTaps);
      }

      if (room.status === 'finished' && phase === 'battle') {
        finishBattle(room.winnerId);
      }
    });

    return () => unsub();
  }, [currentLiveRoomId, isHost, phase]);

  const startBattle = () => {
    finishCalledRef.current = false;
    setTimeLeft(15);
    setUserClicks(0);
    setOpponentClicks(0);
    userClicksRef.current = 0;
    oppClicksRef.current = 0;

    // If async battle against real player's profile: realistic tap speed emulation
    if (!currentLiveRoomId) {
      const oppBaseSpeedMs = Math.max(110, 230 - Math.min(130, (activeOpponent.tapPower || 100) / 6));
      oppIntervalRef.current = setInterval(() => {
        const willClick = Math.random() > 0.12;
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
    }
  };

  // User Tap Action
  const handleUserTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'battle') return;
    hapticEffects.tap();
    sound.playTap();

    const newTaps = userClicksRef.current + 1;
    userClicksRef.current = newTaps;
    setUserClicks(newTaps);
    setUserAttacking(true);
    setOppHit(true);
    setTimeout(() => {
      setUserAttacking(false);
      setOppHit(false);
    }, 100);

    // Sync to live room if in real-time duel
    if (currentLiveRoomId) {
      updateDuelTap(currentLiveRoomId, isHost, newTaps * (playerStats.dealPvPPower || 100), newTaps);
    }
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

  // Create Real-Time Duel Room
  const handleCreateLiveRoom = async () => {
    hapticEffects.purchase();
    setRoomStatusMessage('Создание комнаты...');
    const res = await createDuelRoom(
      {
        id: auth.currentUser?.uid || 'host',
        nickname: playerName,
        level: playerLevel,
        coins: playerCoins,
        avatarIcon: '🦫',
        auraEffect: 'deal_fire',
        tapPower: playerStats.dealPvPPower,
        dealRank: 'Дуэлянт',
        equippedSkinId: actualSkinId,
        equippedHatId: selectedHatId,
      },
      betCoinsChoice
    );

    if (res.success && res.roomId) {
      setCurrentLiveRoomId(res.roomId);
      setIsHost(true);
      setRoomStatusMessage(`Комната ${res.roomId} создана! Ожидание второго игрока...`);
    } else {
      setRoomStatusMessage(`Ошибка: ${res.error}`);
    }
  };

  // Join Real-Time Duel Room
  const handleJoinLiveRoom = async (room: DuelRoomData) => {
    hapticEffects.purchase();
    setRoomStatusMessage(`Подключение к ${room.hostName}...`);
    const res = await joinDuelRoom(room.roomId, {
      id: auth.currentUser?.uid || 'guest',
      nickname: playerName,
      level: playerLevel,
      coins: playerCoins,
      avatarIcon: '🦫',
      auraEffect: 'deal_fire',
      tapPower: playerStats.dealPvPPower,
      dealRank: 'Претендент',
      equippedSkinId: actualSkinId,
      equippedHatId: selectedHatId,
    });

    if (res.success) {
      setCurrentLiveRoomId(room.roomId);
      setIsHost(false);
      setSelectedOpponent({
        id: room.hostId,
        nickname: room.hostName,
        level: room.hostLevel,
        coins: room.betCoins * 2,
        avatarIcon: room.hostAvatar,
        auraEffect: 'deal_fire',
        tapPower: Math.round(room.hostLevel * 25),
        dealRank: 'Хост Комнаты',
        equippedSkinId: room.hostSkinId,
        equippedHatId: room.hostHatId,
        isOnline: true,
      });
    } else {
      setRoomStatusMessage(`Не удалось войти: ${res.error}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (oppIntervalRef.current) clearInterval(oppIntervalRef.current);
      if (currentLiveRoomId) {
        leaveDuelRoom(currentLiveRoomId, isHost);
      }
    };
  }, [currentLiveRoomId, isHost]);

  // Filtered Players
  const filteredPlayers = realPlayers.filter((p) => {
    if (playerFilter === 'online') return p.isOnline;
    if (playerFilter === 'match') return Math.abs(p.level - playerLevel) <= 20;
    return true;
  });

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
                  PvP АРЕНА
                </span>
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span>15 секунд • Ставка на банк</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {onlineCount} онлайн
                </span>
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
          <div className="grid grid-cols-4 gap-1 my-3 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('arena');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'arena'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Дуэль
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('players');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Игроки ({realPlayers.length})
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('live_rooms');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'live_rooms'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Live 1v1 ({waitingRooms.length})
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('history');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Лог
            </button>
          </div>
        )}

        {/* TAB 1: ARENA LOBBY */}
        {phase === 'lobby' && activeTab === 'arena' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            
            {/* Real Opponent Profile Match */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase text-red-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Соперник: {activeOpponent.dealRank}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  activeOpponent.isOnline 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeOpponent.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                  {activeOpponent.isOnline ? 'В СЕТИ' : 'ОФЛАЙН'}
                </span>
              </div>

              {/* Two Fighters Face-Off Showcase */}
              <div className="grid grid-cols-2 gap-3 items-center bg-black/40 p-3 rounded-2xl border border-zinc-800">
                {/* User Fighter Visual */}
                <div className="flex flex-col items-center">
                  <CharacterFighterVisual
                    skin={playerSkin}
                    overlaySkin={playerOverlaySkin}
                    hat={playerHat}
                    stats={playerStats}
                    customConfig={customConfig}
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

            {/* Quick Actions in Arena */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  hapticEffects.feverStart();
                  sound.playFeverStart();
                  setCountdown(3);
                  setPhase('countdown');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Swords className="w-5 h-5 animate-bounce" />
                <span>ПРИНЯТЬ СДЕЛКУ (БИТВА 15 СЕК)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('players')}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-blue-300 border border-blue-500/30 flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Выбрать игрока</span>
                </button>

                <button
                  onClick={handleRefuseDeal}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs font-bold text-red-400 border border-red-500/30 flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Отказаться (-50%)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REAL ONLINE PLAYERS LOBBY */}
        {phase === 'lobby' && activeTab === 'players' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            
            {/* Filter pills */}
            <div className="flex items-center justify-between gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setPlayerFilter('online')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  playerFilter === 'online' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                🟢 В сети ({realPlayers.filter(p => p.isOnline).length})
              </button>
              <button
                onClick={() => setPlayerFilter('match')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  playerFilter === 'match' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                }`}
              >
                🎯 Мой уровень
              </button>
              <button
                onClick={() => setPlayerFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  playerFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Все ({realPlayers.length})
              </button>
            </div>

            {/* Players list */}
            {loadingPlayers ? (
              <div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>Загрузка реальных игроков из Firebase...</span>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                Нет игроков по выбранному фильтру
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedOpponent?.id === player.id;
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-red-950/50 border-red-500 shadow-md shadow-red-500/20'
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                          {player.avatarIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-white truncate">
                              {player.nickname}
                            </span>
                            {player.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                            <span className="text-amber-400 font-bold">Ур. {player.level}</span>
                            <span>•</span>
                            <span>{formatNumber(player.coins)} 🪙</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            hapticEffects.tap();
                            setSelectedOpponent(player);
                            setActiveTab('arena');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Выбран' : 'Вызвать'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE 1V1 REAL-TIME ROOMS */}
        {phase === 'lobby' && activeTab === 'live_rooms' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            {/* Create Room Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  Создать Live Комнату
                </span>
                <span className="text-[10px] text-zinc-400">Синхронный тапинг 1v1</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[5000, 25000, 100000].map((bet) => (
                  <button
                    key={bet}
                    onClick={() => setBetCoinsChoice(bet)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      betCoinsChoice === bet
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {formatNumber(bet)} 🪙
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreateLiveRoom}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span>ОТКРЫТЬ КОМНАТУ НА {formatNumber(betCoinsChoice)} 🪙</span>
              </button>

              {roomStatusMessage && (
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/50 text-xs text-purple-200 text-center animate-pulse">
                  {roomStatusMessage}
                </div>
              )}
            </div>

            {/* Open Waiting Rooms List */}
            <div className="space-y-2">
              <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                Открытые комнаты других игроков ({waitingRooms.length}):
              </div>

              {waitingRooms.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-950/50 rounded-2xl border border-zinc-800">
                  Пока нет открытых комнат. Создайте свою и ждите оппонента!
                </div>
              ) : (
                waitingRooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{r.hostAvatar || '🦫'}</span>
                      <div>
                        <span className="font-black text-xs text-white block">{r.hostName}</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Ур. {r.hostLevel} • Ставка: {formatNumber(r.betCoins)} 🪙
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinLiveRoom(r)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Войти</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DEAL HISTORY */}
        {phase === 'lobby' && activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold">Побед</span>
                <span className="text-base font-black text-emerald-400">{dealStats.dealsWon || 0}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold">Поражений</span>
                <span className="text-base font-black text-red-400">{dealStats.dealsLost || 0}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-bold">Винрейт</span>
                <span className="text-base font-black text-amber-400">
                  {(dealStats.dealsWon || 0) + (dealStats.dealsLost || 0) > 0
                    ? Math.round(((dealStats.dealsWon || 0) / ((dealStats.dealsWon || 0) + (dealStats.dealsLost || 0))) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            {dealHistory.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                История дуэлей пуста. Сыграйте свою первую битву!
              </div>
            ) : (
              <div className="space-y-2">
                {dealHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                      item.won ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-red-950/30 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.opponentAvatar || '🦫'}</span>
                      <div>
                        <span className="font-bold text-xs block text-white">{item.opponentName}</span>
                        <span className="text-[10px] text-zinc-400">
                          {item.userClicks} тапов vs {item.opponentClicks} тапов
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black ${item.won ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.won ? `+${formatNumber(item.coinsChange)}` : `-${formatNumber(item.coinsChange)}`} 🪙
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PHASE: COUNTDOWN */}
        {phase === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest animate-pulse">
              ПРИГОТОВЬТЕСЬ К ТАП-ДУЭЛИ!
            </span>
            <div className="text-7xl font-black text-amber-400 animate-ping">
              {countdown > 0 ? countdown : 'БИТВА!'}
            </div>
            <p className="text-xs text-zinc-400">
              Тапайте как можно быстрее 15 секунд, чтобы победить оппонента!
            </p>
          </div>
        )}

        {/* PHASE: BATTLE */}
        {phase === 'battle' && (
          <div className="flex-1 flex flex-col justify-between p-2 space-y-3">
            
            {/* Top Battle HUD */}
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 block font-bold">{playerName}</span>
                <span className="text-sm font-black text-amber-400 font-mono">{userClicks} тапов</span>
              </div>

              <div className="text-center px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-black text-sm animate-pulse">
                ⏳ {timeLeft}с
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block font-bold">{activeOpponent.nickname}</span>
                <span className="text-sm font-black text-red-400 font-mono">{opponentClicks} тапов</span>
              </div>
            </div>

            {/* Tug of war bar */}
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-emerald-500 rounded-full transition-all duration-75"
                style={{ width: `${Math.max(5, Math.min(95, 50 + clampedTug))}%` }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/80" />
            </div>

            {/* Fighter Arenas Visuals */}
            <div className="grid grid-cols-2 gap-3 items-center py-2">
              <div className={`flex flex-col items-center transition-transform ${userAttacking ? 'scale-110' : ''} ${userHit ? 'animate-wiggle' : ''}`}>
                <CharacterFighterVisual
                  skin={playerSkin}
                  overlaySkin={playerOverlaySkin}
                  hat={playerHat}
                  stats={playerStats}
                  customConfig={customConfig}
                  side="left"
                  size="md"
                  name={playerName}
                />
              </div>

              <div className={`flex flex-col items-center transition-transform ${oppAttacking ? 'scale-110' : ''} ${oppHit ? 'animate-wiggle' : ''}`}>
                <CharacterFighterVisual
                  skin={oppSkin}
                  hat={oppHat}
                  stats={oppStats}
                  side="right"
                  size="md"
                  name={activeOpponent.nickname}
                />
              </div>
            </div>

            {/* Big Tap Area Button */}
            <button
              onPointerDown={handleUserTap}
              className="w-full py-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-lg shadow-2xl active:scale-95 transition-all select-none touch-none animate-pulse flex items-center justify-center gap-2"
              style={{ touchAction: 'none' }}
            >
              <Swords className="w-6 h-6" />
              <span>ТАПАЙ ИЗО ВСЕХ СИЛ! ({userClicks})</span>
            </button>
          </div>
        )}

        {/* PHASE: RESULT */}
        {phase === 'result' && battleResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4">
            <span className="text-5xl">{battleResult.won ? '🏆' : '💀'}</span>
            <h3 className={`text-2xl font-black ${battleResult.won ? 'text-emerald-400' : 'text-red-400'}`}>
              {battleResult.won ? 'ВЫ ОДЕРЖАЛИ ПОБЕДУ!' : 'ПОРАЖЕНИЕ В ДУЭЛИ'}
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 w-full max-w-sm space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Ваш результат:</span>
                <span className="font-bold font-mono text-white">{userClicks} тапов</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Результат соперника:</span>
                <span className="font-bold font-mono text-white">{opponentClicks} тапов</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-xs font-black">
                <span className="text-zinc-300">Награда / Штраф:</span>
                <span className={battleResult.won ? 'text-emerald-400' : 'text-red-400'}>
                  {battleResult.won ? `+${formatNumber(battleResult.coinsDelta)}` : `-${formatNumber(battleResult.coinsDelta)}`} 🪙
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                hapticEffects.tap();
                setPhase('lobby');
                setCurrentLiveRoomId(null);
              }}
              className="w-full max-w-sm py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs shadow-md"
            >
              Вернуться в Арену
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
