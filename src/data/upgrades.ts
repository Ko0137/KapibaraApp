import { UpgradeItem, Artifact, DailyStreakDay, DailyQuest } from '../types/game';

export interface WheelRewardItem {
  id: string;
  text: string;
  type: 'coins' | 'gems' | 'boost' | 'weekly_skin' | 'perk_points' | 'respec_token' | 'full_energy';
  amount?: number;
  multiplier?: number;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: string;
}

export const DEFAULT_UPGRADES: UpgradeItem[] = [
  // --- TAP UPGRADES ---
  {
    id: 'wooden_stick',
    name: 'Бамбуковая палочка',
    description: '+1 к силе каждого тапа',
    baseCost: 15,
    costMultiplier: 1.12,
    effectValue: 1,
    type: 'tap',
    level: 0,
    icon: '🎋',
    unlockedAtLevel: 1
  },
  {
    id: 'tasty_orange',
    name: 'Сочный мандарин',
    description: '+3 к силе тапа',
    baseCost: 120,
    costMultiplier: 1.15,
    effectValue: 3,
    type: 'tap',
    level: 0,
    icon: '🍊',
    unlockedAtLevel: 3
  },
  {
    id: 'golden_brush',
    name: 'Щётка для шерсти',
    description: '+12 к силе тапа',
    baseCost: 650,
    costMultiplier: 1.17,
    effectValue: 12,
    type: 'tap',
    level: 0,
    icon: '🪥',
    unlockedAtLevel: 7
  },
  {
    id: 'laser_pointer',
    name: 'Лазерная указка Капибарыча',
    description: '+60 к силе тапа',
    baseCost: 8500,
    costMultiplier: 1.2,
    effectValue: 60,
    type: 'tap',
    level: 0,
    icon: '🔦',
    unlockedAtLevel: 18
  },
  {
    id: 'nano_glove',
    name: 'Нано-перчатка Таноса',
    description: '+450 к силе тапа',
    baseCost: 65000,
    costMultiplier: 1.22,
    effectValue: 450,
    type: 'tap',
    level: 0,
    icon: '🧤',
    unlockedAtLevel: 30
  },
  {
    id: 'divine_click',
    name: 'Божественный щелчок',
    description: '+2,500 к силе каждого клика',
    baseCost: 450000,
    costMultiplier: 1.24,
    effectValue: 2500,
    type: 'tap',
    level: 0,
    icon: '👑',
    unlockedAtLevel: 50
  },
  {
    id: 'quantum_finger',
    name: 'Квантовый гипер-палец',
    description: '+18,000 к силе тапа',
    baseCost: 3500000,
    costMultiplier: 1.26,
    effectValue: 18000,
    type: 'tap',
    level: 0,
    icon: '🌌',
    unlockedAtLevel: 75
  },

  // --- IDLE AUTO-CLICKERS ---
  {
    id: 'pocket_clicker',
    name: 'Карманный кликер',
    description: '+1 монета/сек в фоновом режиме',
    baseCost: 50,
    costMultiplier: 1.15,
    effectValue: 1,
    type: 'idle',
    level: 0,
    icon: '📟',
    unlockedAtLevel: 1
  },
  {
    id: 'cat_paw',
    name: 'Кот с лапкой-тапалкой',
    description: '+6 монет/сек от мурчащего друга',
    baseCost: 350,
    costMultiplier: 1.16,
    effectValue: 6,
    type: 'idle',
    level: 0,
    icon: '🐾',
    unlockedAtLevel: 4
  },
  {
    id: 'babushka_turbo',
    name: 'Бабушка с веником',
    description: '+28 монет/сек (быстрее любого робота)',
    baseCost: 2200,
    costMultiplier: 1.17,
    effectValue: 28,
    type: 'idle',
    level: 0,
    icon: '👵',
    unlockedAtLevel: 10
  },
  {
    id: 'intern_energy',
    name: 'Энергичный стажёр',
    description: '+135 монет/сек за кружку кофе',
    baseCost: 14000,
    costMultiplier: 1.19,
    effectValue: 135,
    type: 'idle',
    level: 0,
    icon: '☕',
    unlockedAtLevel: 22
  },
  {
    id: 'hot_spring_spa',
    name: 'Онсэн-СПА комплекс',
    description: '+750 монет/сек от релакса',
    baseCost: 110000,
    costMultiplier: 1.21,
    effectValue: 750,
    type: 'idle',
    level: 0,
    icon: '♨️',
    unlockedAtLevel: 38
  },
  {
    id: 'yuzu_plantation',
    name: 'Плантация цитрусов Юдзу',
    description: '+4,200 монет/сек',
    baseCost: 950000,
    costMultiplier: 1.23,
    effectValue: 4200,
    type: 'idle',
    level: 0,
    icon: '🍋',
    unlockedAtLevel: 60
  },
  {
    id: 'meme_factory',
    name: 'Мемная фабрика Капибар',
    description: '+24,000 монет/сек в крипто-фонд',
    baseCost: 7500000,
    costMultiplier: 1.25,
    effectValue: 24000,
    type: 'idle',
    level: 0,
    icon: '🏭',
    unlockedAtLevel: 85
  },
  {
    id: 'interstellar_chill',
    name: 'Межгалактический Чиллинг',
    description: '+150,000 монет/сек во всей вселенной',
    baseCost: 65000000,
    costMultiplier: 1.27,
    effectValue: 150000,
    type: 'idle',
    level: 0,
    icon: '🚀',
    unlockedAtLevel: 110
  },

  // --- SPECIAL & CRIT UPGRADES ---
  {
    id: 'lucky_clover',
    name: 'Четырёхлистный клевер',
    description: '+2% к шансу критического клика',
    baseCost: 800,
    costMultiplier: 1.35,
    effectValue: 0.02,
    type: 'crit_chance',
    level: 0,
    icon: '🍀',
    unlockedAtLevel: 5
  },
  {
    id: 'energy_drink',
    name: 'Энергетик "Капи-Заряд"',
    description: '+150 к максимальному запасу энергии',
    baseCost: 1500,
    costMultiplier: 1.3,
    effectValue: 150,
    type: 'tap',
    level: 0,
    icon: '⚡',
    unlockedAtLevel: 8
  },
  {
    id: 'crit_multiplier_boost',
    name: 'Яростный укус капибары',
    description: '+0.5x к множителю критического урона',
    baseCost: 4500,
    costMultiplier: 1.4,
    effectValue: 0.5,
    type: 'crit_mult',
    level: 0,
    icon: '💥',
    unlockedAtLevel: 15
  },
  {
    id: 'energy_recovery_boost',
    name: 'Медитация на воде',
    description: '+1 к скорости восстановления энергии в секунду',
    baseCost: 12000,
    costMultiplier: 1.35,
    effectValue: 1,
    type: 'tap',
    level: 0,
    icon: '🧘',
    unlockedAtLevel: 25
  },
  {
    id: 'golden_touch',
    name: 'Золотое прикосновение',
    description: '+5% шанс выбить Золотой Тап (x10 доход)',
    baseCost: 180000,
    costMultiplier: 1.45,
    effectValue: 0.05,
    type: 'fever_rate',
    level: 0,
    icon: '🌟',
    unlockedAtLevel: 45
  },
  {
    id: 'boss_slayer_instinct',
    name: 'Инстинкт Убийцы Боссов',
    description: '+5 секунд дополнительного времени в битвах с боссами',
    baseCost: 850000,
    costMultiplier: 1.5,
    effectValue: 5,
    type: 'tap',
    level: 0,
    icon: '⚔️',
    unlockedAtLevel: 65
  }
];

