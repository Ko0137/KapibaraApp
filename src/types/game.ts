export type LevelTier = 'mortal' | 'divine' | 'immortal';

export interface LossDebuff {
  name: string;
  desc: string;
  percent: number; // e.g. 0.4 for -40%
  expiresAt: number;
  icon: string;
}

export interface GameLevel {
  level: number;
  name: string;
  era: string;
  description: string;
  icon: string;
  clicksRequired: number;
  rewardCoins: number;
  rewardGems: number;
  isBoss: boolean;
  bossHp?: number;
  bossTimeLimit?: number;
  bossName?: string;
  quote?: string;
  tier?: LevelTier;
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  effectValue: number;
  type: 'tap' | 'idle' | 'crit_chance' | 'crit_mult' | 'fever_rate';
  requiredLevel?: number;
  unlockedAtLevel?: number;
  level?: number;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  icon: string;
  costGems: number;
  bonusType: 'all_income' | 'offline_rate' | 'fever_time' | 'boss_time' | 'crit_power';
  bonusValue: number;
  level?: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
  costCoins?: number;
  costGems?: number;
  requiredLevel?: number;
  requiredPerkId?: string;
  bonusDescription: string;
  bonusType: 'tap_power' | 'idle_income' | 'crit' | 'energy_regen' | 'boss_dmg' | 'deal_power' | 'all';
  bonusValue: number;
  isSecret?: boolean;
  secretHint?: string;
  universe?: 'marvel' | 'dc' | 'gaming' | 'classic' | 'anime';
}

export interface CharacterHat {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedBy: string;
  bonusDesc: string;
}

export interface LevelPerk {
  id: string;
  title: string;
  description: string;
  icon: string;
  branch: 'tap' | 'idle' | 'boss' | 'prestige' | 'deal' | 'sheikh' | 'tech' | 'str' | 'int' | 'dex' | 'fai' | 'chaos';
  tier: number;
  maxRank: number;
  bonusPerRank: number;
  effectType:
    | 'tap_power'
    | 'crit_chance'
    | 'crit_damage'
    | 'fever_speed'
    | 'idle_power'
    | 'offline_hours'
    | 'boss_time'
    | 'boss_damage'
    | 'prestige_gain'
    | 'free_gems'
    | 'deal_fury'
    | 'deal_shield'
    | 'soulslike_str'
    | 'soulslike_int'
    | 'soulslike_dex'
    | 'soulslike_fai'
    | 'soulslike_chaos';
  requiredPerkId?: string;
  requiredPerks?: string[];
  requiredCardId?: string;
  costPerkPoints?: number;
  soulslikePath?: 'str' | 'int' | 'dex' | 'fai' | 'chaos';
  statBonuses?: {
    str?: number;
    dex?: number;
    int?: number;
    vit?: number;
    lck?: number;
  };
  visualWeapon?: string; // e.g. 🪄 Wooden Staff, 🔮 Crystal Scepter, 🗡️ Katana, ⚔️ Greatsword
  visualWeaponName?: string;
  visualBodyMutation?: 'muscle' | 'slime' | 'skeleton' | 'cyber' | 'normal';
  visualAura?: string; // Aura that changes the Capybara appearance!
}

export interface MemeAchievement {
  id: string;
  title: string;
  memeQuote: string;
  icon: string;
  requiredLevel: number;
  conditionDesc: string;
  rewardGems: number;
}

export interface HamsterCard {
  id: string;
  title: string;
  category: 'pr' | 'legal' | 'tech' | 'specials' | 'memes';
  icon: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  profitPerHourBase: number;
  requiredLevel: number;
  unlocksBranchId?: string;
  unlocksBranchName?: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardGems: number;
  completed: boolean;
  type: 'taps' | 'bosses' | 'fever' | 'upgrades' | 'golden_dumpling' | 'deals';
}

export interface DailyStreakDay {
  day: number;
  rewardText: string;
  coins: number;
  gems: number;
  boosterMinutes?: number;
}

export interface ActiveBoost {
  multiplier: number;
  expiresAt: number;
  type: 'frenzy' | 'daily' | 'wheel';
}

export interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  isCrit: boolean;
  isFever: boolean;
}

