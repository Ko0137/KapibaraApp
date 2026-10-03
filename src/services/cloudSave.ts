import { GameSaveData } from '../types/game';
import { INITIAL_DAILY_QUESTS } from '../data/upgrades';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, ensureAuthenticated, getPersistentUserId } from './firebase';

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
    selectedSkinIdBase: 'skin_default',
    selectedSkinIdOverlay: 'skin_default',
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
    wheelSpinsToday: 0,
    lastWheelSpinDate: today,
    claimedWheelSectorIdsToday: [],
  };
}

export function saveGameLocally(data: GameSaveData, tgUserId?: string | number): void {
  try {
    const payload = {
      ...data,
      lastSavedTimestamp: Date.now(),
    };
    const json = JSON.stringify(payload);
    
    // Always save to primary key
    localStorage.setItem(LOCAL_STORAGE_KEY, json);

    // Also save to Telegram user key if specified
    if (tgUserId) {
      localStorage.setItem(`megatap_tg_${tgUserId}`, json);
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function parseAndMergeSave(raw: string | null): GameSaveData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const defaults = getDefaultSaveData();
    return {
      ...defaults,
      ...parsed,
      perkPoints: typeof parsed.perkPoints === 'number' ? parsed.perkPoints : defaults.perkPoints,
      perks: (parsed.perks && typeof parsed.perks === 'object') ? parsed.perks : {},
      upgrades: (parsed.upgrades && typeof parsed.upgrades === 'object') ? parsed.upgrades : {},
      artifacts: (parsed.artifacts && typeof parsed.artifacts === 'object') ? parsed.artifacts : {},
      cards: (parsed.cards && typeof parsed.cards === 'object') ? parsed.cards : {},
      selectedSkinIdBase: parsed.selectedSkinIdBase || parsed.selectedSkinId || 'skin_default',
      selectedSkinIdOverlay: parsed.selectedSkinIdOverlay || parsed.selectedSkinIdBase || parsed.selectedSkinId || 'skin_default',
      unlockedSkinIds: Array.isArray(parsed.unlockedSkinIds) && parsed.unlockedSkinIds.length > 0 ? parsed.unlockedSkinIds : ['skin_default'],
      selectedHatId: parsed.selectedHatId || 'hat_none',
      unlockedHatIds: Array.isArray(parsed.unlockedHatIds) && parsed.unlockedHatIds.length > 0 ? parsed.unlockedHatIds : ['hat_none'],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
      customCapybara: parsed.customCapybara || defaults.customCapybara,
      energy: typeof parsed.energy === 'number' ? parsed.energy : defaults.energy,
      maxEnergy: typeof parsed.maxEnergy === 'number' ? parsed.maxEnergy : defaults.maxEnergy,
      fullEnergyBoostsLeft: typeof parsed.fullEnergyBoostsLeft === 'number' ? parsed.fullEnergyBoostsLeft : 6,
      turboBoostsLeft: typeof parsed.turboBoostsLeft === 'number' ? parsed.turboBoostsLeft : 3,
      completedBosses: Array.isArray(parsed.completedBosses) ? parsed.completedBosses : [],
      quests: Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : INITIAL_DAILY_QUESTS,
      activeBoosts: Array.isArray(parsed.activeBoosts) ? parsed.activeBoosts.filter((b: any) => b.expiresAt > Date.now()) : [],
      dealStats: parsed.dealStats || defaults.dealStats,
      dealHistory: Array.isArray(parsed.dealHistory) ? parsed.dealHistory : [],
      unlockedSecretEvents: Array.isArray(parsed.unlockedSecretEvents) ? parsed.unlockedSecretEvents : [],
      respecTokens: typeof parsed.respecTokens === 'number' ? parsed.respecTokens : 1,
      wheelSpinsToday: typeof parsed.wheelSpinsToday === 'number' ? parsed.wheelSpinsToday : 0,
      lastWheelSpinDate: typeof parsed.lastWheelSpinDate === 'string' ? parsed.lastWheelSpinDate : defaults.lastWheelSpinDate,
      claimedWheelSectorIdsToday: Array.isArray(parsed.claimedWheelSectorIdsToday) ? parsed.claimedWheelSectorIdsToday : [],
      lastSavedTimestamp: parsed.lastSavedTimestamp || Date.now(),
    };
  } catch (err) {
    console.error('Failed to parse save string:', err);
    return null;
  }
}

export function loadGameLocally(tgUserId?: string | number): GameSaveData {
  try {
    let rawTg: string | null = null;
    if (tgUserId) {
      rawTg = localStorage.getItem(`megatap_tg_${tgUserId}`);
    }
    const rawDefault = localStorage.getItem(LOCAL_STORAGE_KEY);

    const saveTg = parseAndMergeSave(rawTg);
    const saveDef = parseAndMergeSave(rawDefault);

    if (saveTg && saveDef) {
      // Return whichever has newer timestamp or higher level/taps
      const tgScore = (saveTg.lastSavedTimestamp || 0) + (saveTg.level || 1) * 10000;
      const defScore = (saveDef.lastSavedTimestamp || 0) + (saveDef.level || 1) * 10000;
      return tgScore >= defScore ? saveTg : saveDef;
    }
    if (saveTg) return saveTg;
    if (saveDef) return saveDef;
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

    const mergedData = parseAndMergeSave(typeof parsedSave === 'string' ? parsedSave : JSON.stringify(parsedSave)) || getDefaultSaveData();
    mergedData.cloudId = record.cloudId;

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
    return parseAndMergeSave(jsonStr);
  } catch (err) {
    console.error('Import error:', err);
  }
  return null;
}
