import { UpgradeItem, Artifact, DailyStreakDay, DailyQuest } from '../types/game';

export const DEFAULT_UPGRADES: UpgradeItem[] = [
  // --- TAP POWER UPGRADES ---
  {
    id: 'tap_muscle',
    name: 'Качалка для пальца',
    description: '+1 к силе каждого тапа',
    baseCost: 15,
    costMultiplier: 1.15,
    effectValue: 1,
    type: 'tap',
    level: 0,
    icon: '💪',
    unlockedAtLevel: 1
  },
  {
    id: 'iron_thimble',
    name: 'Железный напёрсток',
    description: '+4 к силе тапа',
    baseCost: 120,
    costMultiplier: 1.17,
    effectValue: 4,
    type: 'tap',
    level: 0,
    icon: '🛡️',
    unlockedAtLevel: 3
  },
  {
    id: 'double_tap',
    name: 'Двойной шлёп',
    description: '+15 к силе тапа',
    baseCost: 800,
    costMultiplier: 1.18,
    effectValue: 15,
    type: 'tap',
    level: 0,
    icon: '⚡',
    unlockedAtLevel: 7
  },
  {
    id: 'crit_mastery',
    name: 'Критический фокус',
    description: '+3% шанс критического удара (x4 урона!)',
    baseCost: 2500,
    costMultiplier: 1.25,
    effectValue: 3, // +3% crit chance
    type: 'crit_chance',
    level: 0,
    icon: '🎯',
    unlockedAtLevel: 12
  },
  {
    id: 'laser_stylus',
    name: 'Лазерный стилус',
    description: '+80 к силе каждого нажатия',
    baseCost: 9500,
    costMultiplier: 1.20,
    effectValue: 80,
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
    name: 'Студент на энергетиках',
    description: '+140 монет/сек без сна и перерывов',
    baseCost: 15000,
    costMultiplier: 1.19,
    effectValue: 140,
    type: 'idle',
    level: 0,
    icon: '🥤',
    unlockedAtLevel: 20
  },
  {
    id: 'server_farm',
    name: 'Серверная ферма тапов',
    description: '+850 монет/сек круглосуточного майнинга',
    baseCost: 90000,
    costMultiplier: 1.21,
    effectValue: 850,
    type: 'idle',
    level: 0,
    icon: '🖥️',
    unlockedAtLevel: 35
  },
  {
    id: 'ai_cluster',
    name: 'Нейросетевой кластер',
    description: '+5,200 монет/сек глубокого обучения кликам',
    baseCost: 600000,
    costMultiplier: 1.23,
    effectValue: 5200,
    type: 'idle',
    level: 0,
    icon: '🧠',
    unlockedAtLevel: 55
  },
  {
    id: 'orbital_station',
    name: 'Орбитальная станция тапов',
    description: '+32,000 монет/сек со спутниковой орбиты',
    baseCost: 4200000,
    costMultiplier: 1.25,
    effectValue: 32000,
    type: 'idle',
    level: 0,
    icon: '🛰️',
    unlockedAtLevel: 80
  },
  {
    id: 'time_distortion_reactor',
    name: 'Хроно-реактор сингулярности',
    description: '+220,000 монет/сек из будущего',
    baseCost: 35000000,
    costMultiplier: 1.28,
    effectValue: 220000,
    type: 'idle',
    level: 0,
    icon: '⏳',
    unlockedAtLevel: 110
  }
];

