import { GameSaveData } from '../types/game';
import { INITIAL_DAILY_QUESTS } from '../data/upgrades';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, ensureAuthenticated, auth } from './firebase';

const LOCAL_STORAGE_KEY = 'megatap_v1_savegame';

export function getDefaultSaveData(): GameSaveData {
  const today = new Date().toISOString().split('T')[0];
  return {
    playerName: 'Тапатель-' + Math.floor(1000 + Math.random() * 9000),
    cloudId: undefined,
    version: 1,
    level: 1,
    coins: 0,
    totalCoinsEarned: 0,
    gems: 10,
    totalTaps: 0,
    prestigeCount: 0,
    cosmicShards: 0,
    currentLevelClicks: 0,
    perkPoints: 0,
    perks: {},
    upgrades: {},
    artifacts: {},
    cards: {},
    selectedSkinId: 'skin_default',
    unlockedSkinIds: ['skin_default'],
    selectedHatId: 'hat_none',
    unlockedHatIds: ['hat_none'],
    unlockedAchievements: [],
    energy: 1000,
    maxEnergy: 1000,
    lastEnergyTimestamp: Date.now(),
    fullEnergyBoostsLeft: 6,
    turboBoostsLeft: 3,
    lastEnergyBoostDate: today,
    completedBosses: [],
    lastSavedTimestamp: Date.now(),
    lastLoginDate: today,
    dailyStreak: 1,
    lastDailyClaimTimestamp: 0,
    lastWheelSpinTimestamp: 0,
    quests: JSON.parse(JSON.stringify(INITIAL_DAILY_QUESTS)),
    activeBoosts: [],
    soundEnabled: true,
    vibrationEnabled: true,
    screenShakeEnabled: true,
    dealStats: {
      dealsWon: 0,
      dealsLost: 0,
      totalCoinsWon: 0,
      lastDealTimestamp: 0,
      lastWeeklyDealTimestamp: Date.now(),
      penaltiesPaid: 0,
    },
    dealHistory: [],
    unlockedSecretEvents: [],
    respecTokens: 1,
  };
}

export function getStorageKey(tgUserId?: string | number): string {
  if (tgUserId) {
    return `megatap_tg_${tgUserId}`;
  }
  return LOCAL_STORAGE_KEY;
}

