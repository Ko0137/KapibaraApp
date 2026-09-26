import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, ensureAuthenticated } from './firebase';
import { LeaderboardItem } from '../types/game';
import { antiCheat } from '../utils/antiCheat';

const LEADERBOARD_COLLECTION = 'leaderboard';

export async function submitLeaderboardScore(stats: {
  nickname: string;
  level: number;
  prestige: number;
  totalCoinsEarned: number;
  bossesDefeated: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Anti-Cheat & Plausibility Verification
    const validation = antiCheat.validateScorePlausibility(
      stats.totalCoinsEarned,
      stats.level,
      stats.prestige
    );

    if (!validation.isPlausible) {
      console.warn('Anti-cheat blocked score submission:', validation.reason);
      return { success: false, error: validation.reason || 'Заблокировано защитой от накрутки' };
    }

    const fairPlay = antiCheat.isFairPlay();

    // 2. Authenticate user to get UID
    const user = await ensureAuthenticated();
    if (!user) return { success: false, error: 'Не удалось аутентифицировать пользователя' };
    const cleanNick = stats.nickname.trim().slice(0, 24) || 'Игрок_' + user.uid.slice(0, 4);

    const record: LeaderboardItem = {
      userId: user.uid,
      nickname: cleanNick,
      level: Math.max(1, Math.min(500, Math.floor(stats.level))),
      prestige: Math.max(0, Math.floor(stats.prestige)),
      totalCoinsEarned: Math.max(0, Math.floor(stats.totalCoinsEarned)),
      bossesDefeated: Math.max(0, Math.floor(stats.bossesDefeated)),
      verifiedFair: fairPlay,
      updatedAt: new Date().toISOString(),
    };

    // 3. Write to Firestore
    const userDocRef = doc(db, LEADERBOARD_COLLECTION, user.uid);
    await setDoc(userDocRef, record, { merge: true });

    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to submit leaderboard score to Firebase:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ошибка подключения к базе данных',
    };
  }
}

export async function fetchLeaderboard(
  sortBy: 'coins' | 'prestige' = 'coins'
): Promise<LeaderboardItem[]> {
  try {
    await ensureAuthenticated();
    const colRef = collection(db, LEADERBOARD_COLLECTION);
    
    // Sort by requested category
    const q = sortBy === 'coins'
      ? query(colRef, orderBy('totalCoinsEarned', 'desc'), limit(50))
      : query(colRef, orderBy('prestige', 'desc'), orderBy('level', 'desc'), limit(50));

    const snapshot = await getDocs(q);
    const results: LeaderboardItem[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as LeaderboardItem;
      results.push(data);
    });

    return results;
  } catch (err) {
    console.warn('Error fetching leaderboard from Firebase, falling back to mock highscores:', err);
    return getOfflineFallbackLeaderboard();
  }
}

function getOfflineFallbackLeaderboard(): LeaderboardItem[] {
  return [];
}