export interface LeaderboardItem {
  userId: string;
  nickname: string;
  level: number;
  prestige: number;
  totalCoinsEarned: number;
  bossesDefeated: number;
  dealsWon?: number;
  avatarIcon?: string;
  verifiedFair?: boolean;
  updatedAt: string;
}

export interface DealOpponent {
  id: string;
  nickname: string;
  level: number;
  coins: number;
  avatarIcon: string;
  auraEffect: string;
  tapPower: number;
  dealRank: string;
  equippedSkinId?: string;
  equippedHatId?: string;
  equippedWeaponId?: string;
  bodyMutation?: 'normal' | 'muscle' | 'slime' | 'skeleton' | 'divine' | 'immortal';
  isOnline?: boolean;
  tier?: LevelTier;
}

export interface DealStats {
  dealsWon: number;
  dealsLost: number;
  totalCoinsWon: number;
  lastDealTimestamp: number;
  lastWeeklyDealTimestamp: number;
  penaltiesPaid: number;
}

export interface DealHistoryItem {
  id: string;
  opponentName: string;
  opponentAvatar: string;
  opponentWeapon?: string;
  userClicks: number;
  opponentClicks: number;
  won: boolean;
  coinsChange: number;
  timestamp: number;
}

export interface SecretEvent {
  id: string;
  index: number;
  title: string;
  hint: string;
  revealedDesc: string;
  rewardType: 'gems' | 'skin' | 'hat' | 'perk_point';
  rewardValue: string | number;
  icon: string;
  category: 'combat' | 'tap' | 'economy' | 'secrets' | 'build';
}

export interface CustomCapybaraConfig {
  furColor: string; // 'walnut' | 'chocolate' | 'albino' | 'pink_punk' | 'neon_cyber' | 'lava_red' | 'gold_bar' | 'void_purple'
  furColorHex: string;
  furColorName: string;
  hairStyle: string; // 'smooth' | 'mohawk' | 'gentleman' | 'dreadlocks' | 'anime_bangs' | 'samurai_bun' | 'royal_curls'
  hairStyleName: string;
  hairStyleIcon: string;
  teethStyle: string; // 'classic' | 'gold_grillz' | 'vampire_fangs' | 'saber_tusks' | 'cyber_neon'
  teethStyleName: string;
  teethStyleIcon: string;
  eyeStyle: string; // 'zen' | 'fierce' | 'laser_eye' | 'third_eye' | 'shades'
  eyeStyleName: string;
  eyeStyleIcon: string;
  initialSetupDone?: boolean;
}

export interface GameSaveData {
  playerName: string;
  cloudId?: string;
  version: number;
  level: number;
  coins: number;
  totalCoinsEarned: number;
  gems: number;
  totalTaps: number;
  prestigeCount: number;
  cosmicShards: number;
  currentLevelClicks: number;
  perkPoints: number;
  perks: Record<string, number>;
  upgrades: Record<string, number>;
  artifacts: Record<string, number>;
  cards: Record<string, number>; // cardId -> level
  selectedSkinIdBase: string;
  selectedSkinIdOverlay: string;
  unlockedSkinIds: string[];
  selectedHatId: string;
  unlockedHatIds: string[];
  unlockedAchievements: string[];
  // Base Capybara Customizer Configuration
  customCapybara?: CustomCapybaraConfig;
  // Energy & Boost limitations
  energy: number;
  maxEnergy: number;
  lastEnergyTimestamp: number;
  fullEnergyBoostsLeft: number; // max 6/day
  turboBoostsLeft: number;      // max 3/day
  lastEnergyBoostDate: string;  // YYYY-MM-DD
  completedBosses: number[];
  lastSavedTimestamp: number;
  lastLoginDate: string;        // YYYY-MM-DD
  dailyStreak: number;
  lastDailyClaimTimestamp: number;
  lastWheelSpinTimestamp: number;
  dailyComboClaimedDate?: string;
  quests: DailyQuest[];
  activeBoosts: ActiveBoost[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  screenShakeEnabled: boolean;
  // PvP Deal System
  dealStats: DealStats;
  dealHistory: DealHistoryItem[];
  lossDebuff?: LossDebuff | null;
  // 50 Secret Events
  unlockedSecretEvents: string[];
  // Soulslike respec
  respecTokens: number;
  // Class Evolution
  immortalUnlocked?: boolean;
}

