/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  GameSaveData,
  GameLevel,
  UpgradeItem,
  Artifact,
  DailyStreakDay,
  HamsterCard,
  CharacterSkin,
  CharacterHat,
  DealOpponent,
  LossDebuff,
} from './types/game';
import { GAME_LEVELS } from './data/levels';
import { getCardUpgradeCost } from './utils/cardEconomics';
import { DEFAULT_UPGRADES, DEFAULT_ARTIFACTS } from './data/upgrades';
import { HAMSTER_CARDS, DAILY_COMBO_CARD_IDS, DAILY_COMBO_REWARD_COINS } from './data/cards';
import { CHARACTER_SKINS, CHARACTER_HATS, HAMSTER_LEAGUES } from './data/skins';
import { LEVEL_PERKS } from './data/perks';
import { MEME_ACHIEVEMENTS } from './data/memeAchievements';
import { evaluateSecretEvents } from './utils/secretEventsChecker';
import { formatNumber, formatTimeSeconds } from './utils/format';
import { sound } from './utils/audio';
import { hapticEffects, isHapticsEnabled, setHapticsEnabled } from './utils/haptics';
import { testFirestoreConnection } from './services/firebase';
import {
  loadGameLocally,
  saveGameLocally,
  saveGameToCloud,
  exportSaveString,
  importSaveString,
} from './services/cloudSave';
import { loadUserProgress, saveUserProgress } from './services/telegramFirestore';

import { MainTapper } from './components/MainTapper';
import { UpgradesPanel } from './components/UpgradesPanel';
import { BossBattleModal } from './components/BossBattleModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { LevelsOverviewModal } from './components/LevelsOverviewModal';
import { CloudSaveModal } from './components/CloudSaveModal';
import { OfflineEarningsModal } from './components/OfflineEarningsModal';
import { FlyingEvent } from './components/FlyingEvent';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PerksModal } from './components/PerksModal';
import { SkinsModal } from './components/SkinsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { EnergyBoostModal } from './components/EnergyBoostModal';
import { FeaturesDrawerModal } from './components/FeaturesDrawerModal';
import { DailyComboModal } from './components/DailyComboModal';
import { CharacterModal } from './components/CharacterModal';
import { DealModal } from './components/DealModal';
import { ResetPerksModal } from './components/ResetPerksModal';
import { SecretEventsModal } from './components/SecretEventsModal';
import { initTelegramApp, TelegramUser } from './utils/telegram';
import { NotificationToast, AppNotification } from './components/NotificationToast';

// Telegram navigation tabs
type MainTab = 'tap' | 'mine' | 'combo' | 'deal' | 'character' | 'upgrades' | 'airdrop';

