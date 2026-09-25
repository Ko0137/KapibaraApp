import { CustomCapybaraConfig } from '../types/game';

export interface FurColorOption {
  id: string;
  name: string;
  hex: string;
  gradient: string;
  icon: string;
  description: string;
}

export const FUR_COLOR_OPTIONS: FurColorOption[] = [
  {
    id: 'walnut',
    name: 'Ореховый Дзен',
    hex: '#8D5524',
    gradient: 'from-[#A76D38] via-[#8D5524] to-[#5C3317]',
    icon: '🦫',
    description: 'Натуральная шелковистая шерсть классической капибары.',
  },
  {
    id: 'chocolate',
    name: 'Темный Шоколад',
    hex: '#3E1C0A',
    gradient: 'from-[#5C2E17] via-[#3E1C0A] to-[#251006]',
    icon: '🍫',
    description: 'Глубокий шоколадный оттенок альфа-капибары.',
  },
  {
    id: 'albino',
    name: 'Ледяной Альбинос',
    hex: '#F0F4F8',
    gradient: 'from-[#FFFFFF] via-[#E2E8F0] to-[#CBD5E1]',
    icon: '❄️',
    description: 'Редчайшая белоснежная шерсть с серебристым отливом.',
  },
  {
    id: 'gold_bar',
    name: 'Золотой Слиток',
    hex: '#F59E0B',
    gradient: 'from-[#FDE047] via-[#F59E0B] to-[#B45309]',
    icon: '👑',
    description: 'Шерсть из чистого 24-каратного золота магната.',
  },
  {
    id: 'lava_red',
    name: 'Багровая Лава',
    hex: '#DC2626',
    gradient: 'from-[#EF4444] via-[#DC2626] to-[#991B1B]',
    icon: '🌋',
    description: 'Пылающий вулканический мех ярости.',
  },
  {
    id: 'neon_cyber',
    name: 'Неоновый Киберпанк',
    hex: '#10B981',
    gradient: 'from-[#34D399] via-[#10B981] to-[#047857]',
    icon: '🧪',
    description: 'Биолюминесцентная шерсть с подсветкой Найт-Сити.',
  },
  {
    id: 'pink_punk',
    name: 'Розовый Панк',
    hex: '#EC4899',
    gradient: 'from-[#F472B6] via-[#EC4899] to-[#BE185D]',
    icon: '🌸',
    description: 'Бунтарский яркий стиль для взрывных комбо.',
  },
  {
    id: 'void_purple',
    name: 'Космическая Пустота',
    hex: '#6366F1',
    gradient: 'from-[#818CF8] via-[#6366F1] to-[#3730A3]',
    icon: '🌌',
    description: 'Звездная материя Бездны, мерцающая созвездиями.',
  },
];

export interface HairStyleOption {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
}

export const HAIR_STYLE_OPTIONS: HairStyleOption[] = [
  {
    id: 'smooth',
    name: 'Гладкая Классика (Дзен)',
    icon: '🧘',
    badge: 'Классика',
    description: 'Идеально гладкая макушка для купания в горячих онсэнах.',
  },
  {
    id: 'mohawk',
    name: 'Рокерский Ирокез',
    icon: '🎸',
    badge: 'Панк',
    description: 'Дерзкий ирокез, заряженный энергией ярости.',
  },
  {
    id: 'gentleman',
    name: 'Пробор Джентльмена',
    icon: '🎩',
    badge: 'Аристократ',
    description: 'Элегантная укладка с воском для закрытия крупных сделок.',
  },
  {
    id: 'dreadlocks',
    name: 'Дреды Раста-Чилл',
    icon: '🌴',
    badge: 'Регги',
    description: 'Максимальный чилл, релакс и невозмутимость.',
  },
  {
    id: 'anime_bangs',
    name: 'Аниме-Чёлка Сёнен',
    icon: '⚡',
    badge: 'Аниме',
    description: 'Развевающаяся чёлка главного героя аниме.',
  },
  {
    id: 'samurai_bun',
    name: 'Самурайский Пучок',
    icon: '🥷',
    badge: 'Шиноби',
    description: 'Традиционная прическа ронина с острой заколкой.',
  },
  {
    id: 'royal_curls',
    name: 'Королевские Локоны',
    icon: '👑',
    badge: 'Монарх',
    description: 'Пышные кудри короля капибар.',
  },
];

export interface TeethOption {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
}

export const TEETH_OPTIONS: TeethOption[] = [
  {
    id: 'classic',
    name: 'Крепкие Резцы (Классик)',
    icon: '🦫',
    badge: 'База',
    description: 'Идеальные резцы для перекусывания золотых монет и бамбука.',
  },
  {
    id: 'gold_grillz',
    name: 'Золотые Гриллзы 24K',
    icon: '🦷',
    badge: 'Хип-Хоп',
    description: 'Сияющая золотая челюсть настоящего рэп-магната.',
  },
  {
    id: 'vampire_fangs',
    name: 'Вампирские Клыки',
    icon: '🧛',
    badge: 'Кровь',
    description: 'Острые клыки для вампиризма монет в PvP Сделках.',
  },
  {
    id: 'saber_tusks',
    name: 'Саблезубые Бивни',
    icon: '🦣',
    badge: 'Хищник',
    description: 'Древние бивни мамонта, сокрушающие боссов.',
  },
  {
    id: 'cyber_neon',
    name: 'Хромированные Клыки',
    icon: '🦾',
    badge: 'Кибер',
    description: 'Титановые зубы с неоновой подсветкой.',
  },
];

export interface EyeOption {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
}

export const EYE_OPTIONS: EyeOption[] = [
  {
    id: 'zen',
    name: 'Абсолютный Дзен',
    icon: '😌',
    badge: 'Чилл',
    description: 'Спокойный умиротворенный взгляд владыки биржи.',
  },
  {
    id: 'fierce',
    name: 'Боевой Прищур Берсерка',
    icon: '😈',
    badge: 'Атака',
    description: 'Горящий яростью взор перед сокрушительной серией ударов.',
  },
  {
    id: 'laser_eye',
    name: 'Крипто-Лазерный Глаз',
    icon: '🔴',
    badge: 'Биткоин',
    description: 'Красный лазерный прицел для поиска выгодных курсов.',
  },
  {
    id: 'third_eye',
    name: 'Третий Глаз Просветления',
    icon: '👁️',
    badge: 'Мистика',
    description: 'Видит скрытые секретные события и будущее рынка.',
  },
  {
    id: 'shades',
    name: 'Черные Очки Thug Life',
    icon: '🕶️',
    badge: 'Босс',
    description: 'Легендарные пиксельные очки крипто-миллиардера.',
  },
];

export const DEFAULT_CUSTOM_CAPYBARA: CustomCapybaraConfig = {
  furColor: 'walnut',
  furColorHex: '#8D5524',
  furColorName: 'Ореховый Дзен',
  hairStyle: 'smooth',
  hairStyleName: 'Гладкая Классика (Дзен)',
  hairStyleIcon: '🧘',
  teethStyle: 'classic',
  teethStyleName: 'Крепкие Резцы (Классик)',
  teethStyleIcon: '🦫',
  eyeStyle: 'zen',
  eyeStyleName: 'Абсолютный Дзен',
  eyeStyleIcon: '😌',
  initialSetupDone: false,
};