export const DEFAULT_ARTIFACTS: Artifact[] = [
  {
    id: 'art_zen_stone',
    name: 'Камень Абсолютного Дзена',
    description: '+15% ко всем доходам навсегда',
    costGems: 15,
    bonusType: 'all_income',
    bonusValue: 0.15,
    icon: '🪨'
  },
  {
    id: 'art_golden_mandarin',
    name: 'Священный Мандарин Вечности',
    description: '+50% к шансу и силе критических тапов',
    costGems: 40,
    bonusType: 'crit_power',
    bonusValue: 0.5,
    icon: '🍊'
  },
  {
    id: 'art_cosmic_yuzu',
    name: 'Космический Цитрус',
    description: 'Удваивает доход от всех пассивных построек (x2)',
    costGems: 85,
    bonusType: 'offline_rate',
    bonusValue: 1.0,
    icon: '✨'
  },
  {
    id: 'art_infinity_bath',
    name: 'Купель Бесконечной Энергии',
    description: 'Увеличивает запас энергии на +1,000 и ускоряет регенерацию в 2 раза',
    costGems: 150,
    bonusType: 'all_income',
    bonusValue: 1000,
    icon: '🛁'
  },
  {
    id: 'art_crown_of_capy',
    name: 'Корона Владыки Капибар',
    description: 'Даёт +100% (x2) ко всему клику и пассиву, плюс супер-ауру!',
    costGems: 300,
    bonusType: 'all_income',
    bonusValue: 2.0,
    icon: '👑'
  },
  {
    id: 'art_abyssal_totem',
    name: 'Тотемический Идол Бездны',
    description: 'Дарует +250% к силе Сделки Века в PvP-битвах',
    costGems: 500,
    bonusType: 'all_income',
    bonusValue: 2.5,
    icon: '🗿'
  },
  {
    id: 'art_chronos_hourglass',
    name: 'Песочные Часы Хроноса',
    description: 'Увеличивает длительность всех бустеров в 2 раза',
    costGems: 750,
    bonusType: 'fever_time',
    bonusValue: 2.0,
    icon: '⏳'
  },
  {
    id: 'art_quantum_core',
    name: 'Квантовое Сердце Мультиверса',
    description: '+500% к максимальному доходу в режиме Лихорадки (Fever x15)',
    costGems: 1200,
    bonusType: 'fever_time',
    bonusValue: 5.0,
    icon: '🎲'
  }
];

