import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, ensureAuthenticated, getPersistentUserId } from './firebase';
import { GameSaveData, DealOpponent, CustomCapybaraConfig } from '../types/game';
import { TelegramUser } from '../utils/telegram';

export interface DuelRoomData {
  roomId: string;
  hostId: string;
  hostName: string;
  hostLevel: number;
  hostAvatar: string;
  hostSkinId: string;
  hostHatId: string;
  hostCustom?: CustomCapybaraConfig;
  hostScore: number;
  hostTaps: number;
  guestId?: string;
  guestName?: string;
  guestLevel?: number;
  guestAvatar?: string;
  guestSkinId?: string;
  guestHatId?: string;
  guestCustom?: CustomCapybaraConfig;
  guestScore: number;
  guestTaps: number;
  betCoins: number;
  status: 'waiting' | 'starting' | 'active' | 'finished' | 'cancelled';
  winnerId?: string;
  durationSeconds: number;
  startedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DuelChallengeData {
  challengeId: string;
  fromUserId: string;
  fromName: string;
  fromLevel: number;
  fromAvatar: string;
  fromSkinId: string;
  fromHatId: string;
  toUserId: string;
  toName: string;
  betCoins: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  roomId?: string;
  createdAt: number;
  expiresAt: number;
}

// Bot Champions available when no real players are online or for training
export const BOT_CHAMPIONS: DealOpponent[] = [
  {
    id: 'BOT-DUB1',
    nickname: '🤖 Шейх Капибар 🇦🇪 (ИИ)',
    level: 42,
    coins: 18500000,
    avatarIcon: '🦫',
    auraEffect: 'deal_fire',
    tapPower: 924,
    dealRank: '💼 Акула Сделок (Бот)',
    equippedSkinId: 'skin_sheikh_capy',
    equippedHatId: 'hat_crown',
    equippedWeaponId: 'scepter',
    bodyMutation: 'normal',
    isOnline: false,
    isBot: true,
    tier: 'mortal',
  },
  {
    id: 'BOT-SAM8',
    nickname: '🤖 Капи-Рёнин 2077 🥷 (ИИ)',
    level: 89,
    coins: 98000000,
    avatarIcon: '🦫',
    auraEffect: 'deal_fire',
    tapPower: 1958,
    dealRank: '👑 Крипто-Владыка (Бот)',
    equippedSkinId: 'skin_samurai_capy',
    equippedHatId: 'hat_shades',
    equippedWeaponId: 'katana',
    bodyMutation: 'normal',
    isOnline: false,
    isBot: true,
    tier: 'mortal',
  },
  {
    id: 'BOT-TIT9',
    nickname: '🤖 Титан Колосс 💪 (ИИ)',
    level: 168,
    coins: 1200000000,
    avatarIcon: '👑',
    auraEffect: 'divine_light',
    tapPower: 3696,
    dealRank: '👑 Крипто-Владыка (Бот)',
    equippedSkinId: 'skin_muscle_mutant',
    equippedHatId: 'hat_demon_horns',
    equippedWeaponId: 'greatsword',
    bodyMutation: 'muscle',
    isOnline: false,
    isBot: true,
    tier: 'divine',
  },
  {
    id: 'BOT-ARC3',
    nickname: '🤖 Архимаг Эфира 🔮 (ИИ)',
    level: 210,
    coins: 4500000000,
    avatarIcon: '👑',
    auraEffect: 'divine_light',
    tapPower: 4620,
    dealRank: '✨ Божественный Серафим (Бот)',
    equippedSkinId: 'skin_toxic_ooze',
    equippedHatId: 'hat_archmage_hood',
    equippedWeaponId: 'crystal_orb',
    bodyMutation: 'slime',
    isOnline: false,
    isBot: true,
    tier: 'divine',
  },
  {
    id: 'BOT-IMM1',
    nickname: '🤖 Бессмертный Абсолют 🌌 (ИИ)',
    level: 295,
    coins: 58000000000,
    avatarIcon: '🌌',
    auraEffect: 'immortal_void',
    tapPower: 6490,
    dealRank: '🌌 Бессмертный Владыка (Бот)',
    equippedSkinId: 'skin_god_capy',
    equippedHatId: 'hat_cosmic_crown',
    equippedWeaponId: 'scythe',
    bodyMutation: 'immortal',
    isOnline: false,
    isBot: true,
    tier: 'immortal',
  },
];

/**
 * Register and heart-beat player presence in Firestore activePlayers
 */
export async function updatePlayerPresence(
  saveData: GameSaveData,
  tgUser?: TelegramUser | null,
  isOffline: boolean = false
): Promise<void> {
  try {
    const user = await ensureAuthenticated();
    const uid = user.uid || getPersistentUserId();

    const perks = saveData.perks || {};
    let weapon: string | undefined = undefined;
    if (perks['perk_colossal_sword']) weapon = 'greatsword';
    else if (perks['perk_katana_shadow']) weapon = 'katana';
    else if (perks['perk_gold_scepter']) weapon = 'scepter';
    else if (perks['perk_crystal_orb']) weapon = 'crystal_orb';
    else if (perks['perk_abyss_scythe']) weapon = 'scythe';

    let body: 'normal' | 'muscle' | 'slime' | 'skeleton' | 'divine' | 'immortal' = 'normal';
    const lvl = Number(saveData.level) || 1;
    if (lvl > 265 || saveData.immortalUnlocked) body = 'immortal';
    else if (lvl > 165) body = 'divine';
    else if (perks['perk_muscle_mutation']) body = 'muscle';
    else if (perks['perk_slime_mutation']) body = 'slime';
    else if (perks['perk_skeleton_frame']) body = 'skeleton';

    const cleanNick = tgUser?.username
      ? `@${tgUser.username}`
      : saveData.playerName || `Капибара #${uid.slice(-4)}`;

    const playerRecord = {
      userId: uid,
      nickname: cleanNick,
      level: lvl,
      coins: Math.floor(saveData.coins || 0),
      totalCoinsEarned: Math.floor(saveData.totalCoinsEarned || saveData.coins || 0),
      prestige: Number(saveData.prestigeCount) || 0,
      selectedSkinId: saveData.selectedSkinIdBase || 'skin_default',
      selectedSkinIdOverlay: saveData.selectedSkinIdOverlay || 'skin_default',
      selectedHatId: saveData.selectedHatId || 'hat_none',
      customCapybara: saveData.customCapybara || null,
      perks: saveData.perks || {},
      bodyMutation: body,
      equippedWeaponId: weapon || null,
      dealsWon: saveData.dealStats?.dealsWon || 0,
      lastActive: isOffline ? 0 : Date.now(),
      status: isOffline ? 'offline' : 'online',
      telegramId: tgUser?.id || null,
    };

    const docRef = doc(db, 'activePlayers', uid);
    await setDoc(docRef, playerRecord, { merge: true });
  } catch (err) {
    console.warn('Failed to update player multiplayer presence:', err);
  }
}

/**
 * Subscribes to real-time ONLINE ONLY players from Firestore (active in last 2 mins)
 */
export function subscribeToActivePlayers(
  callback: (onlineRealPlayers: DealOpponent[], botChampions: DealOpponent[], onlineCount: number) => void
): () => void {
  try {
    const colRef = collection(db, 'activePlayers');
    const q = query(colRef, orderBy('lastActive', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOnline: DealOpponent[] = [];
        const now = Date.now();
        const currentUid = getPersistentUserId();

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (docSnap.id === currentUid) return; // Don't fight oneself

          const isOnline = d.status === 'online' && now - (d.lastActive || 0) < 1000 * 60 * 2;
          if (!isOnline) return;

          const lvl = Number(d.level) || 1;
          const tier = lvl > 265 ? 'immortal' : lvl > 165 ? 'divine' : 'mortal';

          let rankLabel = '💼 Акула Сделок';
          if (lvl > 265) rankLabel = '🌌 Бессмертный Владыка';
          else if (lvl > 165) rankLabel = '✨ Божественный Серафим';
          else if (lvl > 80) rankLabel = '👑 Крипто-Владыка';
          else if (lvl > 30) rankLabel = '⚡ Мастер Капи-Тапа';

          fetchedOnline.push({
            id: docSnap.id,
            nickname: d.nickname || 'Реальный Игрок',
            level: lvl,
            coins: Math.max(10000, Number(d.coins) || 0),
            avatarIcon: d.bodyMutation === 'immortal' ? '🌌' : d.bodyMutation === 'divine' ? '👑' : '🦫',
            auraEffect:
              d.bodyMutation === 'immortal'
                ? 'immortal_void'
                : d.bodyMutation === 'divine'
                ? 'divine_light'
                : 'deal_fire',
            tapPower: Math.max(80, Math.round(lvl * 25)),
            dealRank: rankLabel,
            equippedSkinId: d.selectedSkinId || 'skin_default',
            equippedHatId: d.selectedHatId || 'hat_none',
            equippedWeaponId: d.equippedWeaponId || undefined,
            bodyMutation: d.bodyMutation || 'normal',
            isOnline: true,
            isBot: false,
            tier,
          });
        });

        const totalOnline = fetchedOnline.length + 1;
        callback(fetchedOnline, BOT_CHAMPIONS, totalOnline);
      },
      (error) => {
        console.warn('Multiplayer listener error, using bot champions:', error);
        callback([], BOT_CHAMPIONS, 1);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to start multiplayer listener:', err);
    callback([], BOT_CHAMPIONS, 1);
    return () => {};
  }
}

/**
 * Creates a Live 1v1 PvP Duel Room
 */
export async function createDuelRoom(
  hostPlayer: DealOpponent,
  betCoins: number
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  try {
    const user = await ensureAuthenticated();
    const hostUid = user.uid || getPersistentUserId();

    const roomId = `DUEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const roomRef = doc(db, 'duelRooms', roomId);

    const roomData: DuelRoomData = {
      roomId,
      hostId: hostUid,
      hostName: hostPlayer.nickname,
      hostLevel: hostPlayer.level,
      hostAvatar: hostPlayer.avatarIcon,
      hostSkinId: hostPlayer.equippedSkinId || 'skin_default',
      hostHatId: hostPlayer.equippedHatId || 'hat_none',
      hostScore: 0,
      hostTaps: 0,
      guestScore: 0,
      guestTaps: 0,
      betCoins: Math.max(1000, betCoins),
      status: 'waiting',
      durationSeconds: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(roomRef, roomData);
    return { success: true, roomId };
  } catch (err: any) {
    console.error('Failed to create duel room:', err);
    return { success: false, error: err?.message || 'Ошибка создания комнаты' };
  }
}

/**
 * Joins an existing Live Duel Room as a guest
 */
export async function joinDuelRoom(
  roomId: string,
  guestPlayer: DealOpponent
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await ensureAuthenticated();
    const guestUid = user.uid || getPersistentUserId();

    const roomRef = doc(db, 'duelRooms', roomId);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      return { success: false, error: 'Комната дуэли не найдена или закрыта' };
    }

    const data = snap.data() as DuelRoomData;
    if (data.status !== 'waiting') {
      return { success: false, error: 'В этой комнате уже идёт битва' };
    }

    await updateDoc(roomRef, {
      guestId: guestUid,
      guestName: guestPlayer.nickname,
      guestLevel: guestPlayer.level,
      guestAvatar: guestPlayer.avatarIcon,
      guestSkinId: guestPlayer.equippedSkinId || 'skin_default',
      guestHatId: guestPlayer.equippedHatId || 'hat_none',
      status: 'starting',
      startedAt: Date.now() + 3000,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to join duel room:', err);
    return { success: false, error: err?.message || 'Ошибка подключения к комнате' };
  }
}

/**
 * Subscribe to Live Duel Room updates in real-time
 */
export function subscribeToDuelRoom(
  roomId: string,
  callback: (room: DuelRoomData | null) => void
): () => void {
  try {
    const roomRef = doc(db, 'duelRooms', roomId);
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        callback(docSnap.data() as DuelRoomData);
      },
      (err) => {
        console.warn('Duel room listener error:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to listen to duel room:', err);
    return () => {};
  }
}

/**
 * Update real-time score inside a live duel room
 */
export async function updateDuelTap(
  roomId: string,
  isHost: boolean,
  currentScore: number,
  currentTaps: number
): Promise<void> {
  try {
    const roomRef = doc(db, 'duelRooms', roomId);
    if (isHost) {
      await updateDoc(roomRef, {
        hostScore: currentScore,
        hostTaps: currentTaps,
        updatedAt: Date.now(),
      });
    } else {
      await updateDoc(roomRef, {
        guestScore: currentScore,
        guestTaps: currentTaps,
        updatedAt: Date.now(),
      });
    }
  } catch (e) {
    // Non-blocking on network jitter
  }
}

/**
 * Mark duel as finished and declare winner
 */
export async function finishDuelRoom(roomId: string, winnerId: string): Promise<void> {
  try {
    const roomRef = doc(db, 'duelRooms', roomId);
    await updateDoc(roomRef, {
      status: 'finished',
      winnerId,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn('Failed to finish duel room:', e);
  }
}

/**
 * Leave or cancel duel room
 */
export async function leaveDuelRoom(roomId: string, isHost: boolean): Promise<void> {
  try {
    const roomRef = doc(db, 'duelRooms', roomId);
    if (isHost) {
      await deleteDoc(roomRef);
    } else {
      await updateDoc(roomRef, {
        guestId: null,
        guestName: null,
        status: 'waiting',
        updatedAt: Date.now(),
      });
    }
  } catch (e) {
    console.warn('Failed to leave duel room:', e);
  }
}

/**
 * Subscribes to open waiting duel rooms created by other players
 */
export function listenToWaitingRooms(callback: (rooms: DuelRoomData[]) => void): () => void {
  try {
    const colRef = collection(db, 'duelRooms');
    const q = query(colRef, where('status', '==', 'waiting'), limit(15));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rooms: DuelRoomData[] = [];
        snapshot.forEach((d) => {
          const r = d.data() as DuelRoomData;
          if (Date.now() - r.createdAt < 1000 * 60 * 5) {
            rooms.push(r);
          }
        });
        callback(rooms);
      },
      (err) => {
        console.warn('Waiting rooms listener error:', err);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Failed to listen to waiting rooms:', e);
    return () => {};
  }
}

// ==========================================
// DIRECT REAL-TIME DUEL CHALLENGES (1v1 ВЫЗОВ)
// ==========================================

/**
 * Send a direct real-time challenge to an online player
 */
export async function sendDuelChallenge(
  fromPlayer: {
    id: string;
    nickname: string;
    level: number;
    avatar: string;
    skinId: string;
    hatId: string;
  },
  targetPlayer: {
    id: string;
    nickname: string;
  },
  betCoins: number
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  try {
    await ensureAuthenticated();
    const challengeId = `CHAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const docRef = doc(db, 'duelChallenges', challengeId);

    const challengeData: DuelChallengeData = {
      challengeId,
      fromUserId: fromPlayer.id,
      fromName: fromPlayer.nickname,
      fromLevel: fromPlayer.level,
      fromAvatar: fromPlayer.avatar,
      fromSkinId: fromPlayer.skinId,
      fromHatId: fromPlayer.hatId,
      toUserId: targetPlayer.id,
      toName: targetPlayer.nickname,
      betCoins,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 25000, // 25s to accept
    };

    await setDoc(docRef, challengeData);
    return { success: true, challengeId };
  } catch (err: any) {
    console.error('Failed to send duel challenge:', err);
    return { success: false, error: err?.message || 'Не удалось отправить вызов' };
  }
}

/**
 * Subscribes to incoming duel challenges for the current player
 */
export function listenToIncomingChallenges(
  myUserId: string,
  callback: (challenge: DuelChallengeData | null) => void
): () => void {
  try {
    const colRef = collection(db, 'duelChallenges');
    const q = query(
      colRef,
      where('toUserId', '==', myUserId),
      where('status', '==', 'pending'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        let validChallenge: DuelChallengeData | null = null;
        snapshot.forEach((d) => {
          const c = d.data() as DuelChallengeData;
          if (c.expiresAt > now && !validChallenge) {
            validChallenge = c;
          }
        });
        callback(validChallenge);
      },
      (err) => {
        console.warn('Incoming challenges listener error:', err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to listen to incoming challenges:', err);
    return () => {};
  }
}

/**
 * Subscribes to status updates of a challenge sent by current player
 */
export function listenToSentChallenge(
  challengeId: string,
  callback: (challenge: DuelChallengeData | null) => void
): () => void {
  try {
    const docRef = doc(db, 'duelChallenges', challengeId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
          return;
        }
        callback(snap.data() as DuelChallengeData);
      },
      (err) => {
        console.warn('Sent challenge listener error:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to listen to sent challenge:', err);
    return () => {};
  }
}

/**
 * Accept incoming duel challenge: creates the live duel room and sets status to 'accepted'
 */
export async function acceptDuelChallenge(
  challenge: DuelChallengeData,
  myPlayer: {
    id: string;
    nickname: string;
    level: number;
    avatar: string;
    skinId: string;
    hatId: string;
  }
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  try {
    await ensureAuthenticated();
    const roomId = `DUEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const roomRef = doc(db, 'duelRooms', roomId);

    // Create live room with both challenger (host) and accepter (guest) ready
    const roomData: DuelRoomData = {
      roomId,
      hostId: challenge.fromUserId,
      hostName: challenge.fromName,
      hostLevel: challenge.fromLevel,
      hostAvatar: challenge.fromAvatar,
      hostSkinId: challenge.fromSkinId,
      hostHatId: challenge.fromHatId,
      hostScore: 0,
      hostTaps: 0,
      guestId: myPlayer.id,
      guestName: myPlayer.nickname,
      guestLevel: myPlayer.level,
      guestAvatar: myPlayer.avatar,
      guestSkinId: myPlayer.skinId,
      guestHatId: myPlayer.hatId,
      guestScore: 0,
      guestTaps: 0,
      betCoins: challenge.betCoins,
      status: 'starting',
      startedAt: Date.now() + 3000,
      durationSeconds: 15,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(roomRef, roomData);

    // Update challenge document
    const challengeRef = doc(db, 'duelChallenges', challenge.challengeId);
    await updateDoc(challengeRef, {
      status: 'accepted',
      roomId,
    });

    return { success: true, roomId };
  } catch (err: any) {
    console.error('Failed to accept duel challenge:', err);
    return { success: false, error: err?.message || 'Ошибка принятия вызова' };
  }
}

/**
 * Decline incoming duel challenge
 */
export async function declineDuelChallenge(challengeId: string): Promise<void> {
  try {
    const challengeRef = doc(db, 'duelChallenges', challengeId);
    await updateDoc(challengeRef, {
      status: 'declined',
    });
  } catch (err) {
    console.warn('Failed to decline duel challenge:', err);
  }
}

/**
 * Cancel sent duel challenge
 */
export async function cancelDuelChallenge(challengeId: string): Promise<void> {
  try {
    const challengeRef = doc(db, 'duelChallenges', challengeId);
    await deleteDoc(challengeRef);
  } catch (err) {
    console.warn('Failed to cancel duel challenge:', err);
  }
}
