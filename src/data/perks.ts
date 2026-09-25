export interface PerkDefinition {
  id: string;
  title: string;
  description: string;
  branch: 'str' | 'int' | 'dex' | 'fai' | 'chaos' | 'deal' | 'dubai_sheikh' | 'insider_trading' | 'tap' | 'idle' | 'synergy';
  icon: string;
  maxRank: number;
  requiredLevel: number;
  costPerRank: number;
  unlockedByCardId?: string;
  requiredPerkId?: string;
  statBonuses?: {
    str?: number;
    dex?: number;
    int?: number;
    vit?: number;
    lck?: number;
  };
  visualWeapon?: string;
  visualWeaponName?: string;
  visualBodyMutation?: 'muscle' | 'slime' | 'skeleton' | 'cyber' | 'normal';
  visualAura?: 'lightning' | 'gold' | 'cyber' | 'deal_fire' | 'zen' | 'blood' | 'magic';
  effectDescription: (rank: number) => string;
}

export const LEVEL_PERKS: PerkDefinition[] = [
  // =========================================================================
  // 1. ПУТЬ СИЛЫ (STRENGTH / БОДИБИЛДЕР / МУТАНТ-КАЧОК)
  // =========================================================================
  {
    id: 'perk_heavy_bones',
    title: 'Тяжелая Кость (STR I)',
    description: 'Утолщает суставы лап. Базовый урон каждого клика возрастает в разы.',
    branch: 'str',
    icon: '🦴',
    maxRank: 5,
    requiredLevel: 2,
    costPerRank: 1,
    statBonuses: { str: 3, vit: 1 },
    effectDescription: (rank) => `+${rank * 20}% к базовой силе тапа (STR +${rank * 3})`,
  },
  {
    id: 'perk_muscle_hypertrophy',
    title: 'Мышечная Мутация (Качок)',
    description: 'Трансформирует гладкое тело Капибарыча в рельефного мутанта-бодибилдера!',
    branch: 'str',
    icon: '💪',
    maxRank: 3,
    requiredLevel: 10,
    costPerRank: 2,
    requiredPerkId: 'perk_heavy_bones',
    statBonuses: { str: 6, vit: 4 },
    visualBodyMutation: 'muscle',
    visualAura: 'deal_fire',
    effectDescription: (rank) => `+${rank * 35}% силы тапа и устрашающая мускулатура (STR +${rank * 6})`,
  },
  {
    id: 'perk_colossal_sword',
    title: 'Колоссальный Двуручник',
    description: 'В лапах Капибарыча появляется чудовищный клинок из черной стали.',
    branch: 'str',
    icon: '⚔️',
    maxRank: 3,
    requiredLevel: 25,
    costPerRank: 2,
    requiredPerkId: 'perk_muscle_hypertrophy',
    statBonuses: { str: 10, vit: 2 },
    visualWeapon: '⚔️',
    visualWeaponName: 'Колоссальный Двуручник',
    effectDescription: (rank) => `+${rank * 50}% к урону по боссам и в Сделках`,
  },
  {
    id: 'perk_berserker_rage',
    title: 'Ярость Титана Бездны',
    description: 'При падении энергии ниже 30% сила клика утраивается.',
    branch: 'str',
    icon: '🌋',
    maxRank: 3,
    requiredLevel: 50,
    costPerRank: 3,
    requiredPerkId: 'perk_colossal_sword',
    statBonuses: { str: 15, vit: 5 },
    visualAura: 'deal_fire',
    effectDescription: (rank) => `+${rank * 100}% урона в критических ситуациях`,
  },

  // =========================================================================
  // 2. ПУТЬ МАГИИ & ЭФИРА (INTELLIGENCE / ПОСОХ / МУТАЦИЯ СЛИЗИ)
  // =========================================================================
  {
    id: 'perk_ether_spark',
    title: 'Искры Эфира (INT I)',
    description: 'Разум Капибарыча настраивается на квантовые потоки крипто-магии.',
    branch: 'int',
    icon: '✨',
    maxRank: 5,
    requiredLevel: 3,
    costPerRank: 1,
    statBonuses: { int: 3, lck: 1 },
    effectDescription: (rank) => `+${rank * 15}% к крит-шансу и силе заклинаний (INT +${rank * 3})`,
  },
  {
    id: 'perk_wooden_staff',
    title: 'Посох Ученика Магии',
    description: 'Капибарыч берет в лапу древний деревянный посох, направляющий магические импульсы.',
    branch: 'int',
    icon: '🪄',
    maxRank: 3,
    requiredLevel: 12,
    costPerRank: 2,
    requiredPerkId: 'perk_ether_spark',
    statBonuses: { int: 5, str: 1 },
    visualWeapon: '🪄',
    visualWeaponName: 'Посох Ученика',
    visualAura: 'magic',
    effectDescription: (rank) => `Критические удары вызывают взрыв магии (+${rank * 40}%)`,
  },
  {
    id: 'perk_slime_mutation',
    title: 'Мутация Слизи Бездны',
    description: 'Капибара растворяет физическую оболочку, становясь пульсирующей фиолетовой Слизью!',
    branch: 'int',
    icon: '🧪',
    maxRank: 3,
    requiredLevel: 28,
    costPerRank: 2,
    requiredPerkId: 'perk_wooden_staff',
    statBonuses: { int: 8, vit: 5 },
    visualBodyMutation: 'slime',
    visualAura: 'magic',
    effectDescription: (rank) => `Тело из слизи поглощает 50% усталости (Реген энергии +${rank * 25}%)`,
  },
  {
    id: 'perk_archmage_crystal',
    title: 'Хрустальный Шпиль Архимага',
    description: 'Посох обращается в могущественную Хрустальную Сферу Затмения.',
    branch: 'int',
    icon: '🔮',
    maxRank: 3,
    requiredLevel: 55,
    costPerRank: 3,
    requiredPerkId: 'perk_slime_mutation',
    statBonuses: { int: 15, lck: 5 },
    visualWeapon: '🔮',
    visualWeaponName: 'Сфера Архимага',
    visualAura: 'magic',
    effectDescription: (rank) => `Крит-множитель увеличивается на +${rank * 1.5}x`,
  },

  // =========================================================================
  // 3. ПУТЬ ЛОВКОСТИ & ТЕНЕЙ (DEXTERITY / САМУРАЙ / КАТАНА)
  // =========================================================================
  {
    id: 'perk_swift_claws',
    title: 'Быстрые Лапы (DEX I)',
    description: 'Сухожилия становятся гибкими, как шелковые нити. Скорость тапа поражает.',
    branch: 'dex',
    icon: '💨',
    maxRank: 5,
    requiredLevel: 4,
    costPerRank: 1,
    statBonuses: { dex: 3, lck: 1 },
    effectDescription: (rank) => `+${rank * 15}% к частоте кликов и скорости Лихорадки`,
  },
  {
    id: 'perk_samurai_katana',
    title: 'Катана Теневого Самурая',
    description: 'Острейшая катана из лунной стали украшает лапы Капибарыча.',
    branch: 'dex',
    icon: '🗡️',
    maxRank: 3,
    requiredLevel: 15,
    costPerRank: 2,
    requiredPerkId: 'perk_swift_claws',
    statBonuses: { dex: 7, str: 2 },
    visualWeapon: '🗡️',
    visualWeaponName: 'Катана Самурая',
    visualAura: 'lightning',
    effectDescription: (rank) => `В Сделках каждый клик наносит +${rank * 20}% урона катаной`,
  },
  {
    id: 'perk_shadow_step',
    title: 'Танец Теней',
    description: 'Капибара растворяется в дымке и наносит серию призрачных ударов.',
    branch: 'dex',
    icon: '🥷',
    maxRank: 3,
    requiredLevel: 35,
    costPerRank: 2,
    requiredPerkId: 'perk_samurai_katana',
    statBonuses: { dex: 10, int: 3 },
    effectDescription: (rank) => `+${rank * 8}% шанс совершить двойной удар в Сделке`,
  },
  {
    id: 'perk_wind_slash',
    title: 'Разрез Небесного Ветра',
    description: 'Высшее искусство владения клинком рассекает даже блокчейн-транзакции.',
    branch: 'dex',
    icon: '🌪️',
    maxRank: 3,
    requiredLevel: 60,
    costPerRank: 3,
    requiredPerkId: 'perk_shadow_step',
    statBonuses: { dex: 15, lck: 4 },
    visualAura: 'lightning',
    effectDescription: (rank) => `Умножает боевой рейтинг в Сделке на +${rank * 30}%`,
  },

  // =========================================================================
  // 4. ПУТЬ ВЕРЫ & ИЗОБИЛИЯ (FAITH / ЗОЛОТО / ШЕЙХ / СКИПЕТР)
  // =========================================================================
  {
    id: 'perk_sacred_zen',
    title: 'Священный Дзен (FAI I)',
    description: 'Внутреннее спокойствие капибары притягивает богатство вселенной.',
    branch: 'fai',
    icon: '🧘',
    maxRank: 5,
    requiredLevel: 6,
    costPerRank: 1,
    statBonuses: { vit: 2, lck: 2 },
    visualAura: 'zen',
    effectDescription: (rank) => `+${rank * 15}% к пассивному доходу в час (FAI +${rank * 3})`,
  },
  {
    id: 'perk_golden_scepter',
    title: 'Золотой Скипетр Владыки',
    description: 'В лапах сияет скипетр из чистого дубайского золота с сапфиром.',
    branch: 'fai',
    icon: '🔱',
    maxRank: 3,
    requiredLevel: 20,
    costPerRank: 2,
    requiredPerkId: 'perk_sacred_zen',
    statBonuses: { lck: 8, vit: 4 },
    visualWeapon: '🔱',
    visualWeaponName: 'Золотой Скипетр',
    visualAura: 'gold',
    effectDescription: (rank) => `Все золотые куши увеличиваются в +${rank * 5} раз`,
  },
  {
    id: 'perk_faith_shield',
    title: 'Купол Защиты Сделки',
    description: 'Священная аура сглаживает поражения в Сделках, сохраняя часть капитала.',
    branch: 'fai',
    icon: '🛡️',
    maxRank: 3,
    requiredLevel: 40,
    costPerRank: 2,
    requiredPerkId: 'perk_golden_scepter',
    statBonuses: { vit: 8, lck: 5 },
    effectDescription: (rank) => `При поражении в Сделке возвращает ${rank * 10}% монет`,
  },

  // =========================================================================
  // 5. ПУТЬ СКВЕРНЫ & ХАОСА (CHAOS / БЕЗДНА / МУТАЦИЯ СКЕЛЕТА)
  // =========================================================================
  {
    id: 'perk_chaos_blood',
    title: 'Оскверненная Кровь (CHAOS I)',
    description: 'Капибара испила первородный хаос Бездны. Дикая мощь взамен на риск.',
    branch: 'chaos',
    icon: '🩸',
    maxRank: 5,
    requiredLevel: 15,
    costPerRank: 1,
    statBonuses: { str: 4, int: 4 },
    visualAura: 'blood',
    effectDescription: (rank) => `+${rank * 25}% к урону, но +${rank * 5}% расход энергии`,
  },
  {
    id: 'perk_skeleton_mutation',
    title: 'Скелетный Остов Бездны',
    description: 'Плоть уступает место вечному призрачному костяку некроманта.',
    branch: 'chaos',
    icon: '💀',
    maxRank: 3,
    requiredLevel: 32,
    costPerRank: 2,
    requiredPerkId: 'perk_chaos_blood',
    statBonuses: { str: 7, int: 7 },
    visualBodyMutation: 'skeleton',
    visualAura: 'blood',
    effectDescription: (rank) => `Бессмертный скелет: критический урон увеличен на +${rank * 45}%`,
  },
  {
    id: 'perk_abyss_scythe',
    title: 'Коса Жнеца Бездны',
    description: 'Зловещая коса срезает жизни боссов и сопротивление игроков в Сделках.',
    branch: 'chaos',
    icon: '🪓',
    maxRank: 3,
    requiredLevel: 65,
    costPerRank: 3,
    requiredPerkId: 'perk_skeleton_mutation',
    statBonuses: { str: 12, int: 12 },
    visualWeapon: '🪓',
    visualWeaponName: 'Коса Бездны',
    visualAura: 'blood',
    effectDescription: (rank) => `В Сделках противник теряет устойчивость на +${rank * 20}% быстрее`,
  },

  // =========================================================================
  // 6. СПЕЦИАЛЬНЫЕ ВЕТКИ ИЗ КАРТОЧЕК ШАХТЫ (ШЕЙХ & ИНСАЙДЕР)
  // =========================================================================
  {
    id: 'perk_sheikh_fountain',
    title: 'Золотой Фонтан DMCC',
    description: 'Открыт карточкой «Лицензия в Дубае». Фонтан монет бьет без остановки.',
    branch: 'dubai_sheikh',
    icon: '🏙️',
    maxRank: 5,
    requiredLevel: 30,
    costPerRank: 2,
    unlockedByCardId: 'card_dubai_license',
    statBonuses: { lck: 10, vit: 5 },
    visualAura: 'gold',
    effectDescription: (rank) => `+${rank * 30}% к пассивному доходу всех карточек`,
  },
  {
    id: 'perk_insider_whale_call',
    title: 'Инсайдерский Сигнал',
    description: 'Открыт карточкой «Инсайдерский Слив». Позволяет предвидеть движения рынка.',
    branch: 'insider_trading',
    icon: '🕵️',
    maxRank: 5,
    requiredLevel: 50,
    costPerRank: 2,
    unlockedByCardId: 'card_insider_intel',
    statBonuses: { int: 8, lck: 8 },
    effectDescription: (rank) => `+${rank * 25}% к шансу и размеру Золотого Пельменя`,
  },
];