export const DAILY_STREAK_REWARDS: DailyStreakDay[] = [
  { day: 1, rewardText: '1 000 Монет', coins: 1000, gems: 5 },
  { day: 2, rewardText: '3 500 Монет + 15 Кристаллов', coins: 3500, gems: 15 },
  { day: 3, rewardText: 'x2 Бустер на 30 мин + 25 Кристаллов', coins: 5000, gems: 25, boosterMinutes: 30 },
  { day: 4, rewardText: '15 000 Монет + 40 Кристаллов', coins: 15000, gems: 40 },
  { day: 5, rewardText: '35 000 Монет + 60 Кристаллов', coins: 35000, gems: 60 },
  { day: 6, rewardText: 'x3 Бустер на 60 мин + 80 Кристаллов', coins: 60000, gems: 80, boosterMinutes: 60 },
  { day: 7, rewardText: '👑 МЕГА-СУНДУК: 200 000 Монет + 150 Кристаллов!', coins: 200000, gems: 150, boosterMinutes: 120 }
];

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest_taps_100',
    title: 'Нажать на экран 250 раз',
    target: 250,
    current: 0,
    rewardCoins: 2500,
    rewardGems: 8,
    completed: false,
    type: 'taps'
  },
  {
    id: 'quest_fever_2',
    title: 'Активировать режим Fever 3 раза',
    target: 3,
    current: 0,
    rewardCoins: 4000,
    rewardGems: 12,
    completed: false,
    type: 'fever'
  },
  {
    id: 'quest_boss_1',
    title: 'Победить 1 босса эпохи',
    target: 1,
    current: 0,
    rewardCoins: 8000,
    rewardGems: 20,
    completed: false,
    type: 'bosses'
  },
  {
    id: 'quest_upgrades_5',
    title: 'Купить 5 любых улучшений',
    target: 5,
    current: 0,
    rewardCoins: 3500,
    rewardGems: 10,
    completed: false,
    type: 'upgrades'
  },
  {
    id: 'quest_dumpling_1',
    title: 'Поймать летящий Золотой Пельмень',
    target: 1,
    current: 0,
    rewardCoins: 6000,
    rewardGems: 15,
    completed: false,
    type: 'golden_dumpling'
  }
];