export default function App() {
  const [saveData, setSaveData] = useState<GameSaveData>(() => loadGameLocally());
  
  // Load and Autosave logic
  useEffect(() => {
    
    // Load
    const loadData = async () => {
      const cloudData = await loadUserProgress();
      if (cloudData) {
        setSaveData(cloudData);
      }
    };
    loadData();

    // Autosave on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveUserProgress(saveData);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Run once on mount

  // Local save on every change
  useEffect(() => {
    saveGameLocally(saveData);
  }, [saveData]);

  // Background cloud sync
  useEffect(() => {
    const timer = setTimeout(() => {
      saveUserProgress(saveData);
    }, 10000); // Increased delay to 10s
    return () => clearTimeout(timer);
  }, [saveData]);

  const [currentTab, setCurrentTab] = useState<MainTab>('tap');
  const [activeModal, setActiveModal] = useState<
    | 'none'
    | 'boss'
    | 'rewards'
    | 'levels'
    | 'cloud'
    | 'offline'
    | 'leaderboard'
    | 'perks'
    | 'skins'
    | 'character'
    | 'deal'
    | 'achievements'
    | 'energy_boost'
    | 'drawer'
    | 'daily_combo'
    | 'reset_perks'
    | 'secret_events'
  >('none');

  // Offline earnings state
  const [offlineEarnings, setOfflineEarnings] = useState<{ elapsedMs: number; coins: number } | null>(null);

  // Fever State
  const [feverGauge, setFeverGauge] = useState(0); // 0 to 100
  const [isFeverActive, setIsFeverActive] = useState(false);
  const feverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Haptic state sync
  const [hapticsOn, setHapticsOn] = useState(() => isHapticsEnabled());

  // Cards category filter for Mine tab
  const [cardCategory, setCardCategory] = useState<'all' | 'memes' | 'pr' | 'legal' | 'tech' | 'specials'>('all');

  // Telegram User & In-App Notification Toast state
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Neuromuscular Impulse Tap Mode state
  const [isNeuromuscularActive, setIsNeuromuscularActive] = useState(false);
  const [neuromuscularCooldown, setNeuromuscularCooldown] = useState(0);

  const addNotification = useCallback(
    (title: string, message: string, type: AppNotification['type'], icon?: string) => {
      const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setNotifications((prev) => [...prev.slice(-3), { id, title, message, type, icon, timestamp: Date.now() }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4200);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Initialize Telegram WebApp SDK & Sync User Account
  useEffect(() => {
    const { user, isTelegram: activeInTelegram } = initTelegramApp();
    setIsTelegram(activeInTelegram);
    if (user) {
      setTgUser(user);
      const userHandle = user.username ? `@${user.username}` : `${user.first_name} ${user.last_name || ''}`.trim();
      
      // Load user-specific save from localStorage / cloud for this individual Telegram user ID!
      const tgSave = loadGameLocally(user.id);
      setSaveData({
        ...tgSave,
        playerName: userHandle || tgSave.playerName,
      });

      addNotification(
        '🔵 Аккаунт Telegram Подключен',
        `Индивидуальный профиль ${userHandle} (ID: ${user.id})`,
        'telegram',
        '🔵'
      );
    }
  }, [addNotification]);

  // Handle Neuromuscular Impulse Trigger
  const triggerNeuromuscularTap = useCallback(() => {
    if (isNeuromuscularActive || neuromuscularCooldown > 0) return;

    sound.playFeverStart();
    hapticEffects.feverStart();
    setIsNeuromuscularActive(true);
    addNotification('⚡ Нейро-Тап Активирован!', 'Урон всех тапов x5 на 12 секунд! Наноси нейроудары!', 'neuromuscular', '⚡');

    setTimeout(() => {
      setIsNeuromuscularActive(false);
      setNeuromuscularCooldown(30);
      addNotification('⚡ Нейро-Тап Перезаряжается', 'Перезарядка 30 секунд...', 'info', '⏳');
    }, 12000);
  }, [isNeuromuscularActive, neuromuscularCooldown, addNotification]);

  // Cooldown timer for Neuromuscular Mode
  useEffect(() => {
    if (neuromuscularCooldown > 0) {
      const timer = setInterval(() => {
        setNeuromuscularCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [neuromuscularCooldown]);

  // Verify Firestore connection on startup
  useEffect(() => {
    testFirestoreConnection().then((ok) => {
      if (!ok) console.log('Firestore connection ready');
    });
  }, []);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Reset daily boosts at midnight if needed
  useEffect(() => {
    if (saveData.lastEnergyBoostDate !== todayStr) {
      setSaveData((prev) => ({
        ...prev,
        lastEnergyBoostDate: todayStr,
        fullEnergyBoostsLeft: 6,
        turboBoostsLeft: 3,
      }));
    }
  }, [todayStr, saveData.lastEnergyBoostDate]);

  // Automatic evaluation of 50 Secret Events
  useEffect(() => {
    const result = evaluateSecretEvents(saveData);
    if (result.unlockedEvents.length > 0) {
      sound.playAchievement();
      hapticEffects.feverStart();
      setSaveData((prev) => ({
        ...prev,
        gems: prev.gems + result.newGems,
        perkPoints: prev.perkPoints + result.newPerkPoints,
        unlockedHatIds: Array.from(new Set([...(prev.unlockedHatIds || ['hat_none']), ...result.newHats])),
        unlockedSkinIds: Array.from(new Set([...(prev.unlockedSkinIds || ['skin_default']), ...result.newSkins])),
        unlockedSecretEvents: Array.from(
          new Set([...(prev.unlockedSecretEvents || []), ...result.unlockedEvents.map((e) => e.id)])
        ),
      }));
    }
  }, [
    saveData.totalTaps,
    saveData.coins,
    saveData.level,
    saveData.dealStats?.dealsWon,
    saveData.dealStats?.penaltiesPaid,
    saveData.completedBosses?.length,
    saveData.perks,
  ]);

  // Current Level Definition
  const currentLevelDef: GameLevel = useMemo(() => {
    const lvlIndex = Math.min(Math.max(1, saveData.level), GAME_LEVELS.length) - 1;
    return GAME_LEVELS[lvlIndex] || GAME_LEVELS[0];
  }, [saveData.level]);

  // Active Skin Definition
  const activeSkin = useMemo(() => {
    return CHARACTER_SKINS.find((s) => s.id === saveData.selectedSkinId) || CHARACTER_SKINS[0];
  }, [saveData.selectedSkinId]);

  // Active Hat Definition
  const activeHat = useMemo(() => {
    return CHARACTER_HATS.find((h) => h.id === saveData.selectedHatId) || CHARACTER_HATS[0];
  }, [saveData.selectedHatId]);

  // Current League
  const currentLeague = useMemo(() => {
    const sorted = [...HAMSTER_LEAGUES].sort((a, b) => b.minCoins - a.minCoins);
    return sorted.find((l) => saveData.coins >= l.minCoins) || HAMSTER_LEAGUES[0];
  }, [saveData.coins]);

  const nextLeague = useMemo(() => {
    const idx = HAMSTER_LEAGUES.findIndex((l) => l.id === currentLeague.id);
    return idx < HAMSTER_LEAGUES.length - 1 ? HAMSTER_LEAGUES[idx + 1] : null;
  }, [currentLeague]);

  // Calculate profit per hour from cards
  const profitPerHour = useMemo(() => {
    return HAMSTER_CARDS.reduce((sum, card) => {
      const lvl = saveData.cards?.[card.id] || 0;
      return sum + lvl * card.profitPerHourBase;
    }, 0);
  }, [saveData.cards]);

  // Derived stats from Upgrades, Artifacts, Perks, and Cards
  const calculatedStats = useMemo(() => {
    let tapPower = 1;
    let idleIncome = Math.round(profitPerHour / 3600); // 1 hour = 3600s
    let critChance = 5; // base 5%
    let critMultiplier = 3; // base 3x
    let feverBonusTime = 0;
    let bossBonusTime = 0;
    let allIncomeBonus = 0;
    let offlineBonus = 0;
    let energyRegenRate = 3; // base 3 energy / sec
    let maxEnergyBonus = 0;

    // Upgrades
    DEFAULT_UPGRADES.forEach((u) => {
      const lvl = saveData.upgrades[u.id] || 0;
      if (lvl > 0) {
        if (u.type === 'tap') tapPower += u.effectValue * lvl;
        else if (u.type === 'idle') idleIncome += u.effectValue * lvl;
        else if (u.type === 'crit_chance') critChance += u.effectValue * lvl;
      }
    });

    // Artifacts
    DEFAULT_ARTIFACTS.forEach((a) => {
      const lvl = saveData.artifacts[a.id] || 0;
      if (lvl > 0) {
        if (a.bonusType === 'all_income') allIncomeBonus += a.bonusValue * lvl;
        if (a.bonusType === 'offline_rate') offlineBonus += a.bonusValue * lvl;
        if (a.bonusType === 'fever_time') feverBonusTime += a.bonusValue * lvl;
        if (a.bonusType === 'boss_time') bossBonusTime += a.bonusValue * lvl;
        if (a.bonusType === 'crit_power') critMultiplier += a.bonusValue * lvl;
      }
    });

    // Active Skin bonus
    if (activeSkin) {
      if (activeSkin.bonusType === 'tap_power') tapPower *= 1 + activeSkin.bonusValue;
      if (activeSkin.bonusType === 'idle_income') idleIncome *= 1 + activeSkin.bonusValue;
      if (activeSkin.bonusType === 'crit') critChance += activeSkin.bonusValue * 100;
      if (activeSkin.bonusType === 'energy_regen') energyRegenRate += Math.round(activeSkin.bonusValue * 4);
      if (activeSkin.id === 'skin_cyber') maxEnergyBonus += 1000;
    }

    // Perks Mastery Bonuses
    const perks = saveData.perks || {};
    const perkOverclockRank = perks['perk_overclock'] || 0;
    if (perkOverclockRank > 0) {
      idleIncome *= 1 + perkOverclockRank * 0.3;
    }

    const perkGodlyCritRank = perks['perk_godly_crit'] || 0;
    if (perkGodlyCritRank > 0) {
      critMultiplier += perkGodlyCritRank * 1.0;
    }

    const perkBossExecRank = perks['perk_boss_executioner'] || 0;
    if (perkBossExecRank > 0) {
      bossBonusTime += perkBossExecRank * 5;
    }

    const perkOfflineWarpRank = perks['perk_offline_warp'] || 0;
    if (perkOfflineWarpRank > 0) {
      offlineBonus += perkOfflineWarpRank * 0.2;
    }

    // Prestige Multiplier
    const perkAlchemyRank = perks['perk_cosmic_alchemy'] || 0;
    const shardPower = 0.5 + perkAlchemyRank * 0.15;
    const prestigeMult = 1 + saveData.cosmicShards * shardPower;
    const globalMult = (1 + allIncomeBonus) * prestigeMult;

    const goldenTapChance = (perks['perk_golden_tap'] || 0) * 3;

    // Apply Loss Debuff penalty to passive accumulation speed and energy regen if active
    if (saveData.lossDebuff && saveData.lossDebuff.expiresAt > Date.now()) {
      const penalty = Math.min(0.9, Math.max(0.1, saveData.lossDebuff.percent));
      idleIncome = Math.round(idleIncome * (1 - penalty));
      energyRegenRate = Math.max(1, Math.round(energyRegenRate * (1 - penalty)));
    }

    return {
      tapPower,
      idleIncome,
      critChance: Math.min(90, critChance),
      critMultiplier,
      feverBonusTime,
      bossBonusTime,
      offlineBonus,
      prestigeMult,
      globalMult,
      goldenTapChance,
      energyRegenRate,
      maxEnergyBonus,
      perkOfflineWarpRank,
    };
  }, [
    saveData.upgrades,
    saveData.artifacts,
    saveData.cosmicShards,
    saveData.perks,
    saveData.lossDebuff,
    profitPerHour,
    activeSkin,
  ]);

  // Active boosts
  const now = Date.now();
  const activeBoostsFiltered = useMemo(() => {
    return saveData.activeBoosts.filter((b) => b.expiresAt > now);
  }, [saveData.activeBoosts, now]);

  const activeBoostMultiplier = useMemo(() => {
    return activeBoostsFiltered.reduce((acc, b) => acc * b.multiplier, 1);
  }, [activeBoostsFiltered]);

  const finalTotalMultiplier = calculatedStats.globalMult * activeBoostMultiplier;
  const currentMaxEnergy = 1500 + calculatedStats.maxEnergyBonus;

  // Sound preference synchronization
  useEffect(() => {
    sound.setMuted(!saveData.soundEnabled);
  }, [saveData.soundEnabled]);

  // Toggle Haptics
  const toggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticsEnabled(next);
    setSaveData((prev) => ({ ...prev, vibrationEnabled: next }));
    if (next) hapticEffects.tap();
  };

  // Toggle Sound
  const toggleSound = () => {
    hapticEffects.tap();
    setSaveData((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  // Check achievements automatically based on level
  useEffect(() => {
    MEME_ACHIEVEMENTS.forEach((ach) => {
      if (saveData.level >= ach.requiredLevel && !saveData.unlockedAchievements.includes(ach.id)) {
        setSaveData((prev) => ({
          ...prev,
          gems: prev.gems + ach.rewardGems,
          unlockedAchievements: [...prev.unlockedAchievements, ach.id],
        }));
      }
    });
  }, [saveData.level, saveData.unlockedAchievements]);

  // Energy continuous regeneration tick (every 1 second)
  useEffect(() => {
    const regenInterval = setInterval(() => {
      setSaveData((prev) => {
        if (prev.energy >= currentMaxEnergy) return prev;
        const nextEnergy = Math.min(currentMaxEnergy, prev.energy + calculatedStats.energyRegenRate);
        return { ...prev, energy: nextEnergy };
      });
    }, 1000);
    return () => clearInterval(regenInterval);
  }, [calculatedStats.energyRegenRate, currentMaxEnergy]);

  // Offline earnings calculation on initial load
  useEffect(() => {
    const lastSaved = saveData.lastSavedTimestamp;
    const elapsed = Date.now() - lastSaved;
    if (elapsed > 45000 && calculatedStats.idleIncome > 0) {
      const maxHours = 12 + calculatedStats.perkOfflineWarpRank * 2;
      const cappedSeconds = Math.min(Math.floor(elapsed / 1000), maxHours * 3600);
      const earned = Math.round(
        calculatedStats.idleIncome *
          finalTotalMultiplier *
          cappedSeconds *
          (1 + calculatedStats.offlineBonus) *
          0.5
      );
      if (earned > 5) {
        setOfflineEarnings({ elapsedMs: elapsed, coins: earned });
        setActiveModal('offline');
      }
    }
  }, []);

  // Auto-Save locally every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveGameLocally(saveData, tgUser?.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [saveData, tgUser?.id]);

  // Background Auto-Save to Cloud every 3 minutes if Cloud ID is linked
  useEffect(() => {
    if (!saveData.cloudId) return;
    const cloudInterval = setInterval(async () => {
      await saveGameToCloud(saveData);
    }, 3 * 60 * 1000);
    return () => clearInterval(cloudInterval);
  }, [saveData]);

  // Advance level helper
  const advanceLevel = useCallback(
    (extraCoins = 0, extraGems = 0, extraPerkPoints = 0) => {
      sound.playLevelUp();
      hapticEffects.levelUp();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });

      setSaveData((prev) => {
        const nextLevel = Math.min(GAME_LEVELS.length, prev.level + 1);
        const earnedCoins = currentLevelDef.rewardCoins + extraCoins;
        const earnedGems = currentLevelDef.rewardGems + extraGems;
        const isPerkLevel = nextLevel % 3 === 0;
        const newPerkPoints = prev.perkPoints + (isPerkLevel ? 1 : 0) + extraPerkPoints;

        addNotification(
          '🎉 Новый Уровень!',
          `Достигнут уровень ${nextLevel}! Получено +${earnedGems} 💎`,
          'level',
          '🎉'
        );

        return {
          ...prev,
          level: nextLevel,
          coins: prev.coins + earnedCoins,
          totalCoinsEarned: prev.totalCoinsEarned + earnedCoins,
          gems: prev.gems + earnedGems,
          perkPoints: newPerkPoints,
          currentLevelClicks: 0,
        };
      });
    },
    [currentLevelDef, addNotification]
  );

  // Passive Idle Income & Auto-Tap Tick (runs every 1 second)
  useEffect(() => {
    if (calculatedStats.idleIncome <= 0) return;

    const interval = setInterval(() => {
      const income = Math.round(calculatedStats.idleIncome * finalTotalMultiplier);

      setSaveData((prev) => {
        // Calculate auto-taps generated per second based on idle upgrades
        const totalIdleLevels = DEFAULT_UPGRADES
          .filter((u) => u.type === 'idle')
          .reduce((sum, u) => sum + (prev.upgrades[u.id] || 0), 0);

        const autoTaps = Math.max(1, Math.min(30, Math.floor(1 + Math.sqrt(totalIdleLevels) * 1.5)));

        const newCoins = prev.coins + income;
        const newTotalEarned = prev.totalCoinsEarned + income;
        const newTotalTaps = prev.totalTaps + autoTaps;
        const newLevelClicks = prev.currentLevelClicks + autoTaps;

        // Check if level click requirement met
        if (newLevelClicks >= currentLevelDef.clicksRequired) {
          setTimeout(() => advanceLevel(), 100);
        }

        return {
          ...prev,
          coins: newCoins,
          totalCoinsEarned: newTotalEarned,
          totalTaps: newTotalTaps,
          currentLevelClicks: newLevelClicks,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [calculatedStats.idleIncome, finalTotalMultiplier, currentLevelDef, advanceLevel]);

  // Add direct coins handler (e.g. for Adsgram rewarded ads)
  const handleAddCoins = (amount: number) => {
    setSaveData((prev) => {
      const updated = {
        ...prev,
        coins: prev.coins + amount,
        totalCoinsEarned: prev.totalCoinsEarned + amount,
      };
      // Auto cloud save if logged in
      if (updated.cloudId) {
        saveGameToCloud(updated).catch((err) => console.warn('Adsgram cloud save failed:', err));
      }
      return updated;
    });
  };

  // Main Tap Handler - drains energy, advances level
  const handleTap = (amount: number, _isCrit: boolean) => {
    if (saveData.energy <= 0) return;

    // Fill fever gauge
    if (!isFeverActive) {
      setFeverGauge((prev) => {
        const perkLightning = saveData.perks?.['perk_lightning_fingers'] || 0;
        const fillStep = 5 * (1 + perkLightning * 0.25);
        const next = prev + fillStep;

        if (next >= 100) {
          setIsFeverActive(true);
          hapticEffects.feverStart();
          const feverDuration = (12 + calculatedStats.feverBonusTime) * 1000;
          if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
          feverTimerRef.current = setTimeout(() => {
            setIsFeverActive(false);
            setFeverGauge(0);
          }, feverDuration);
          return 100;
        }
        return next;
      });
    }

    setSaveData((prev) => {
      const newEnergy = Math.max(0, prev.energy - 1);
      const newCoins = prev.coins + amount;
      const newTotalEarned = prev.totalCoinsEarned + amount;
      const newTotalTaps = prev.totalTaps + 1;
      const newLevelClicks = prev.currentLevelClicks + 1;

      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'taps' && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + 1) };
        }
        if (q.type === 'fever' && isFeverActive && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + 1) };
        }
        return q;
      });

      if (!currentLevelDef.isBoss && newLevelClicks >= currentLevelDef.clicksRequired) {
        setTimeout(() => advanceLevel(), 100);
      }

      return {
        ...prev,
        energy: newEnergy,
        coins: newCoins,
        totalCoinsEarned: newTotalEarned,
        totalTaps: newTotalTaps,
        currentLevelClicks: newLevelClicks,
        quests: updatedQuests,
      };
    });
  };

  // Buy or level up Hamster Card
  const handleBuyCard = (card: HamsterCard, cost: number) => {
    if (saveData.coins < cost) return;
    hapticEffects.purchase();
    sound.playCoin();

    setSaveData((prev) => {
      const curLvl = prev.cards?.[card.id] || 0;
      return {
        ...prev,
        coins: prev.coins - cost,
        cards: {
          ...prev.cards,
          [card.id]: curLvl + 1,
        },
      };
    });
  };

  // Claim Daily Combo (5,000,000 Coins)
  const handleClaimDailyCombo = () => {
    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins + DAILY_COMBO_REWARD_COINS,
      totalCoinsEarned: prev.totalCoinsEarned + DAILY_COMBO_REWARD_COINS,
      dailyComboClaimedDate: todayStr,
    }));
    setActiveModal('none');
  };

  // Complete PvP Deal with History Tracking
  const handleCompleteDeal = (
    won: boolean,
    coinsWon: number,
    opponent: DealOpponent,
    userClicks: number,
    oppClicks: number,
    debuff?: LossDebuff | null
  ) => {
    setSaveData((prev) => {
      const currentDealStats = prev.dealStats || {
        dealsWon: 0,
        dealsLost: 0,
        totalCoinsWon: 0,
        lastDealTimestamp: 0,
        lastWeeklyDealTimestamp: Date.now(),
        penaltiesPaid: 0,
      };

      const historyItem = {
        id: `deal_${Date.now()}`,
        opponentName: opponent.nickname,
        opponentAvatar: opponent.avatarIcon,
        userClicks,
        opponentClicks: oppClicks,
        won,
        coinsChange: won ? coinsWon : -prev.coins,
        timestamp: Date.now(),
      };

      const updatedHistory = [historyItem, ...(prev.dealHistory || [])].slice(0, 50);

      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'deals' && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + 1) };
        }
        return q;
      });

      // Random trigger to unlock Immortal status if level >= 265 or on epic win
      let immortalUnlocked = prev.immortalUnlocked;
      if (!immortalUnlocked && prev.level >= 265 && Math.random() < 0.2) {
        immortalUnlocked = true;
        sound.playSecretUnlock();
        hapticEffects.feverStart();
      }

      if (won) {
        return {
          ...prev,
          coins: prev.coins + coinsWon,
          totalCoinsEarned: prev.totalCoinsEarned + coinsWon,
          quests: updatedQuests,
          dealHistory: updatedHistory,
          lossDebuff: undefined, // Cleared on win
          immortalUnlocked,
          dealStats: {
            ...currentDealStats,
            dealsWon: currentDealStats.dealsWon + 1,
            totalCoinsWon: currentDealStats.totalCoinsWon + coinsWon,
            lastDealTimestamp: Date.now(),
            lastWeeklyDealTimestamp: Date.now(),
          },
        };
      } else {
        return {
          ...prev,
          coins: 1000, // Reset balance to 0, provide 1000 seed restart cash
          quests: updatedQuests,
          dealHistory: updatedHistory,
          lossDebuff: debuff || undefined,
          immortalUnlocked,
          dealStats: {
            ...currentDealStats,
            dealsLost: currentDealStats.dealsLost + 1,
            lastDealTimestamp: Date.now(),
            lastWeeklyDealTimestamp: Date.now(),
          },
        };
      }
    });
  };

  // Pay 50% penalty for refusing deal
  const handlePayPenalty = (penaltyAmount: number, debuff?: LossDebuff) => {
    setSaveData((prev) => {
      const currentDealStats = prev.dealStats || {
        dealsWon: 0,
        dealsLost: 0,
        totalCoinsWon: 0,
        lastDealTimestamp: 0,
        lastWeeklyDealTimestamp: Date.now(),
        penaltiesPaid: 0,
      };

      const historyItem = {
        id: `deal_${Date.now()}`,
        opponentName: 'Отказ от Сделки (Штраф 50%)',
        opponentAvatar: '⚠️',
        userClicks: 0,
        opponentClicks: 0,
        won: false,
        coinsChange: -penaltyAmount,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        coins: Math.max(0, prev.coins - penaltyAmount),
        lossDebuff: debuff || undefined,
        dealHistory: [historyItem, ...(prev.dealHistory || [])].slice(0, 50),
        dealStats: {
          ...currentDealStats,
          penaltiesPaid: currentDealStats.penaltiesPaid + penaltyAmount,
          lastWeeklyDealTimestamp: Date.now(),
        },
      };
    });
  };

  // Equip hat
  const handleSelectHat = (hatId: string) => {
    setSaveData((prev) => ({
      ...prev,
      selectedHatId: hatId,
    }));
  };

  // Upgrade perk from tree
  const handleUpgradePerk = (perkId: string) => {
    setSaveData((prev) => {
      const currentRank = prev.perks?.[perkId] || 0;
      return {
        ...prev,
        perkPoints: Math.max(0, prev.perkPoints - 1),
        perks: {
          ...prev.perks,
          [perkId]: currentRank + 1,
        },
      };
    });
  };

  // Soulslike Respec: Reset all perks and refund points
  const handleResetPerks = (method: 'token' | 'gems' | 'donate') => {
    setSaveData((prev) => {
      let totalSpent = 0;
      Object.entries(prev.perks || {}).forEach(([perkId, rank]) => {
        const pDef = LEVEL_PERKS.find((p) => p.id === perkId);
        const costPerRank = pDef ? pDef.costPerRank : 1;
        totalSpent += rank * costPerRank;
      });

      let updatedTokens = prev.respecTokens || 0;
      let updatedGems = prev.gems || 0;

      if (method === 'token') {
        updatedTokens = Math.max(0, updatedTokens - 1);
      } else if (method === 'gems') {
        updatedGems = Math.max(0, updatedGems - 50);
      }

      return {
        ...prev,
        perkPoints: prev.perkPoints + totalSpent,
        perks: {},
        gems: updatedGems,
        respecTokens: updatedTokens,
      };
    });
  };

  // Buy regular upgrade
  const handleBuyUpgrade = (upgrade: UpgradeItem, buyCount: number) => {
    const curLvl = saveData.upgrades[upgrade.id] || 0;
    let cost = 0;
    for (let i = 0; i < buyCount; i++) {
      cost += Math.round(upgrade.baseCost * Math.pow(upgrade.costMultiplier, curLvl + i));
    }
    if (saveData.coins < cost) return;

    hapticEffects.purchase();
    setSaveData((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'upgrades' && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + buyCount) };
        }
        return q;
      });

      return {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [upgrade.id]: curLvl + buyCount,
        },
        quests: updatedQuests,
      };
    });
  };

  // Buy Gem Artifact
  const handleBuyArtifact = (artifact: Artifact) => {
    const curLvl = saveData.artifacts[artifact.id] || 0;
    const cost = Math.round(artifact.costGems * Math.pow(1.5, curLvl));
    if (saveData.gems < cost) return;

    hapticEffects.purchase();
    setSaveData((prev) => ({
      ...prev,
      gems: prev.gems - cost,
      artifacts: {
        ...prev.artifacts,
        [artifact.id]: curLvl + 1,
      },
    }));
  };

  // Prestige / Ascension
  const handlePrestige = () => {
    const shardsEarned = Math.max(0, Math.floor((saveData.level - 20) / 4));
    if (shardsEarned <= 0) return;

    hapticEffects.prestigeReset();
    confetti({ particleCount: 150, spread: 100 });

    setSaveData((prev) => ({
      ...prev,
      level: 1,
      coins: 0,
      currentLevelClicks: 0,
      upgrades: {},
      prestigeCount: prev.prestigeCount + 1,
      cosmicShards: prev.cosmicShards + shardsEarned,
    }));
  };

  // Boss Victory
  const handleBossVictory = (coinsReward: number, gemsReward: number) => {
    setActiveModal('none');
    setSaveData((prev) => {
      const updatedBosses = Array.from(new Set([...prev.completedBosses, currentLevelDef.level]));
      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'bosses' && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + 1) };
        }
        return q;
      });

      return {
        ...prev,
        completedBosses: updatedBosses,
        quests: updatedQuests,
      };
    });

    advanceLevel(coinsReward, gemsReward, 1);
  };

  // Claim Daily Streak
  const handleClaimDaily = (streakDay: DailyStreakDay) => {
    hapticEffects.purchase();
    setSaveData((prev) => {
      const newBoosts = [...prev.activeBoosts];
      if (streakDay.boosterMinutes) {
        newBoosts.push({
          multiplier: 2,
          expiresAt: Date.now() + streakDay.boosterMinutes * 60 * 1000,
          type: 'daily',
        });
      }

      return {
        ...prev,
        coins: prev.coins + streakDay.coins,
        totalCoinsEarned: prev.totalCoinsEarned + streakDay.coins,
        gems: prev.gems + streakDay.gems,
        dailyStreak: prev.dailyStreak + 1,
        lastDailyClaimTimestamp: Date.now(),
        activeBoosts: newBoosts,
      };
    });
  };

  // Spin Lucky Wheel
  const handleSpinWheel = (reward: any, costGems: number) => {
    hapticEffects.crit();
    setSaveData((prev) => {
      let newCoins = prev.coins;
      let newGems = prev.gems - costGems;
      const newBoosts = [...prev.activeBoosts];

      if (reward.type === 'coins' || reward.type === 'jackpot') {
        newCoins += reward.amount;
        if (reward.gems) newGems += reward.gems;
      } else if (reward.type === 'gems') {
        newGems += reward.amount;
      } else if (reward.type === 'boost') {
        newBoosts.push({
          multiplier: reward.multiplier || 3,
          expiresAt: Date.now() + reward.amount * 60 * 1000,
          type: 'wheel',
        });
      }

      return {
        ...prev,
        coins: newCoins,
        gems: newGems,
        lastWheelSpinTimestamp: Date.now(),
        activeBoosts: newBoosts,
      };
    });
  };

  // Claim Daily Quest
  const handleClaimQuest = (questId: string) => {
    hapticEffects.purchase();
    setSaveData((prev) => {
      const quest = prev.quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return prev;

      return {
        ...prev,
        coins: prev.coins + quest.rewardCoins,
        totalCoinsEarned: prev.totalCoinsEarned + quest.rewardCoins,
        gems: prev.gems + quest.rewardGems,
        quests: prev.quests.map((q) => (q.id === questId ? { ...q, completed: true } : q)),
      };
    });
  };

  // Golden Dumpling Collect
  const handleCollectDumpling = (type: 'coins' | 'frenzy') => {
    hapticEffects.goldenCatch();
    confetti({ particleCount: 50, spread: 50 });

    setSaveData((prev) => {
      const updatedQuests = prev.quests.map((q) => {
        if (q.type === 'golden_dumpling' && !q.completed) {
          return { ...q, current: Math.min(q.target, q.current + 1) };
        }
        return q;
      });

      if (type === 'frenzy') {
        return {
          ...prev,
          activeBoosts: [
            ...prev.activeBoosts,
            {
              multiplier: 7,
              expiresAt: Date.now() + 30 * 1000,
              type: 'frenzy',
            },
          ],
          quests: updatedQuests,
        };
      } else {
        const instantBonus = Math.max(500, Math.round(calculatedStats.tapPower * 250));
        return {
          ...prev,
          coins: prev.coins + instantBonus,
          totalCoinsEarned: prev.totalCoinsEarned + instantBonus,
          quests: updatedQuests,
        };
      }
    });
  };

  // Claim offline earnings
  const handleClaimOffline = (multiply: boolean) => {
    if (!offlineEarnings) return;
    hapticEffects.purchase();
    const finalBonus = multiply ? offlineEarnings.coins * 2 : offlineEarnings.coins;
    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins + finalBonus,
      totalCoinsEarned: prev.totalCoinsEarned + finalBonus,
      gems: multiply ? Math.max(0, prev.gems - 3) : prev.gems,
    }));
    setOfflineEarnings(null);
    setActiveModal('none');
  };

  // Full Energy boost use (max 6/day)
  const handleUseFullEnergyBoost = () => {
    if (saveData.fullEnergyBoostsLeft <= 0) return;
    hapticEffects.purchase();
    setSaveData((prev) => ({
      ...prev,
      energy: currentMaxEnergy,
      fullEnergyBoostsLeft: prev.fullEnergyBoostsLeft - 1,
    }));
  };

  // Turbo boost use (max 3/day)
  const handleUseTurboBoost = () => {
    if (saveData.turboBoostsLeft <= 0) return;
    hapticEffects.feverStart();
    setSaveData((prev) => ({
      ...prev,
      turboBoostsLeft: prev.turboBoostsLeft - 1,
      activeBoosts: [
        ...prev.activeBoosts,
        {
          multiplier: 5,
          expiresAt: Date.now() + 20 * 1000,
          type: 'frenzy',
        },
      ],
    }));
  };

  // Check if daily combo is unlocked
  const comboUnlockedCount = useMemo(() => {
    return DAILY_COMBO_CARD_IDS.filter((id) => (saveData.cards?.[id] || 0) > 0).length;
  }, [saveData.cards]);

  const isComboClaimable = comboUnlockedCount === 3 && saveData.dailyComboClaimedDate !== todayStr;

  // Has claimable daily or quest
  const hasClaimableRewards = useMemo(() => {
    const canClaimDaily = now - saveData.lastDailyClaimTimestamp >= 20 * 3600 * 1000;
    const canFreeWheel = now - saveData.lastWheelSpinTimestamp >= 4 * 3600 * 1000;
    const hasFinishedQuest = saveData.quests.some((q) => q.current >= q.target && !q.completed);
    return canClaimDaily || canFreeWheel || hasFinishedQuest || isComboClaimable;
  }, [saveData, now, isComboClaimable]);

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-hidden ${
        isFeverActive ? 'ring-4 ring-pink-500 ring-inset' : ''
      }`}
    >
      {/* Toast Notification Popups */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

      {/* Random Flying Golden Dumpling Event */}
      <FlyingEvent onCollect={handleCollectDumpling} />

      {/* TOP HEADER: Clean Hamster Kombat / Telegram Style */}
      <header className={`sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 shadow-md transition-all ${
        isTelegram ? 'px-2 py-1.5' : 'px-3 py-2'
      }`}>
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          
          {/* User Profile & League Pill */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveModal('skins');
            }}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded-2xl hover:border-amber-500/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg">
              {activeSkin.icon}
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xs text-white block leading-tight truncate max-w-[90px]">
                {saveData.playerName}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                {currentLeague.icon} {currentLeague.name} ›
              </span>
            </div>
          </button>

          {/* Profit Per Hour Pill (clicking jumps to cards/mine tab) */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setCurrentTab('mine');
            }}
            className="flex items-center gap-1.5 bg-zinc-900 border border-emerald-500/40 px-2.5 py-1 rounded-2xl hover:border-emerald-400 transition-colors text-left"
          >
            <span className="text-sm">📈</span>
            <div>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider block leading-none">
                Прибыль в час
              </span>
              <span className="font-extrabold text-emerald-400 font-mono text-xs">
                +{formatNumber(profitPerHour)}
              </span>
            </div>
          </button>

          {/* ALL-IN-ONE MENU BUTTON (Clean and tidy) */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveModal('drawer');
            }}
            className="relative p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-2xl text-zinc-300 font-bold transition-transform active:scale-95 shadow-sm"
            title="Все функции и настройки"
          >
            <span className="text-lg leading-none">☰</span>
            {hasClaimableRewards && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

        </div>

        {/* BIG CENTRAL BALANCE DISPLAY */}
        <div className="max-w-md mx-auto pt-2 pb-1 flex flex-col items-center justify-center text-center">
          <div
            onClick={() => {
              hapticEffects.tap();
              setCurrentTab('mine');
            }}
            className="cursor-pointer group flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all p-1 rounded-2xl"
            title="Нажми, чтобы потратить в Шахте на карточки"
          >
            <span className="text-3xl filter drop-shadow">🪙</span>
            <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight group-hover:text-yellow-200">
              {formatNumber(saveData.coins)}
            </span>
            <div className="flex items-center gap-1 bg-purple-950/70 border border-purple-500/50 px-2.5 py-0.5 rounded-full ml-1">
              <span className="text-xs">💎</span>
              <span className="text-xs font-bold text-purple-300 font-mono">{saveData.gems}</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center justify-center gap-2 flex-wrap">
            <span>
              Всего накликано: <strong className="text-zinc-200 font-mono">{formatNumber(saveData.totalCoinsEarned)}</strong> 🪙
            </span>
            {nextLeague && (
              <span className="text-zinc-500 hidden sm:inline">
                · До {nextLeague.icon}: {formatNumber(Math.max(0, nextLeague.minCoins - saveData.coins))}
              </span>
            )}
          </div>
        </div>

        {/* Active Boosters Strip */}
        {activeBoostsFiltered.length > 0 && (
          <div className="max-w-md mx-auto mt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-pink-300 bg-pink-950/40 border border-pink-500/30 rounded-lg py-0.5 animate-pulse">
            <span>⚡ БУСТ АКТИВЕН: x{activeBoostMultiplier}</span>
            <span>
              ({formatTimeSeconds(Math.max(0, Math.round((Math.max(...activeBoostsFiltered.map((b) => b.expiresAt)) - now) / 1000)))})
            </span>
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT: Switch by Selected Tab */}
      <main className={`flex-1 flex flex-col items-center justify-start max-w-md mx-auto w-full pb-24 transition-all ${
        isTelegram ? 'p-2.5 space-y-2' : 'p-3 space-y-3'
      }`}>
        
        {/* TAB 1: TAP (EXCHANGE / ГЛАВНАЯ) */}
        {currentTab === 'tap' && (
          <MainTapper
            onAddCoins={handleAddCoins}
            onShowNotification={addNotification}
            currentLevel={currentLevelDef}
            currentClicks={saveData.currentLevelClicks}
            tapPower={calculatedStats.tapPower}
            critChance={calculatedStats.critChance}
            critMultiplier={calculatedStats.critMultiplier}
            idleIncomePerSec={calculatedStats.idleIncome}
            profitPerHour={profitPerHour}
            totalMultiplier={finalTotalMultiplier}
            isFeverActive={isFeverActive}
            feverGauge={feverGauge}
            goldenTapChance={calculatedStats.goldenTapChance}
            energy={saveData.energy}
            maxEnergy={currentMaxEnergy}
            activeSkin={activeSkin}
            activeHat={activeHat}
            customConfig={saveData.customCapybara}
            perks={saveData.perks || {}}
            lossDebuff={saveData.lossDebuff}
            immortalUnlocked={saveData.immortalUnlocked}
            isNeuromuscularActive={isNeuromuscularActive}
            neuromuscularCooldown={neuromuscularCooldown}
            onTriggerNeuromuscular={triggerNeuromuscularTap}
            onOpenLeaderboard={() => setActiveModal('leaderboard')}
            onTap={handleTap}
            onStartBoss={() => setActiveModal('boss')}
            onOpenEnergyBoost={() => setActiveModal('energy_boost')}
            onOpenCharacterModal={() => setActiveModal('character')}
            onOpenDealModal={() => setActiveModal('deal')}
          />
        )}

        {/* TAB 2: MINE (ИНВЕСТ-КАРТОЧКИ / ШАХТА) */}
        {currentTab === 'mine' && (
          <div className="w-full space-y-3 animate-fadeIn">
            {/* Header info */}
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-3 shadow-md flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>⛏️</span> Шахта и Карточки
                </h3>
                <p className="text-[11px] text-zinc-400">Каждая карточка увеличивает прибыль в час</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block">Всего доход</span>
                <span className="font-extrabold text-emerald-400 font-mono text-xs">
                  +{formatNumber(profitPerHour)} / час
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'all', label: 'Все' },
                { id: 'memes', label: 'Мемы 🤪' },
                { id: 'pr', label: 'PR' },
                { id: 'legal', label: 'Legal' },
                { id: 'tech', label: 'Tech' },
                { id: 'specials', label: 'Спец' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    hapticEffects.tap();
                    setCardCategory(tab.id as any);
                  }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    cardCategory === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cards List Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {HAMSTER_CARDS.filter((c) => cardCategory === 'all' || c.category === cardCategory).map(
                (card) => {
                  const curLvl = saveData.cards?.[card.id] || 0;
                  const cost = getCardUpgradeCost(card, curLvl, saveData.level);
                  const canAfford = saveData.coins >= cost;
                  const isLocked = saveData.level < card.requiredLevel;

                  return (
                    <div
                      key={card.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                        isLocked
                          ? 'bg-zinc-950/70 border-zinc-850 opacity-60'
                          : 'bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/50 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{card.icon}</span>
                          <span className="text-[10px] font-bold bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300 border border-zinc-700">
                            Ур. {curLvl}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-white line-clamp-1">{card.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{card.description}</p>
                        <div className="text-[11px] font-bold text-emerald-400 font-mono mt-1">
                          +{formatNumber(card.profitPerHourBase * (curLvl + 1))} / ч
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-zinc-800">
                        {isLocked ? (
                          <div className="text-center text-[10px] font-bold text-zinc-500 py-1">
                            🔒 Ур. {card.requiredLevel}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuyCard(card, cost)}
                            disabled={!canAfford}
                            className={`w-full py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                              canAfford
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <span>🪙</span>
                            <span>{formatNumber(cost)}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COMBO & MEMES (МЕМНОЕ КОМБО ДНЯ & ДОСТИЖЕНИЯ) */}
        {currentTab === 'combo' && (
          <div className="w-full space-y-3 animate-fadeIn">
            {/* Daily Combo Card Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🧩</span> КОМБО КАРТЫ ДНЯ
                </span>
                <span className="text-[10px] bg-amber-400 text-black font-extrabold px-2 py-0.5 rounded-full">
                  5,000,000 🪙
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Купи 3 секретные карты дня и забери супер-приз в 5 миллионов коинов!
              </p>

              {/* 3 Combo preview tiles */}
              <div className="grid grid-cols-3 gap-2 my-3">
                {DAILY_COMBO_CARD_IDS.map((cardId, i) => {
                  const card = HAMSTER_CARDS.find((c) => c.id === cardId);
                  const isOwned = (saveData.cards?.[cardId] || 0) > 0;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-2xl border text-center ${
                        isOwned
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : 'bg-zinc-950/60 border-zinc-800'
                      }`}
                    >
                      <div className="text-2xl mb-1">{card?.icon || '❓'}</div>
                      <span className="text-[10px] font-bold text-white block truncate">
                        {card?.title || 'Карта'}
                      </span>
                      <span className={`text-[9px] font-bold ${isOwned ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isOwned ? '✅ Собрано' : '🔒 Нужна'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  hapticEffects.tap();
                  setActiveModal('daily_combo');
                }}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-transform active:scale-95"
              >
                Открыть Окно Комбо ({comboUnlockedCount}/3)
              </button>
            </div>

            {/* Meme Achievements quick view */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <span>🗿</span> Мемотека & Достижения
                </h3>
                <button
                  onClick={() => {
                    hapticEffects.tap();
                    setActiveModal('achievements');
                  }}
                  className="text-amber-400 hover:underline text-xs font-bold"
                >
                  Все ({saveData.unlockedAchievements.length}/{MEME_ACHIEVEMENTS.length}) ›
                </button>
              </div>

              <div className="space-y-2">
                {MEME_ACHIEVEMENTS.slice(0, 4).map((ach) => {
                  const isUnlocked = saveData.unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                        isUnlocked
                          ? 'bg-amber-950/20 border-amber-500/40 text-white'
                          : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{ach.icon}</span>
                        <div>
                          <span className="font-extrabold text-xs block">{ach.title}</span>
                          <span className="text-[10px] text-zinc-400 italic">«{ach.memeQuote}»</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-300 font-mono">
                        +{ach.rewardGems} 💎
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UPGRADES & PERKS (ПРОКАЧКА ТАЛАНТОВ И АВТОКЛИКЕРОВ) */}
        {currentTab === 'upgrades' && (
          <div className="w-full space-y-3 animate-fadeIn">
            {/* Perks Trigger Banner */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-purple-950/40 border border-indigo-500/40 rounded-3xl p-3.5 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <span>✦</span> Древо Мастерства & Перков
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Доступно очков: <strong className="text-amber-400">✦ {saveData.perkPoints}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  hapticEffects.tap();
                  setActiveModal('perks');
                }}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95"
              >
                Открыть Древо
              </button>
            </div>

            {/* Standard Upgrades Panel */}
            <UpgradesPanel
              coins={saveData.coins}
              gems={saveData.gems}
              currentLevel={saveData.level}
              upgrades={DEFAULT_UPGRADES}
              artifacts={DEFAULT_ARTIFACTS}
              purchasedUpgrades={saveData.upgrades}
              purchasedArtifacts={saveData.artifacts}
              prestigeCount={saveData.prestigeCount}
              cosmicShards={saveData.cosmicShards}
              onBuyUpgrade={handleBuyUpgrade}
              onBuyArtifact={handleBuyArtifact}
              onPrestige={handlePrestige}
            />
          </div>
        )}

        {/* TAB 5: AIRDROP & REWARDS (ЕЖЕДНЕВНЫЕ НАГРАДЫ & ДРОП) */}
        {currentTab === 'airdrop' && (
          <div className="w-full space-y-3 animate-fadeIn">
            {/* Daily Streak & Wheel */}
            <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-pink-950/40 border border-purple-500/40 rounded-3xl p-4 shadow-lg text-center">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider">
                🎁 ЕЖЕДНЕВНЫЙ AIRDROP & НАГРАДЫ
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                День {saveData.dailyStreak}: Забирай призы каждый день
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Колесо Фортуны каждые 4 часа + 7-дневный календарь наград
              </p>
              <button
                onClick={() => {
                  hapticEffects.tap();
                  setActiveModal('rewards');
                }}
                className="mt-3 py-2 px-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs shadow-lg transition-transform active:scale-95"
              >
                Открыть Колесо и Стрик 🎁
              </button>
            </div>

            {/* Quests Quick View */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-md">
              <h3 className="font-black text-sm text-white mb-2 flex items-center gap-1.5">
                <span>📋</span> Ежедневные Квесты
              </h3>
              <div className="space-y-2">
                {saveData.quests.map((q) => {
                  const isDone = q.current >= q.target;
                  return (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-xs text-white block">{q.title}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {q.current} / {q.target}
                        </span>
                      </div>
                      {q.completed ? (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded-xl">
                          Получено
                        </span>
                      ) : isDone ? (
                        <button
                          onClick={() => handleClaimQuest(q.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow animate-pulse"
                        >
                          Забрать 🪙
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500">В процессе</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* TELEGRAM MINI APP BOTTOM NAVIGATION DOCK */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/90 py-1.5 px-3">
        <div className="max-w-md mx-auto grid grid-cols-6 gap-1 text-center">
          
          {/* Tab 1: Tap */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setCurrentTab('tap');
            }}
            className={`py-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              currentTab === 'tap' ? 'text-amber-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-xl">🪙</span>
            <span className="text-[10px] mt-0.5">Тап</span>
          </button>

          {/* Tab 2: Mine (Cards) */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setCurrentTab('mine');
            }}
            className={`py-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              currentTab === 'mine' ? 'text-emerald-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-xl">⛏️</span>
            <span className="text-[10px] mt-0.5">Шахта</span>
          </button>

          {/* Tab 3: PvP Deal */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveModal('deal');
            }}
            className={`relative py-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeModal === 'deal' ? 'text-rose-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-xl">⚔️</span>
            <span className="text-[10px] mt-0.5">Сделка</span>
            <span className="absolute top-0 right-3 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </button>

          {/* Tab 4: Hero Character Room */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setActiveModal('character');
            }}
            className={`relative py-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              activeModal === 'character' ? 'text-amber-300 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-xl">🎭</span>
            <span className="text-[10px] mt-0.5">Герой</span>
          </button>

          {/* Tab 5: Upgrades & Perks */}
          <button
            onClick={() => {
              hapticEffects.tap();
              setCurrentTab('upgrades');
            }}
            className={`relative py-1 rounded-xl flex flex-col items-center justify-center transition-all ${
              currentTab === 'upgrades' ? 'text-indigo-400 font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-xl">✦</span>
            <span className="text-[10px] mt-0.5">Прокачка</span>
            {saveData.perkPoints > 0 && (
              <span className="absolute top-0 right-3 bg-indigo-500 text-white font-extrabold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {saveData.perkPoints}
              </span>
            )}
          </button>

          {/* Manual Save Export Button */}
          <button
            onClick={() => {
              const exportStr = exportSaveString(saveData);
              prompt("Ваш код прогресса (сохраните его в заметки!):", exportStr);
            }}
            className="py-1 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:text-red-400"
          >
            <span className="text-xl">💾</span>
            <span className="text-[10px] mt-0.5">Save</span>
          </button>

        </div>
      </nav>

      {/* MODALS */}

      {/* Features Drawer Hub Modal */}
      {activeModal === 'drawer' && (
        <FeaturesDrawerModal
          onClose={() => setActiveModal('none')}
          onOpenModal={(modal) => setActiveModal(modal)}
          hasClaimableRewards={hasClaimableRewards}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={toggleSound}
          hapticsEnabled={hapticsOn}
          onToggleHaptics={toggleHaptics}
          playerLevel={saveData.level}
          totalTaps={saveData.totalTaps}
          totalCoinsEarned={saveData.totalCoinsEarned}
          isTelegram={isTelegram}
        />
      )}

      {/* Daily Combo Modal */}
      {activeModal === 'daily_combo' && (
        <DailyComboModal
          onClose={() => setActiveModal('none')}
          ownedCards={saveData.cards || {}}
          dailyComboClaimedDate={saveData.dailyComboClaimedDate}
          onClaimDailyCombo={handleClaimDailyCombo}
          onOpenCards={() => {
            setActiveModal('none');
            setCurrentTab('mine');
          }}
        />
      )}

      {/* Firebase Global Leaderboard Modal */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          playerStats={{
            nickname: saveData.playerName,
            level: saveData.level,
            prestige: saveData.prestigeCount,
            totalCoinsEarned: saveData.totalCoinsEarned,
            bossesDefeated: saveData.completedBosses.length,
          }}
          onUpdateNickname={(name) => setSaveData((prev) => ({ ...prev, playerName: name }))}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Mastery Perks & Talents Modal (Soulslike Tree) */}
      {activeModal === 'perks' && (
        <PerksModal
          playerLevel={saveData.level}
          perkPoints={saveData.perkPoints}
          perks={saveData.perks || {}}
          purchasedCards={saveData.cards || {}}
          onUpgradePerk={handleUpgradePerk}
          onOpenResetModal={() => setActiveModal('reset_perks')}
          soundEnabled={saveData.soundEnabled}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Soulslike Respec: Reset Perks for Real Money / Gems / Tokens */}
      {activeModal === 'reset_perks' && (
        <ResetPerksModal
          onClose={() => setActiveModal('none')}
          playerGems={saveData.gems}
          respecTokens={saveData.respecTokens || 1}
          totalPerkPointsToRefund={Object.entries(saveData.perks || {}).reduce((sum, [perkId, rank]) => {
            const pDef = LEVEL_PERKS.find((p) => p.id === perkId);
            return sum + rank * (pDef ? pDef.costPerRank : 1);
          }, 0)}
          onConfirmReset={handleResetPerks}
        />
      )}

      {/* Secret Events Modal */}
      {activeModal === 'secret_events' && (
        <SecretEventsModal
          onClose={() => setActiveModal('none')}
          unlockedSecretEvents={saveData.unlockedSecretEvents || []}
          unlockedSkinIds={saveData.unlockedSkinIds || []}
          onClaimSecretSkin={(skinId: string) => {
            sound.playSecretUnlock();
            hapticEffects.feverStart();
            setSaveData((prev) => ({
              ...prev,
              unlockedSkinIds: prev.unlockedSkinIds.includes(skinId)
                ? prev.unlockedSkinIds
                : [...prev.unlockedSkinIds, skinId],
              selectedSkinId: skinId,
            }));
          }}
        />
      )}

      {/* Character Room & Customization Modal */}
      {(activeModal === 'character' || activeModal === 'skins') && (
        <CharacterModal
          onClose={() => setActiveModal('none')}
          playerLevel={saveData.level}
          playerCoins={saveData.coins}
          playerGems={saveData.gems}
          selectedSkinId={saveData.selectedSkinId}
          unlockedSkinIds={saveData.unlockedSkinIds}
          selectedHatId={saveData.selectedHatId || 'hat_none'}
          unlockedHatIds={saveData.unlockedHatIds || ['hat_none']}
          perks={saveData.perks || {}}
          dealStats={saveData.dealStats || { dealsWon: 0, dealsLost: 0 }}
          unlockedSecretEvents={saveData.unlockedSecretEvents || []}
          onSelectSkin={(id: string) => setSaveData((prev) => ({ ...prev, selectedSkinId: id }))}
          onBuySkin={(skin: CharacterSkin) => {
            const costCoins = skin.costCoins || 0;
            const costGems = skin.costGems || 0;
            setSaveData((prev) => ({
              ...prev,
              coins: prev.coins - costCoins,
              gems: prev.gems - costGems,
              unlockedSkinIds: [...prev.unlockedSkinIds, skin.id],
              selectedSkinId: skin.id,
            }));
          }}
          onSelectHat={handleSelectHat}
          onOpenPerksTree={() => {
            setActiveModal('perks');
          }}
          onOpenResetPerksModal={() => {
            setActiveModal('reset_perks');
          }}
          onOpenSecretEventsModal={() => {
            setActiveModal('secret_events');
          }}
        />
      )}

      {/* PvP Deal Arena Modal */}
      {activeModal === 'deal' && (
        <DealModal
          onClose={() => setActiveModal('none')}
          playerLevel={saveData.level}
          playerCoins={saveData.coins}
          playerName={saveData.playerName}
          selectedSkinId={saveData.selectedSkinId}
          selectedHatId={saveData.selectedHatId || 'hat_none'}
          perks={saveData.perks || {}}
          dealStats={saveData.dealStats || {
            dealsWon: 0,
            dealsLost: 0,
            totalCoinsWon: 0,
            lastDealTimestamp: 0,
            lastWeeklyDealTimestamp: Date.now(),
            penaltiesPaid: 0,
          }}
          dealHistory={saveData.dealHistory || []}
          immortalUnlocked={saveData.immortalUnlocked}
          onCompleteDeal={handleCompleteDeal}
          onPayPenalty={handlePayPenalty}
        />
      )}

      {/* Meme Achievements Modal */}
      {activeModal === 'achievements' && (
        <AchievementsModal
          onClose={() => setActiveModal('none')}
          playerLevel={saveData.level}
          unlockedAchievements={saveData.unlockedAchievements}
          onClaimAchievement={(achievementId: string, rewardGems: number) => {
            setSaveData((prev) => ({
              ...prev,
              gems: prev.gems + rewardGems,
              unlockedAchievements: [...prev.unlockedAchievements, achievementId],
            }));
          }}
        />
      )}

      {/* Energy & Boosts Modal */}
      {activeModal === 'energy_boost' && (
        <EnergyBoostModal
          onClose={() => setActiveModal('none')}
          currentEnergy={saveData.energy}
          maxEnergy={currentMaxEnergy}
          fullEnergyBoostsLeft={saveData.fullEnergyBoostsLeft}
          turboBoostsLeft={saveData.turboBoostsLeft}
          onUseFullEnergy={handleUseFullEnergyBoost}
          onUseTurbo={handleUseTurboBoost}
        />
      )}

      {/* Boss Battle Modal */}
      {activeModal === 'boss' && (
        <BossBattleModal
          bossLevel={currentLevelDef}
          tapPower={calculatedStats.tapPower}
          critChance={calculatedStats.critChance}
          critMultiplier={calculatedStats.critMultiplier}
          totalMultiplier={finalTotalMultiplier}
          isFeverActive={isFeverActive}
          bonusBossTime={calculatedStats.bossBonusTime}
          onVictory={handleBossVictory}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Daily Rewards Modal */}
      {activeModal === 'rewards' && (
        <DailyRewardsModal
          dailyStreak={saveData.dailyStreak}
          lastDailyClaimTimestamp={saveData.lastDailyClaimTimestamp}
          lastWheelSpinTimestamp={saveData.lastWheelSpinTimestamp}
          gems={saveData.gems}
          quests={saveData.quests}
          onClaimDaily={handleClaimDaily}
          onSpinWheel={handleSpinWheel}
          onClaimQuest={handleClaimQuest}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Levels 165 Overview Map */}
      {activeModal === 'levels' && (
        <LevelsOverviewModal
          currentLevelNumber={saveData.level}
          completedBosses={saveData.completedBosses}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Cloud Save & Backup Modal */}
      {activeModal === 'cloud' && (
        <CloudSaveModal
          currentSaveData={saveData}
          onRestoreSave={(loadedData) => setSaveData(loadedData)}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Offline Idle Earnings Modal */}
      {activeModal === 'offline' && offlineEarnings && (
        <OfflineEarningsModal
          elapsedMs={offlineEarnings.elapsedMs}
          coinsEarned={offlineEarnings.coins}
          gems={saveData.gems}
          onClaim={handleClaimOffline}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
