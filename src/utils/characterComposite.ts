import { CharacterSkin, CharacterHat } from '../types/game';
import { LEVEL_PERKS, PerkDefinition } from '../data/perks';

export interface SoulslikeStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
  lck: number;
  archetypeTitle: string;
  archetypeDesc: string;
  activeWeapon?: string;
  activeWeaponName?: string;
  bodyMutation?: 'muscle' | 'slime' | 'skeleton' | 'cyber' | 'divine' | 'immortal' | 'normal';
  activeAura?: string;
  dealPvPPower: number;
  critMultiplierFormatted: string;
  tier: 'mortal' | 'divine' | 'immortal';
  divineWings?: boolean;
  immortalAura?: boolean;
  // Stat calculations
  tapPowerMultiplier: number;
  critChance: number;
  idleBonusPercent: number;
  energyRegenBonusPercent: number;
  // Dynamic visual mutation layers
  isMuscular: boolean;
  muscleLevel: number;
  hasSpeedSparks: boolean;
  hasMagicRunes: boolean;
  hasTitanArmor: boolean;
  hasSheikhGold: boolean;
  hasSymbioteAura: boolean;
}

export function computeCharacterComposite(
  skin: CharacterSkin,
  hat: CharacterHat,
  purchasedPerks: Record<string, number>,
  playerLevel: number = 1,
  immortalUnlocked: boolean = false
): SoulslikeStats {
  let str = 10;
  let dex = 10;
  let int = 10;
  let vit = 10;
  let lck = 10;

  // Determine Class Tier
  let tier: 'mortal' | 'divine' | 'immortal' = 'mortal';
  if (playerLevel > 265 || immortalUnlocked) {
    tier = 'immortal';
  } else if (playerLevel > 165) {
    tier = 'divine';
  }

  // Tier base stat amplifications
  if (tier === 'divine') {
    str += 50; dex += 50; int += 50; vit += 50; lck += 50;
  } else if (tier === 'immortal') {
    str += 150; dex += 150; int += 150; vit += 150; lck += 150;
  }

  // Skin base stat inclinations
  if (skin.id === 'skin_muscle_mutant') str += 25;
  if (skin.id === 'skin_toxic_ooze') int += 20;
  if (skin.id === 'skin_samurai_capy') dex += 22;
  if (skin.id === 'skin_sheikh_capy') lck += 25;
  if (skin.id === 'skin_cyber_capy') { str += 12; dex += 14; vit += 12; }
  if (skin.id === 'skin_god_capy') { str += 35; dex += 35; int += 35; vit += 35; lck += 35; }
  
  // Secret Superhero Skin Inclinations
  if (skin.id === 'skin_assassin_capy') { dex += 30; str += 15; }
  if (skin.id === 'skin_cyberpunk_2077') { dex += 35; int += 20; vit += 15; }
  if (skin.id === 'skin_witcher_capy') { str += 25; int += 25; dex += 20; }
  if (skin.id === 'skin_spider_capy') { dex += 40; vit += 20; }
  if (skin.id === 'skin_wolverine_capy') { str += 45; vit += 30; }
  if (skin.id === 'skin_deadpool_capy') { str += 30; dex += 30; vit += 35; }
  if (skin.id === 'skin_batman_capy') { str += 30; int += 40; lck += 50; }
  if (skin.id === 'skin_iron_capy') { int += 45; str += 35; vit += 30; }
  if (skin.id === 'skin_thor_capy') { str += 50; int += 30; vit += 30; }
  if (skin.id === 'skin_joker_capy') { lck += 60; int += 25; }
  if (skin.id === 'skin_dr_strange_capy') { int += 60; dex += 20; }
  if (skin.id === 'skin_venom_capy') { str += 50; vit += 40; }

  // Hat bonuses
  if (hat.id === 'hat_shades') dex += 5;
  if (hat.id === 'hat_citrus') vit += 5;
  if (hat.id === 'hat_cylinder') lck += 6;
  if (hat.id === 'hat_crown') { str += 4; lck += 8; }
  if (hat.id === 'hat_archmage_hood') int += 12;
  if (hat.id === 'hat_demon_horns') { str += 10; int += 10; }
  if (hat.id === 'hat_zen_lotus') vit += 10;
  if (hat.id === 'hat_deal_crown') { str += 8; dex += 8; }
  if (hat.id === 'hat_galaxy_halo' || hat.id === 'hat_cosmic_crown') {
    str += 20; dex += 20; int += 20; vit += 20; lck += 20;
  }

  // Active weapon & body mutation determined by invested Soulslike perks
  let activeWeapon: string | undefined = undefined;
  let activeWeaponName: string | undefined = undefined;
  let bodyMutation: 'muscle' | 'slime' | 'skeleton' | 'cyber' | 'divine' | 'immortal' | 'normal' = 
    tier === 'immortal' ? 'immortal' : (tier === 'divine' ? 'divine' : 'normal');
  let activeAura: string | undefined = tier === 'immortal' ? 'immortal_void' : (tier === 'divine' ? 'divine_light' : undefined);

  // Superhero default weapons if not overridden by perk
  if (skin.id === 'skin_witcher_capy') { activeWeapon = '⚔️'; activeWeaponName = 'Два Ведьмачьих Клинка'; }
  else if (skin.id === 'skin_assassin_capy') { activeWeapon = '🗡️'; activeWeaponName = 'Скрытый Клинок Ассасина'; }
  else if (skin.id === 'skin_wolverine_capy') { activeWeapon = '🐾'; activeWeaponName = 'Адамантиевые Когти'; }
  else if (skin.id === 'skin_deadpool_capy') { activeWeapon = '⚔️'; activeWeaponName = 'Парные Катаны Дэдпула'; }
  else if (skin.id === 'skin_spider_capy') { activeWeapon = '🕸️'; activeWeaponName = 'Паутинный Шутер'; }
  else if (skin.id === 'skin_thor_capy') { activeWeapon = '🔨'; activeWeaponName = 'Молот Мьёльнир'; }
  else if (skin.id === 'skin_batman_capy') { activeWeapon = '🦇'; activeWeaponName = 'Теневой Бэтаранг'; }
  else if (skin.id === 'skin_iron_capy') { activeWeapon = '💥'; activeWeaponName = 'Плазменный Репульсор'; }
  else if (skin.id === 'skin_dr_strange_capy') { activeWeapon = '🔮'; activeWeaponName = 'Око Агамотто'; }
  else if (skin.id === 'skin_joker_capy') { activeWeapon = '🃏'; activeWeaponName = 'Взрывная Колода Карточек'; }
  else if (skin.id === 'skin_venom_capy') { activeWeapon = '🖤'; activeWeaponName = 'Щупальца Симбиота'; }

  for (const perk of LEVEL_PERKS) {
    const rank = purchasedPerks[perk.id] || 0;
    if (rank > 0) {
      if (perk.statBonuses) {
        str += (perk.statBonuses.str || 0) * rank;
        dex += (perk.statBonuses.dex || 0) * rank;
        int += (perk.statBonuses.int || 0) * rank;
        vit += (perk.statBonuses.vit || 0) * rank;
        lck += (perk.statBonuses.lck || 0) * rank;
      }
      if (perk.visualWeapon) {
        activeWeapon = perk.visualWeapon;
        activeWeaponName = perk.visualWeaponName;
      }
      if (perk.visualBodyMutation && tier === 'mortal') {
        bodyMutation = perk.visualBodyMutation;
      }
      if (perk.visualAura && tier === 'mortal') {
        activeAura = perk.visualAura;
      }
    }
  }

  // Calculate dynamic mutation triggers (Lowered thresholds so EVERY level & build diode alters appearance!)
  const isMuscular = str >= 15 || bodyMutation === 'muscle' || (purchasedPerks['perk_muscle_hypertrophy'] || 0) > 0 || skin.id === 'skin_muscle_mutant' || skin.id === 'skin_wolverine_capy';
  const muscleLevel = str >= 80 ? 3 : (str >= 40 ? 2 : (isMuscular ? 1 : 0));
  const hasSpeedSparks = dex >= 15 || (purchasedPerks['perk_lightning_fingers'] || 0) > 0 || skin.id === 'skin_cyberpunk_2077' || skin.id === 'skin_spider_capy' || skin.id === 'skin_thor_capy';
  const hasMagicRunes = int >= 15 || (purchasedPerks['perk_archmage_crystal'] || 0) > 0 || skin.id === 'skin_dr_strange_capy' || skin.id === 'skin_toxic_ooze';
  const hasTitanArmor = vit >= 15 || (purchasedPerks['perk_heavy_bones'] || 0) >= 1 || skin.id === 'skin_iron_capy';
  const hasSheikhGold = lck >= 15 || (purchasedPerks['perk_sheikh_wealth'] || 0) > 0 || skin.id === 'skin_sheikh_capy' || skin.id === 'skin_batman_capy';
  const hasSymbioteAura = skin.id === 'skin_venom_capy' || (purchasedPerks['perk_chaos_blood'] || 0) > 0;

  // Level Progression Rank Title
  let levelRankTitle = '🦫 Дзен-Новичок (Ранг I)';
  if (playerLevel > 165) levelRankTitle = '🌌 Бессмертный Абсолют (Ранг VII)';
  else if (playerLevel > 100) levelRankTitle = '✨ Божественный Серафим (Ранг VI)';
  else if (playerLevel > 75) levelRankTitle = '👑 Легендарный Титан (Ранг V)';
  else if (playerLevel > 50) levelRankTitle = '🔥 Теневой Лорд (Ранг IV)';
  else if (playerLevel > 25) levelRankTitle = '🛡️ Стальной Магнат (Ранг III)';
  else if (playerLevel > 10) levelRankTitle = '⚡ Искатель Эфира (Ранг II)';

  // Calculate Archetype Title
  let archetypeTitle = levelRankTitle;
  let archetypeDesc = 'Базовый путь невозмутимости и спокойных инвестиций.';

  const highest = Math.max(str, dex, int, vit, lck);
  if (tier === 'immortal') {
    archetypeTitle = '🌌 БЕССМЕРТНЫЙ АБСОЛЮТ ПУСТОТЫ';
    archetypeDesc = 'Повелевает тканью пространства и времени. Абсолютная неуязвимость и космический урон.';
  } else if (tier === 'divine') {
    archetypeTitle = '✨ БОЖЕСТВЕННЫЙ СЕРАФИМ ЭФИРА';
    archetypeDesc = 'Преодолел смертные пределы. Сияние чистого золота и сверхзвуковые клики.';
  } else if (skin.universe === 'marvel' || skin.universe === 'dc') {
    archetypeTitle = `🦸 Сверхгерой: ${skin.name}`;
    archetypeDesc = skin.description;
  } else if (isMuscular && highest === str) {
    archetypeTitle = '💪 Капибара-Бодибилдер Колосс';
    archetypeDesc = 'Гора рельефных мышц и сокрушительный удар в Сделках.';
  } else if (hasSpeedSparks && highest === dex) {
    archetypeTitle = '⚡ Скоростной Ниндзя Молний';
    archetypeDesc = 'Молниеносная реакция и непревзойденный темп кликов.';
  } else if (hasMagicRunes && highest === int) {
    archetypeTitle = '🔮 Архимаг Квантового Эфира';
    archetypeDesc = 'Древние руны и сокрушительный критический урон.';
  } else if (hasTitanArmor && highest === vit) {
    archetypeTitle = '🛡️ Несокрушимый Титан';
    archetypeDesc = 'Титаническая защита, выдерживающая любые штрафы и кризисы.';
  } else if (hasSheikhGold && highest === lck) {
    archetypeTitle = '🔱 Золотой Магнат Вселенной';
    archetypeDesc = 'Притягивает миллиардные куши и золотые пельмени.';
  }

  // Deal PvP Power Rating
  const tierMultiplier = tier === 'immortal' ? 3.5 : (tier === 'divine' ? 2.0 : 1.0);
  const dealPvPPower = Math.round(
    (str * 2.5 + dex * 2.0 + int * 1.5 + vit * 1.8 + lck * 1.2) * tierMultiplier
  );

  const critMult = (2 + int * 0.05 + dex * 0.03 + (tier === 'immortal' ? 4 : (tier === 'divine' ? 2 : 0))).toFixed(1);

  return {
    str,
    dex,
    int,
    vit,
    lck,
    archetypeTitle,
    archetypeDesc,
    activeWeapon,
    activeWeaponName,
    bodyMutation,
    activeAura,
    dealPvPPower,
    critMultiplierFormatted: `${critMult}x`,
    tier,
    divineWings: tier === 'divine' || tier === 'immortal',
    immortalAura: tier === 'immortal',
    tapPowerMultiplier: 1 + str * 0.05 + (skin.bonusType === 'tap_power' ? skin.bonusValue : 0),
    critChance: Math.min(0.75, 0.10 + dex * 0.008 + (skin.bonusType === 'crit' ? skin.bonusValue : 0)),
    idleBonusPercent: int * 0.02 + (skin.bonusType === 'idle_income' ? skin.bonusValue : 0),
    energyRegenBonusPercent: vit * 0.025 + (skin.bonusType === 'energy_regen' ? skin.bonusValue : 0),
    isMuscular,
    muscleLevel,
    hasSpeedSparks,
    hasMagicRunes,
    hasTitanArmor,
    hasSheikhGold,
    hasSymbioteAura,
  };
}