export const WEEKLY_WHEEL_SKINS = [
  { id: 'skin_deadpool_capy', name: 'Капибара-Дэдпул', icon: '🦸', desc: 'Безумный наёмник с регенерацией x3' },
  { id: 'skin_cyberpunk_2077', name: 'Капибара Киберпанк 2077', icon: '🦾', desc: 'Киберимпланты Найт-Сити (+15% клики)' },
  { id: 'skin_wolverine_capy', name: 'Капибара-Росомаха', icon: '🐾', desc: 'Когти из адамантия (+35% крит)' },
  { id: 'skin_batman_capy', name: 'Капибара-Бэтмен', icon: '🦇', desc: 'Тёмный рыцарь Готэма (+25% урон боссам)' },
  { id: 'skin_spider_capy', name: 'Капибара-Паук', icon: '🕸️', desc: 'Паучье чутьё (+20% шанс крита)' },
  { id: 'skin_thor_capy', name: 'Капибара-Тор', icon: '⚡', desc: 'Бог Грома (+50% молниевый урон)' },
  { id: 'skin_joker_capy', name: 'Капибара-Джокер', icon: '🃏', desc: 'Безумный азарт (+300% к удаче)' },
];

export function getCurrentWeeklyWheelSkin() {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_WHEEL_SKINS[weekNumber % WEEKLY_WHEEL_SKINS.length];
}

/**
 * Checks if Happy Hour is currently active:
 * Morning Zen: 08:00 - 11:00
 * Evening Rush: 19:00 - 23:00
 */
export function isHappyHourNow(): { active: boolean; label: string; boostMultiplier: number; timeRemainingMs: number } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const isMorning = hours >= 8 && hours < 11;
  const isEvening = hours >= 19 && hours < 23;

  if (isMorning) {
    const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0).getTime();
    return {
      active: true,
      label: '🌅 УТРЕННИЙ ДЗЕН: x1.5 К НАГРАДАМ!',
      boostMultiplier: 1.5,
      timeRemainingMs: Math.max(0, endMs - Date.now()),
    };
  }

  if (isEvening) {
    const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0).getTime();
    return {
      active: true,
      label: '🌆 ВЕЧЕРНИЙ РАШ: x1.5 К НАГРАДАМ!',
      boostMultiplier: 1.5,
      timeRemainingMs: Math.max(0, endMs - Date.now()),
    };
  }

  // Next happy hour countdown
  let nextTargetHour = hours < 8 ? 8 : hours < 19 ? 19 : 8;
  const targetDate = new Date(now.getFullYear(), now.getMonth(), hours >= 23 ? now.getDate() + 1 : now.getDate(), nextTargetHour, 0, 0);

  return {
    active: false,
    label: 'Счастливые Часы: 08:00-11:00 и 19:00-23:00',
    boostMultiplier: 1.0,
    timeRemainingMs: Math.max(0, targetDate.getTime() - Date.now()),
  };
}

/**
 * Procedurally generates 12 unique, balanced wheel items for each calendar day
 */