export function saveGameLocally(data: GameSaveData, tgUserId?: string | number): void {
  try {
    const payload = {
      ...data,
      lastSavedTimestamp: Date.now()
    };
    const key = getStorageKey(tgUserId);
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function loadGameLocally(tgUserId?: string | number): GameSaveData {
  try {
    const key = getStorageKey(tgUserId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = getDefaultSaveData();
      return {
        ...defaults,
        ...parsed,
        perkPoints: typeof parsed.perkPoints === 'number' ? parsed.perkPoints : 0,
        perks: parsed.perks || {},
        upgrades: parsed.upgrades || {},
        artifacts: parsed.artifacts || {},
        cards: parsed.cards || {},
        selectedSkinId: parsed.selectedSkinId || 'skin_default',
        unlockedSkinIds: Array.isArray(parsed.unlockedSkinIds) ? parsed.unlockedSkinIds : ['skin_default'],
        selectedHatId: parsed.selectedHatId || 'hat_none',
        unlockedHatIds: Array.isArray(parsed.unlockedHatIds) ? parsed.unlockedHatIds : ['hat_none'],
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
        energy: typeof parsed.energy === 'number' ? parsed.energy : defaults.energy,
        maxEnergy: typeof parsed.maxEnergy === 'number' ? parsed.maxEnergy : defaults.maxEnergy,
        fullEnergyBoostsLeft: typeof parsed.fullEnergyBoostsLeft === 'number' ? parsed.fullEnergyBoostsLeft : 6,
        turboBoostsLeft: typeof parsed.turboBoostsLeft === 'number' ? parsed.turboBoostsLeft : 3,
        completedBosses: parsed.completedBosses || [],
        quests: parsed.quests && parsed.quests.length ? parsed.quests : INITIAL_DAILY_QUESTS,
        activeBoosts: (parsed.activeBoosts || []).filter((b: any) => b.expiresAt > Date.now()),
        dealStats: parsed.dealStats || defaults.dealStats,
        dealHistory: Array.isArray(parsed.dealHistory) ? parsed.dealHistory : [],
        unlockedSecretEvents: Array.isArray(parsed.unlockedSecretEvents) ? parsed.unlockedSecretEvents : [],
        respecTokens: typeof parsed.respecTokens === 'number' ? parsed.respecTokens : 1,
      };
    }
  } catch (err) {
    console.error('Failed to load local save:', err);
  }
  return getDefaultSaveData();
}

function generateCloudId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TAP-${code}`;
}

export async function saveGameToCloud(data: GameSaveData, customCloudId?: string): Promise<{ success: boolean; cloudId: string; message: string }> {
  try {
    await ensureAuthenticated();
    
    const targetCloudId = customCloudId || data.cloudId || generateCloudId();
    const cleanId = targetCloudId.trim().toUpperCase();

    const docRef = doc(db, 'cloudSaves', cleanId);
    
    const record = {
      cloudId: cleanId,
      playerName: data.playerName || 'Игрок',
      level: Number(data.level) || 1,
      totalTaps: Number(data.totalTaps) || 0,
      coins: Number(data.coins) || 0,
      gems: Number(data.gems) || 0,
      prestigeCount: Number(data.prestigeCount) || 0,
      saveData: JSON.stringify({
        ...data,
        cloudId: cleanId,
        lastSavedTimestamp: Date.now()
      }),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, record);

    // Sync to competitive leaderboard collection as well
    try {
      const user = auth.currentUser;
      if (user) {
        const leaderRef = doc(db, 'leaderboard', user.uid);
        await setDoc(leaderRef, {
          userId: user.uid,
          cloudId: cleanId,
          nickname: data.playerName || 'Игрок',
          level: Number(data.level) || 1,
          prestige: Number(data.prestigeCount) || 0,
          totalCoinsEarned: Number(data.totalCoinsEarned) || Number(data.coins) || 0,
          bossesDefeated: Array.isArray(data.completedBosses) ? data.completedBosses.length : 0,
          verifiedFair: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Leaderboard auto-update failed:', e);
    }

    return {
      success: true,
      cloudId: cleanId,
      message: 'Прогресс успешно сохранён в облаке!'
    };
  } catch (err: any) {
    console.error('Firestore save failed:', err);
    return {
      success: false,
      cloudId: data.cloudId || '',
      message: err.message || 'Сбой подключения к облаку Firestore'
    };
  }
}

export async function loadGameFromCloud(cloudId: string): Promise<{ success: boolean; saveData?: GameSaveData; error?: string }> {
  try {
    await ensureAuthenticated();
    const cleanId = cloudId.trim().toUpperCase();
    const docRef = doc(db, 'cloudSaves', cleanId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: `Облачное сохранение с кодом "${cleanId}" не найдено!`
      };
    }

    const record = docSnap.data();
    let parsedSave: any;
    if (typeof record.saveData === 'string') {
      parsedSave = JSON.parse(record.saveData);
    } else {
      parsedSave = record.saveData;
    }

    const mergedData: GameSaveData = {
      ...getDefaultSaveData(),
      ...parsedSave,
      cloudId: record.cloudId
    };

    // Save locally as well
    saveGameLocally(mergedData);

    return {
      success: true,
      saveData: mergedData
    };
  } catch (err: any) {
    console.error('Firestore load failed:', err);
    return {
      success: false,
      error: err.message || 'Не удалось связаться с облаком Firestore'
    };
  }
}

export async function fetchLeaderboard(): Promise<{ success: boolean; leaderboard: any[] }> {
  try {
    await ensureAuthenticated();
    const q = query(collection(db, 'leaderboard'), orderBy('level', 'desc'), orderBy('prestige', 'desc'), limit(30));
    const querySnapshot = await getDocs(q);
    const leaderboard: any[] = [];
    
    let rank = 1;
    querySnapshot.forEach((doc) => {
      const d = doc.data();
      leaderboard.push({
        rank: rank++,
        cloudId: d.cloudId || 'TAP-USER',
        playerName: d.nickname || 'Игрок',
        level: d.level || 1,
        totalTaps: d.totalTaps || 0,
        coins: d.totalCoinsEarned || d.coins || 0,
        gems: d.gems || 0,
        prestigeCount: d.prestige || 0,
        updatedAt: d.updatedAt || new Date().toISOString()
      });
    });

    return { success: true, leaderboard };
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
  }
  return { success: false, leaderboard: [] };
}

export function exportSaveString(data: GameSaveData): string {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch {
    return JSON.stringify(data);
  }
}

export function importSaveString(encoded: string): GameSaveData | null {
  try {
    let jsonStr = encoded.trim();
    if (!jsonStr.startsWith('{')) {
      jsonStr = decodeURIComponent(escape(atob(jsonStr)));
    }
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed.level === 'number' && typeof parsed.coins === 'number') {
      return {
        ...getDefaultSaveData(),
        ...parsed
      };
    }
  } catch (err) {
    console.error('Import error:', err);
  }
  return null;
}