export function getCompositeAvatarDisplay(
  skin: CharacterSkin,
  hat: CharacterHat,
  stats: SoulslikeStats
): {
  bodyIcon: string;
  weaponIcon?: string;
  hatIcon?: string;
  auraCss: string;
  wingsIcon?: string;
  haloIcon?: string;
  muscleIcon?: string;
  lightningIcon?: string;
  magicIcon?: string;
  armorIcon?: string;
} {
  // We keep the skin icon as the base body! (e.g. 🦫, 🦅, 🦾, 🐺, 🕷️, 🐾, 🔴, 🦇, 🤖, ⚡, 🃏, 🔮, 🖤)
  const bodyIcon = skin.icon || '🦫';
  const weaponIcon = stats.activeWeapon;
  const hatIcon = hat.id !== 'hat_none' ? hat.icon : undefined;

  let wingsIcon = stats.tier === 'immortal' ? '🪐' : (stats.tier === 'divine' ? '🪽' : undefined);
  let haloIcon = stats.tier === 'immortal' ? '🌀' : (stats.tier === 'divine' ? '✨' : undefined);

  // Muscle badge / flexing overlay
  const muscleIcon = stats.isMuscular ? (stats.muscleLevel >= 3 ? '💥💪' : '💪') : undefined;
  const lightningIcon = stats.hasSpeedSparks ? '⚡' : undefined;
  const magicIcon = stats.hasMagicRunes ? '🔮' : undefined;
  const armorIcon = stats.hasTitanArmor ? '🛡️' : undefined;

  let auraCss = 'from-amber-500/20 to-yellow-500/20';
  if (stats.tier === 'immortal') {
    auraCss = 'from-purple-900/70 via-indigo-700/60 to-cyan-500/50 animate-pulse border border-cyan-400/40 shadow-lg shadow-purple-500/50';
  } else if (stats.tier === 'divine') {
    auraCss = 'from-amber-400/60 via-yellow-300/50 to-amber-200/50 animate-pulse border border-yellow-300/60 shadow-lg shadow-amber-400/50';
  } else if (stats.hasSymbioteAura) {
    auraCss = 'from-zinc-950 via-purple-950 to-red-950 animate-pulse border border-purple-500/50';
  } else if (stats.activeAura === 'deal_fire' || stats.isMuscular) {
    auraCss = 'from-red-600/40 via-orange-500/30 to-rose-600/40 animate-pulse';
  } else if (stats.activeAura === 'magic' || stats.hasMagicRunes) {
    auraCss = 'from-purple-600/40 via-cyan-500/30 to-indigo-600/40 animate-pulse';
  } else if (stats.activeAura === 'lightning' || stats.hasSpeedSparks) {
    auraCss = 'from-cyan-400/40 via-blue-500/30 to-amber-400/30 animate-pulse';
  } else if (stats.activeAura === 'gold' || stats.hasSheikhGold) {
    auraCss = 'from-yellow-400/50 via-amber-500/40 to-yellow-200/40 animate-pulse';
  } else if (stats.activeAura === 'blood') {
    auraCss = 'from-red-900/60 via-crimson-600/50 to-rose-950/60 animate-pulse';
  } else if (stats.activeAura === 'zen') {
    auraCss = 'from-emerald-500/30 via-teal-500/30 to-cyan-500/30';
  }

  return {
    bodyIcon,
    weaponIcon,
    hatIcon,
    auraCss,
    wingsIcon,
    haloIcon,
    muscleIcon,
    lightningIcon,
    magicIcon,
    armorIcon
  };
}