export function generateDailyWheelItems(dateStr: string, playerLevel: number = 1): WheelRewardItem[] {
  // Simple deterministic seed from date
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) % 100000;
  }

  const weeklySkin = getCurrentWeeklyWheelSkin();
  const scale = Math.max(1, Math.min(100, Math.floor(playerLevel / 3)));
  const coinBase = Math.max(25000, playerLevel * 5000);

  // Pool of varied potential daily items
  const potentialJackpots: WheelRewardItem[] = [
    { id: 'w_skin_weekly', text: `🦸 ${weeklySkin.name}`, type: 'weekly_skin', color: '#DC2626', rarity: 'mythic', icon: '👑' },
    { id: 'w_gems_jackpot', text: '💎 ДЖЕКПОТ 150 💎', type: 'gems', amount: 150, color: '#9333EA', rarity: 'mythic', icon: '💎' },
    { id: 'w_respec_token', text: '🌀 Сброс Билда Душ', type: 'respec_token', amount: 1, color: '#DB2777', rarity: 'mythic', icon: '🌀' },
  ];

  const potentialCoins: WheelRewardItem[] = [
    { id: 'w_coins_huge', text: `🪙 ${Math.round(coinBase * 25).toLocaleString()} Коинов`, type: 'coins', amount: Math.round(coinBase * 25), color: '#D97706', rarity: 'legendary', icon: '💰' },
    { id: 'w_coins_large', text: `🪙 ${Math.round(coinBase * 10).toLocaleString()} Коинов`, type: 'coins', amount: Math.round(coinBase * 10), color: '#EA580C', rarity: 'epic', icon: '🪙' },
    { id: 'w_coins_med', text: `🪙 ${Math.round(coinBase * 4).toLocaleString()} Коинов`, type: 'coins', amount: Math.round(coinBase * 4), color: '#059669', rarity: 'rare', icon: '🪙' },
    { id: 'w_coins_small', text: `🪙 ${Math.round(coinBase * 1.5).toLocaleString()} Коинов`, type: 'coins', amount: Math.round(coinBase * 1.5), color: '#10B981', rarity: 'common', icon: '🪙' },
  ];

  const potentialGems: WheelRewardItem[] = [
    { id: 'w_gems_large', text: '💎 45 Кристаллов', type: 'gems', amount: 45, color: '#7C3AED', rarity: 'epic', icon: '💎' },
    { id: 'w_gems_med', text: '💎 20 Кристаллов', type: 'gems', amount: 20, color: '#6D28D9', rarity: 'rare', icon: '💎' },
    { id: 'w_gems_small', text: '💎 10 Кристаллов', type: 'gems', amount: 10, color: '#3B82F6', rarity: 'common', icon: '💎' },
  ];

  const potentialBoosts: WheelRewardItem[] = [
    { id: 'w_boost_frenzy', text: '⚡ x5 Доход (10 мин)', type: 'boost', amount: 10, multiplier: 5, color: '#E11D48', rarity: 'epic', icon: '⚡' },
    { id: 'w_boost_turbo', text: '🚀 x3 Турбо-Тап (15м)', type: 'boost', amount: 15, multiplier: 3, color: '#0891B2', rarity: 'rare', icon: '🚀' },
    { id: 'w_boost_chill', text: '🍊 x2 Дзен (30 мин)', type: 'boost', amount: 30, multiplier: 2, color: '#F59E0B', rarity: 'common', icon: '🍊' },
    { id: 'w_full_energy', text: '⚡ 100% Энергия', type: 'full_energy', color: '#14B8A6', rarity: 'common', icon: '🔋' },
  ];

  const potentialTalents: WheelRewardItem[] = [
    { id: 'w_perk_pts', text: '✦ +2 Очка Навыков', type: 'perk_points', amount: 2, color: '#4338CA', rarity: 'legendary', icon: '✦' },
  ];

  // Pick 12 items deterministically for the day
  const jackpot = potentialJackpots[seed % potentialJackpots.length];
  const talent = potentialTalents[0];

  return [
    jackpot,
    potentialCoins[0],
    potentialGems[0],
    potentialBoosts[0],
    potentialCoins[1],
    potentialGems[1],
    talent,
    potentialCoins[2],
    potentialBoosts[1],
    potentialGems[2],
    potentialCoins[3],
    potentialBoosts[2],
  ];
}

export const LUCKY_WHEEL_ITEMS = generateDailyWheelItems(new Date().toISOString().split('T')[0], 1);