export const DEFAULT_ARTIFACTS: Artifact[] = [
  {
    id: 'golden_slipper',
    name: 'Золотой Тапок Предков',
    description: '+10% ко всему доходу за каждый уровень',
    costGems: 10,
    bonusType: 'all_income',
    bonusValue: 0.10,
    level: 0,
    icon: '🥿'
  },
  {
    id: 'chronos_clock',
    name: 'Хроно-Компас Сна',
    description: '+20% к доходу в оффлайне',
    costGems: 15,
    bonusType: 'offline_rate',
    bonusValue: 0.20,
    level: 0,
    icon: '⏰'
  },
  {
    id: 'fever_totem',
    name: 'Тотем Лихорадки',
    description: '+3 сек к длительности режима Fever',
    costGems: 20,
    bonusType: 'fever_time',
    bonusValue: 3,
    level: 0,
    icon: '🔥'
  },
  {
    id: 'titan_hourglass',
    name: 'Песочные Часы Битвы',
    description: '+5 сек ко времени на битвах с боссами',
    costGems: 25,
    bonusType: 'boss_time',
    bonusValue: 5,
    level: 0,
    icon: '⌛'
  },
  {
    id: 'crit_dice',
    name: 'Кубик Фортуны',
    description: '+50% к критическому урону',
    costGems: 30,
    bonusType: 'crit_power',
    bonusValue: 0.50,
    level: 0,
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

export const LUCKY_WHEEL_ITEMS = [
  { id: 'w_skin_weekly', text: '🦸 СКИН НЕДЕЛИ!', type: 'weekly_skin', color: '#DC2626', rarity: 'mythic', weight: 1 },
  { id: 'w_gems_777', text: '💎 ДЖЕКПОТ 777💎', type: 'gems', amount: 777, color: '#9333EA', rarity: 'mythic', weight: 2 },
  { id: 'w_dark_matter', text: '🪐 ТЕМНАЯ МАТЕРИЯ x20', type: 'boost', amount: 5, multiplier: 20, color: '#4F46E5', rarity: 'legendary', weight: 4 },
  { id: 'w_coins_10m', text: '🪙 10 000 000 Монет', type: 'coins', amount: 10000000, color: '#D97706', rarity: 'legendary', weight: 5 },
  { id: 'w_perk_5', text: '✦ +5 Очков Навыков', type: 'perk_points', amount: 5, color: '#4338CA', rarity: 'legendary', weight: 5 },
  { id: 'w_respec_token', text: '🌀 Сброс Билда', type: 'respec_token', amount: 1, color: '#DB2777', rarity: 'epic', weight: 6 },
  { id: 'w_mega_frenzy', text: '⚡ x10 Ярость (15м)', type: 'boost', amount: 15, multiplier: 10, color: '#E11D48', rarity: 'epic', weight: 7 },
  { id: 'w_gems_150', text: '💎 150 Кристаллов', type: 'gems', amount: 150, color: '#7C3AED', rarity: 'epic', weight: 8 },
  { id: 'w_coins_2m', text: '🪙 2 000 000 Монет', type: 'coins', amount: 2000000, color: '#059669', rarity: 'epic', weight: 9 },
  { id: 'w_turbo_energy', text: '🚀 Турбо-Энергия x3', type: 'boost', amount: 30, multiplier: 3, color: '#0891B2', rarity: 'rare', weight: 10 },
  { id: 'w_gems_60', text: '💎 60 Кристаллов', type: 'gems', amount: 60, color: '#6D28D9', rarity: 'rare', weight: 12 },
  { id: 'w_coins_750k', text: '🪙 750 000 Монет', type: 'coins', amount: 750000, color: '#10B981', rarity: 'rare', weight: 14 },
  { id: 'w_free_spin', text: '🎡 +2 Спина', type: 'free_spins', amount: 2, color: '#2563EB', rarity: 'rare', weight: 12 },
  { id: 'w_gems_25', text: '💎 25 Кристаллов', type: 'gems', amount: 25, color: '#3B82F6', rarity: 'common', weight: 18 },
  { id: 'w_coins_250k', text: '🪙 250 000 Монет', type: 'coins', amount: 250000, color: '#14B8A6', rarity: 'common', weight: 20 },
  { id: 'w_coins_100k', text: '🪙 100 000 Монет', type: 'coins', amount: 100000, color: '#0D9488', rarity: 'common', weight: 25 },
];
