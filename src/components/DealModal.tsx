import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Swords, ShieldAlert, Trophy, Zap, AlertTriangle, Flame, Clock, 
  User, X, Check, Award, History, TrendingUp, TrendingDown, Sparkles, 
  Users, Radio, Globe, Shield, Skull, RefreshCw, Plus, Play, Loader2, Bot, Send, FlameKindling
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
  sendDuelChallenge,
  listenToSentChallenge,
  cancelDuelChallenge,
  generateAdaptiveBotChampions,
  BOT_CHAMPIONS,
  DuelRoomData,
  DuelChallengeData 
} from '../services/multiplayerService';
import { getPersistentUserId } from '../services/firebase';

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
    lastSundayDealDate?: string;
    penaltiesPaid: number;
  };
  dealHistory?: DealHistoryItem[];
  immortalUnlocked?: boolean;
  isMandatoryWeeklyDeal?: boolean;
  initialLiveRoomId?: string | null;
  initialIsHost?: boolean;
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
  isMandatoryWeeklyDeal = false,
  initialLiveRoomId = null,
  initialIsHost = false,
  onCompleteDeal,
  onPayPenalty,
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'players' | 'live_rooms' | 'history'>('arena');
  const [phase, setPhase] = useState<'lobby' | 'matching' | 'countdown' | 'battle' | 'result'>(
    initialLiveRoomId ? 'countdown' : 'lobby'
  );
  const [onlineRealPlayers, setOnlineRealPlayers] = useState<DealOpponent[]>([]);
  const [botOpponents, setBotOpponents] = useState<DealOpponent[]>(() => generateAdaptiveBotChampions(playerLevel, playerCoins));
  const [onlineCount, setOnlineCount] = useState(1);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<DealOpponent | null>(null);

  // Live Duel Room state
  const [waitingRooms, setWaitingRooms] = useState<DuelRoomData[]>([]);
  const [currentLiveRoomId, setCurrentLiveRoomId] = useState<string | null>(initialLiveRoomId || null);
  const [liveRoomData, setLiveRoomData] = useState<DuelRoomData | null>(null);
  const [isHost, setIsHost] = useState(initialIsHost);
  const [betCoinsChoice, setBetCoinsChoice] = useState(25000);
  const [searchTimer, setSearchTimer] = useState(0);

  // Direct 1v1 Challenge Modal state
  const [challengeTargetPlayer, setChallengeTargetPlayer] = useState<DealOpponent | null>(null);
  const [sentChallengeId, setSentChallengeId] = useState<string | null>(null);
  const [sentChallengeStatus, setSentChallengeStatus] = useState<string | null>(null);
  const [challengeTimer, setChallengeTimer] = useState(25);

  const myUid = useMemo(() => getPersistentUserId(), []);

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
    const unsubscribe = subscribeToActivePlayers(playerLevel, playerCoins, (realPlayers, bots, count) => {
      // Exclude oneself
      const nonSelf = realPlayers.filter((p) => p.id !== myUid && p.nickname !== playerName);
      setOnlineRealPlayers(nonSelf);
      setBotOpponents(bots);
      setOnlineCount(count);
      setLoadingPlayers(false);

      if (!selectedOpponent) {
        if (nonSelf.length > 0) {
          const sorted = [...nonSelf].sort(
            (a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel)
          );
          setSelectedOpponent(sorted[0]);
        } else {
          const sortedBots = [...bots].sort(
            (a, b) => Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel)
          );
          setSelectedOpponent(sortedBots[0]);
        }
      }
    });

    const unsubRooms = listenToWaitingRooms((rooms) => {
      setWaitingRooms(rooms.filter((r) => r.hostId !== myUid));
    });

    return () => {
      unsubscribe();
      unsubRooms();
    };
  }, [playerLevel, playerCoins, myUid, playerName]);

  // Listen to sent challenge status
  useEffect(() => {
    if (!sentChallengeId) return;

    const interval = setInterval(() => {
      setChallengeTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setSentChallengeStatus('Время ожидания ответа истекло.');
          setTimeout(() => {
            setSentChallengeId(null);
            setSentChallengeStatus(null);
          }, 3000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const unsub = listenToSentChallenge(sentChallengeId, (challenge) => {
      if (!challenge) return;

      if (challenge.status === 'accepted' && challenge.roomId) {
        sound.playComboSuccess();
        hapticEffects.feverStart();
        setCurrentLiveRoomId(challenge.roomId);
        setIsHost(true);
        setSentChallengeId(null);
        setChallengeTargetPlayer(null);
        setCountdown(3);
        setPhase('countdown');
      } else if (challenge.status === 'declined') {
        sound.playError();
        hapticEffects.warning();
        setSentChallengeStatus(`Игрок ${challenge.toName} отклонил ваш вызов на дуэль.`);
        setTimeout(() => {
          setSentChallengeId(null);
          setSentChallengeStatus(null);
          setChallengeTargetPlayer(null);
        }, 3500);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [sentChallengeId]);

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
  const lastTapSyncRef = useRef<number>(0);
  const userClicksRef = useRef(0);
  const oppClicksRef = useRef(0);
  const finishCalledRef = useRef(false);

  // Active opponent resolution
  const activeOpponent: DealOpponent = useMemo(() => {
    if (currentLiveRoomId && liveRoomData) {
      if (isHost) {
        return {
          id: liveRoomData.guestId || 'guest_id',
          nickname: liveRoomData.guestName || 'Соперник в комнате',
          level: liveRoomData.guestLevel || playerLevel,
          coins: liveRoomData.betCoins * 2,
          avatarIcon: liveRoomData.guestAvatar || '🦫',
          auraEffect: 'deal_fire',
          tapPower: Math.max(80, Math.round((liveRoomData.guestLevel || playerLevel) * 25)),
          dealRank: 'Дуэлянт',
          equippedSkinId: liveRoomData.guestSkinId || 'skin_default',
          equippedHatId: liveRoomData.guestHatId || 'hat_none',
          isOnline: true,
          isBot: false,
        };
      } else {
        return {
          id: liveRoomData.hostId,
          nickname: liveRoomData.hostName,
          level: liveRoomData.hostLevel,
          coins: liveRoomData.betCoins * 2,
          avatarIcon: liveRoomData.hostAvatar,
          auraEffect: 'deal_fire',
          tapPower: Math.max(80, Math.round(liveRoomData.hostLevel * 25)),
          dealRank: 'Хост Комнаты',
          equippedSkinId: liveRoomData.hostSkinId,
          equippedHatId: liveRoomData.hostHatId,
          isOnline: true,
          isBot: false,
        };
      }
    }

    if (selectedOpponent && selectedOpponent.id !== myUid && selectedOpponent.nickname !== playerName) {
      return selectedOpponent;
    }

    if (onlineRealPlayers.length > 0) {
      return onlineRealPlayers[0];
    }

    return botOpponents[0] || BOT_CHAMPIONS[0];
  }, [currentLiveRoomId, liveRoomData, isHost, selectedOpponent, myUid, playerName, onlineRealPlayers, botOpponents, playerLevel]);

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

    const won = forcedWinnerId ? forcedWinnerId === myUid : finalUserClicks >= finalOppClicks;
    
    const duelBet = currentLiveRoomId && liveRoomData?.betCoins
      ? liveRoomData.betCoins
      : isMandatoryWeeklyDeal
        ? Math.max(10000, Math.round(playerCoins * 0.5))
        : betCoinsChoice;

    const coinsDelta = duelBet;

    setBattleResult({ won, coinsDelta });

    if (won) {
      sound.playLevelUp();
      sound.playComboSuccess();
    } else {
      sound.playWarning();
      sound.playError();
      hapticEffects.warning();
    }

    if (currentLiveRoomId) {
      const loserUid = won ? (activeOpponent.userId || activeOpponent.id) : myUid;
      const winnerUid = won ? myUid : (activeOpponent.userId || activeOpponent.id);
      finishDuelRoom(currentLiveRoomId, winnerUid, loserUid, coinsDelta);
    }

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

  // Matchmaking ticker
  useEffect(() => {
    if (phase === 'matching') {
      const interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSearchTimer(0);
    }
  }, [phase]);

  // Live Room Real-time Subscription Listener
  useEffect(() => {
    if (!currentLiveRoomId) return;

    const unsub = subscribeToDuelRoom(currentLiveRoomId, (room) => {
      if (!room) return;
      setLiveRoomData(room);
      if (room.betCoins) {
        setBetCoinsChoice(room.betCoins);
      }

      if ((room.status === 'starting' || (room.guestId && room.status === 'waiting')) && (phase === 'matching' || phase === 'lobby')) {
        setCountdown(3);
        setPhase('countdown');
      }

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

    // Dynamically adaptive AI Bot speed and tap cadence
    if (!currentLiveRoomId) {
      const botPower = activeOpponent.tapPower || playerStats.dealPvPPower || 100;
      // Adaptive click speed: from 105ms to 170ms based on level
      const oppBaseSpeedMs = Math.max(105, 185 - Math.min(80, botPower / 30));
      const clickSuccessRate = Math.min(0.96, 0.82 + Math.min(0.14, activeOpponent.level / 200));

      oppIntervalRef.current = setInterval(() => {
        const willClick = Math.random() < clickSuccessRate;
        if (willClick) {
          oppClicksRef.current += 1;
          setOpponentClicks((c) => c + 1);
          setOppAttacking(true);
          setUserHit(true);
          setTimeout(() => {
            setOppAttacking(false);
            setUserHit(false);
          }, 85);
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
    }, 85);

    // Sync to Firestore Live room throttled
    if (currentLiveRoomId) {
      const now = Date.now();
      if (now - lastTapSyncRef.current > 120) {
        lastTapSyncRef.current = now;
        updateDuelTap(currentLiveRoomId, isHost, newTaps * (playerStats.dealPvPPower || 100), newTaps);
      }
    }
  };

  // 1-Click Quick Match Live 1v1
  const handleQuickMatch = async () => {
    hapticEffects.feverStart();
    sound.playFeverStart();
    setPhase('matching');

    const availableRoom = waitingRooms.find((r) => r.status === 'waiting' && r.hostId !== myUid);

    if (availableRoom) {
      const res = await joinDuelRoom(availableRoom.roomId, {
        id: myUid,
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
        setCurrentLiveRoomId(availableRoom.roomId);
        setIsHost(false);
        setCountdown(3);
        setPhase('countdown');
        return;
      }
    }

    const createRes = await createDuelRoom(
      {
        id: myUid,
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

    if (createRes.success && createRes.roomId) {
      setCurrentLiveRoomId(createRes.roomId);
      setIsHost(true);
    }
  };

  // Send Direct Duel Challenge to another Online Player
  const handleSendDirectChallenge = async (targetPlayer: DealOpponent) => {
    hapticEffects.feverStart();
    sound.playTick();
    setChallengeTimer(25);
    setSentChallengeStatus(null);

    const res = await sendDuelChallenge(
      {
        id: myUid,
        nickname: playerName,
        level: playerLevel,
        avatar: playerSkin.icon || '🦫',
        skinId: actualSkinId,
        hatId: selectedHatId,
      },
      {
        id: targetPlayer.id,
        nickname: targetPlayer.nickname,
      },
      betCoinsChoice
    );

    if (res.success && res.challengeId) {
      setSentChallengeId(res.challengeId);
    } else {
      setSentChallengeStatus(res.error || 'Ошибка отправки вызова');
    }
  };

  const handleCancelDirectChallenge = () => {
    if (sentChallengeId) {
      cancelDuelChallenge(sentChallengeId);
      setSentChallengeId(null);
    }
    setChallengeTargetPlayer(null);
    setSentChallengeStatus(null);
  };

  const handleStartAsyncDuel = () => {
    if (currentLiveRoomId) {
      leaveDuelRoom(currentLiveRoomId, isHost);
      setCurrentLiveRoomId(null);
    }
    setCountdown(3);
    setPhase('countdown');
  };

  const handleRefuseDeal = () => {
    sound.playWarning();
    hapticEffects.warning();
    const debuff: LossDebuff = {
      name: isMandatoryWeeklyDeal ? 'Штраф за Отказ от Воскресной Сделки' : 'Штраф за Отказ от Сделки',
      desc: '-40% к доходу на 15 минут за отказ от обязательного боя',
      percent: 0.4,
      expiresAt: Date.now() + 1000 * 60 * 15,
      icon: '🚫'
    };
    setTimeout(() => {
      onPayPenalty(penaltyAmount, debuff);
      onClose();
    }, 0);
  };

  const handleCancelMatching = () => {
    if (currentLiveRoomId) {
      leaveDuelRoom(currentLiveRoomId, isHost);
      setCurrentLiveRoomId(null);
    }
    setPhase('lobby');
  };

  // Bet Presets: 5k, 25k, 100k, 50% bank, All-in (capped at opponent's coins)
  const halfBudget = Math.max(1000, Math.floor(playerCoins * 0.5));
  const opponentMaxBank = challengeTargetPlayer ? challengeTargetPlayer.coins : playerCoins;
  const maxAllInBet = Math.min(playerCoins, opponentMaxBank);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (oppIntervalRef.current) clearInterval(oppIntervalRef.current);
      if (currentLiveRoomId) {
        leaveDuelRoom(currentLiveRoomId, isHost);
      }
      if (sentChallengeId) {
        cancelDuelChallenge(sentChallengeId);
      }
    };
  }, [currentLiveRoomId, isHost, sentChallengeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className={`bg-zinc-900 border w-full max-w-lg rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white relative ${
        isMandatoryWeeklyDeal ? 'border-amber-500 shadow-amber-500/20' : 'border-red-500/50 shadow-red-500/10'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isMandatoryWeeklyDeal ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}>
              <Swords className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                {isMandatoryWeeklyDeal ? 'СДЕЛКА ВЕКА' : 'СДЕЛКА ВЕКА'}
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse ${
                  isMandatoryWeeklyDeal ? 'bg-amber-500 text-black' : 'bg-red-600 text-white'
                }`}>
                  {isMandatoryWeeklyDeal ? '🚨 ВОСКРЕСНЫЙ БОЙ' : 'PvP АРЕНА'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span>15 секунд • Ставка на банк</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {onlineRealPlayers.length + 1} онлайн
                </span>
              </p>
            </div>
          </div>
          {phase === 'lobby' && !isMandatoryWeeklyDeal && (
            <button
              onClick={() => {
                hapticEffects.tap();
                onClose();
              }}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Weekly Mandatory Alert Banner */}
        {isMandatoryWeeklyDeal && phase === 'lobby' && (
          <div className="my-2.5 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block font-black text-white">Воскресная битва (1 раз в неделю)!</strong>
              <span>В сети несколько игроков. Сразитесь с противником или потеряйте 50% банка при отказе.</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {phase === 'lobby' && !isMandatoryWeeklyDeal && (
          <div className="grid grid-cols-4 gap-1 my-3 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('arena');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Игроки ({onlineRealPlayers.length})
            </button>
            <button
              onClick={() => {
                hapticEffects.tap();
                setActiveTab('live_rooms');
              }}
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
              className={`py-2 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
        {phase === 'lobby' && (activeTab === 'arena' || isMandatoryWeeklyDeal) && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            
            {/* Opponent Profile Match Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-red-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase text-red-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Соперник: {activeOpponent.dealRank}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  activeOpponent.isOnline 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                }`}>
                  {activeOpponent.isOnline ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      🟢 ИГРОК ОНЛАЙН
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-purple-400" />
                      🤖 БОТ-АДАПТИВНЫЙ
                    </>
                  )}
                </span>
              </div>

              {/* Two Fighters Face-Off Showcase */}
              <div className="grid grid-cols-2 gap-3 items-center bg-black/40 p-3 rounded-2xl border border-zinc-800">
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

              {/* Stake info & Bet Selection */}
              {!isMandatoryWeeklyDeal && (
                <div className="space-y-2 mt-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-bold">Ставка на эту дуэль:</span>
                    <span className="text-xs font-black text-amber-400 font-mono">{formatNumber(betCoinsChoice)} 🪙</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {[5000, 25000, 100000].map((bet) => (
                      <button
                        key={bet}
                        type="button"
                        onClick={() => {
                          hapticEffects.tap();
                          setBetCoinsChoice(bet);
                        }}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          betCoinsChoice === bet
                            ? 'bg-red-600 text-white border-red-400 shadow-md'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {formatNumber(bet)} 🪙
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        hapticEffects.tap();
                        setBetCoinsChoice(halfBudget);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        betCoinsChoice === halfBudget
                          ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                          : 'bg-zinc-900 text-amber-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      🌓 50% ({formatNumber(halfBudget)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hapticEffects.tap();
                        setBetCoinsChoice(maxAllInBet);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        betCoinsChoice === maxAllInBet
                          ? 'bg-red-600 text-white border-red-400 shadow-md'
                          : 'bg-zinc-900 text-red-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      🔥 ВА-БАНК ({formatNumber(maxAllInBet)})
                    </button>
                  </div>
                </div>
              )}

              {/* Stake info */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Выигрыш за победу:</span>
                  <span className="text-xs font-black text-emerald-400">
                    +{formatNumber(isMandatoryWeeklyDeal ? Math.round(activeOpponent.coins * 0.6) : betCoinsChoice)} 🪙
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">
                    {isMandatoryWeeklyDeal ? 'Штраф за отказ (50%):' : 'Потеря при поражении:'}
                  </span>
                  <span className="text-xs font-black text-red-400">
                    -{formatNumber(isMandatoryWeeklyDeal ? penaltyAmount : Math.min(playerCoins, betCoinsChoice))} 🪙
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions in Arena */}
            <div className="space-y-2">
              <button
                onClick={handleStartAsyncDuel}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Swords className="w-5 h-5 animate-bounce" />
                <span>ПРИНЯТЬ ВЫЗОВ (БИТВА 15 СЕК)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {!isMandatoryWeeklyDeal && (
                  <button
                    onClick={handleQuickMatch}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span>⚡ Live 1v1 Поиск</span>
                  </button>
                )}

                <button
                  onClick={handleRefuseDeal}
                  className={`py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-xs font-bold text-red-400 border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isMandatoryWeeklyDeal ? 'col-span-2' : ''
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Отказаться (-50% банка)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REAL ONLINE PLAYERS & DIRECT CHALLENGE */}
        {phase === 'lobby' && activeTab === 'players' && !isMandatoryWeeklyDeal && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            
            {/* Real Online Players Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Реальные Игроки Онлайн ({onlineRealPlayers.length})
                </span>
                <span className="text-[10px] text-zinc-500">Прямой вызов на 1v1</span>
              </div>

              {loadingPlayers ? (
                <div className="p-6 text-center text-zinc-400 flex flex-col items-center gap-2 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span className="text-xs">Поиск игроков в сети...</span>
                </div>
              ) : onlineRealPlayers.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-950/50 rounded-2xl border border-zinc-800/80">
                  <p className="font-bold text-zinc-300">Сейчас нет других игроков в сети.</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Вы можете сразиться с Ботами-Чемпионами ниже!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineRealPlayers.map((player) => {
                    return (
                      <div
                        key={player.id}
                        className="p-3 rounded-2xl border bg-zinc-950/80 border-zinc-800 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-emerald-500/50 flex items-center justify-center text-xl shrink-0">
                            {player.avatarIcon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-white truncate">
                                {player.nickname}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
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
                              setChallengeTargetPlayer(player);
                              setBetCoinsChoice(Math.min(25000, player.coins));
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>Вызвать</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Bot Champions Section - Adaptive scaling to player level */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  Боты-Чемпионы (ИИ под ваш уровень)
                </span>
                <span className="text-[10px] text-zinc-500">Адаптивная сложность</span>
              </div>

              <div className="space-y-1.5">
                {botOpponents.map((bot) => {
                  return (
                    <div
                      key={bot.id}
                      className="p-3 rounded-2xl border bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-purple-500/40 flex items-center justify-center text-xl shrink-0">
                          {bot.avatarIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-purple-200 truncate">
                              {bot.nickname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                            <span className="text-amber-400 font-bold">Ур. {bot.level}</span>
                            <span>•</span>
                            <span>{bot.dealRank}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          hapticEffects.tap();
                          setSelectedOpponent(bot);
                          setActiveTab('arena');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Сразиться</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: LIVE 1V1 REAL-TIME ROOMS */}
        {phase === 'lobby' && activeTab === 'live_rooms' && !isMandatoryWeeklyDeal && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  Быстрый Поиск 1v1
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Синхронный бой</span>
              </div>

              {/* 5 Betting Modes */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[5000, 25000, 100000].map((bet) => (
                  <button
                    key={bet}
                    onClick={() => setBetCoinsChoice(bet)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      betCoinsChoice === bet
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {formatNumber(bet)} 🪙
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-center">
                <button
                  onClick={() => setBetCoinsChoice(halfBudget)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    betCoinsChoice === halfBudget
                      ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                      : 'bg-zinc-900 text-amber-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  🌓 50% банка ({formatNumber(halfBudget)})
                </button>
                <button
                  onClick={() => setBetCoinsChoice(playerCoins)}
                  className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    betCoinsChoice === playerCoins
                      ? 'bg-red-600 text-white border-red-400 shadow-md'
                      : 'bg-zinc-900 text-red-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  🔥 ВА-БАНК ({formatNumber(playerCoins)})
                </button>
              </div>

              <button
                onClick={handleQuickMatch}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>НАЙТИ ИЛИ СОЗДАТЬ БИТВУ НА {formatNumber(betCoinsChoice)} 🪙</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                Открытые комнаты других игроков ({waitingRooms.length}):
              </div>

              {waitingRooms.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-950/50 rounded-2xl border border-zinc-800">
                  Пока нет открытых комнат. Нажмите поиск выше, чтобы создать свою и ждать соперника!
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
                      onClick={async () => {
                        hapticEffects.purchase();
                        const res = await joinDuelRoom(r.roomId, {
                          id: myUid,
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
                          setCurrentLiveRoomId(r.roomId);
                          setIsHost(false);
                          setCountdown(3);
                          setPhase('countdown');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md flex items-center gap-1 cursor-pointer"
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
        {phase === 'lobby' && activeTab === 'history' && !isMandatoryWeeklyDeal && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
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

        {/* DIRECT CHALLENGE PROMPT MODAL WITH 5 BETTING MODES */}
        {challengeTargetPlayer && !sentChallengeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-zinc-900 border border-red-500/60 w-full max-w-sm rounded-3xl p-5 text-center space-y-3.5 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 mx-auto flex items-center justify-center text-2xl">
                ⚔️
              </div>
              <div>
                <h4 className="font-black text-sm text-white">Вызвать на дуэль 1v1</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Игрок: <strong className="text-emerald-400">{challengeTargetPlayer.nickname}</strong> (Ур. {challengeTargetPlayer.level})
                </p>
                <p className="text-[11px] text-amber-400 font-mono">
                  Банк соперника: {formatNumber(challengeTargetPlayer.coins)} 🪙
                </p>
              </div>

              {/* 5 Bet Modes */}
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] text-zinc-400 font-bold block">Выберите ставку коинов:</span>
                
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[5000, 25000, 100000].map((bet) => (
                    <button
                      key={bet}
                      onClick={() => setBetCoinsChoice(bet)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        betCoinsChoice === bet
                          ? 'bg-red-600 text-white border-red-400 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {formatNumber(bet)} 🪙
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-center pt-0.5">
                  <button
                    onClick={() => setBetCoinsChoice(halfBudget)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      betCoinsChoice === halfBudget
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-zinc-950 text-amber-400 border-zinc-800'
                    }`}
                  >
                    🌓 50% банка ({formatNumber(halfBudget)})
                  </button>

                  <button
                    onClick={() => setBetCoinsChoice(maxAllInBet)}
                    className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      betCoinsChoice === maxAllInBet
                        ? 'bg-red-600 text-white border-red-400 shadow-md'
                        : 'bg-zinc-950 text-red-400 border-zinc-800'
                    }`}
                  >
                    🔥 ВА-БАНК ({formatNumber(maxAllInBet)})
                  </button>
                </div>

                {challengeTargetPlayer.coins < playerCoins && (
                  <p className="text-[10px] text-amber-400/90 text-center font-bold">
                    ⚠️ Ва-банк ограничен банком соперника ({formatNumber(challengeTargetPlayer.coins)} 🪙)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleSendDirectChallenge(challengeTargetPlayer)}
                  className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-white font-black text-xs shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить ({formatNumber(betCoinsChoice)} 🪙)</span>
                </button>
                <button
                  onClick={() => setChallengeTargetPlayer(null)}
                  className="py-2.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIRECT CHALLENGE WAITING RADAR POPUP */}
        {sentChallengeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-zinc-900 border border-amber-500/60 w-full max-w-xs rounded-3xl p-5 text-center space-y-4 shadow-2xl">
              <div className="relative flex items-center justify-center mx-auto w-16 h-16">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 animate-ping absolute" />
                <div className="w-14 h-14 rounded-full bg-zinc-950 border border-amber-400 flex items-center justify-center text-2xl relative z-10">
                  <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-white">Ожидание ответа соперника</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Вызов отправлен игроку <strong className="text-white">{challengeTargetPlayer?.nickname}</strong>
                </p>
                <div className="text-amber-400 font-mono text-xs font-bold mt-2">
                  ⏱️ Авто-отмена через: {challengeTimer}с
                </div>
                {sentChallengeStatus && (
                  <p className="text-xs text-red-400 font-bold mt-2 animate-pulse">{sentChallengeStatus}</p>
                )}
              </div>

              <button
                onClick={handleCancelDirectChallenge}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
              >
                Отменить вызов
              </button>
            </div>
          </div>
        )}

        {/* PHASE: MATCHING */}
        {phase === 'matching' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-purple-600/20 border-2 border-purple-500 animate-ping absolute" />
              <div className="w-20 h-20 rounded-full bg-purple-900/60 border border-purple-400 flex items-center justify-center text-3xl shadow-lg shadow-purple-600/40 relative z-10">
                <Loader2 className="w-10 h-10 text-purple-300 animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Поиск живого соперника...</h3>
              <p className="text-xs text-zinc-400">
                Комната открыта ({currentLiveRoomId || 'создание'}). Ожидаем подключение второго игрока ({searchTimer}с)
              </p>
            </div>

            <div className="space-y-2 w-full max-w-xs">
              <button
                onClick={handleStartAsyncDuel}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>Сразиться с адаптивным ботом</span>
              </button>

              <button
                onClick={handleCancelMatching}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Отмена
              </button>
            </div>
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
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 block font-bold truncate max-w-[100px]">{playerName}</span>
                <span className="text-sm font-black text-amber-400 font-mono">{userClicks} тапов</span>
              </div>

              <div className="text-center px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-black text-sm animate-pulse">
                ⏳ {timeLeft}с
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block font-bold truncate max-w-[100px]">{activeOpponent.nickname}</span>
                <span className="text-sm font-black text-red-400 font-mono">{opponentClicks} тапов</span>
              </div>
            </div>

            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-emerald-500 rounded-full transition-all duration-75"
                style={{ width: `${Math.max(5, Math.min(95, 50 + clampedTug))}%` }}
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/80" />
            </div>

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

            <button
              onPointerDown={handleUserTap}
              className="w-full py-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-lg shadow-2xl active:scale-95 transition-all select-none touch-none animate-pulse flex items-center justify-center gap-2 cursor-pointer"
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
                if (isMandatoryWeeklyDeal) {
                  onClose();
                } else {
                  setPhase('lobby');
                  setCurrentLiveRoomId(null);
                }
              }}
              className="w-full max-w-sm py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs shadow-md cursor-pointer"
            >
              {isMandatoryWeeklyDeal ? 'Завершить Воскресную Сделку' : 'Вернуться в Арену'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
