import { GameSaveData, SecretEvent } from '../types/game';
import { SECRET_EVENTS } from '../data/secretEvents';

export interface SecretUnlockResult {
  unlockedEvents: SecretEvent[];
  newGems: number;
  newPerkPoints: number;
  newHats: string[];
  newSkins: string[];
}

export function evaluateSecretEvents(saveData: GameSaveData): SecretUnlockResult {
  const alreadyUnlocked = new Set(saveData.unlockedSecretEvents || []);
  const newlyUnlocked: SecretEvent[] = [];

  let addedGems = 0;
  let addedPerkPoints = 0;
  const addedHats: string[] = [];
  const addedSkins: string[] = [];

  SECRET_EVENTS.forEach((event) => {
    if (alreadyUnlocked.has(event.id)) return;

    let isTriggered = false;

    switch (event.id) {
      case 'sec_first_step':
        if (saveData.totalTaps >= 1) isTriggered = true;
        break;
      case 'sec_hundred_club':
        if (saveData.totalTaps >= 100) isTriggered = true;
        break;
      case 'sec_thousand_storm':
        if (saveData.totalTaps >= 1000) isTriggered = true;
        break;
      case 'sec_fever_master':
        if (saveData.totalTaps >= 300) isTriggered = true;
        break;
      case 'sec_crit_god':
        if (saveData.totalTaps >= 500) isTriggered = true;
        break;
      case 'sec_golden_touch':
        if (saveData.totalCoinsEarned >= 50000) isTriggered = true;
        break;
      case 'sec_zen_moment':
        if (saveData.energy >= saveData.maxEnergy && saveData.totalTaps >= 50) isTriggered = true;
        break;
      case 'sec_night_tapper':
        {
          const hr = new Date().getHours();
          if (hr >= 0 && hr <= 5) isTriggered = true;
        }
        break;
      case 'sec_first_card':
        if (Object.keys(saveData.cards || {}).length >= 1) isTriggered = true;
        break;
      case 'sec_card_collector_5':
        if (Object.keys(saveData.cards || {}).length >= 5) isTriggered = true;
        break;
      case 'sec_dubai_tycoon':
        if ((saveData.cards['card_dubai_license'] || 0) > 0 || (saveData.cards['card_rolls_royce'] || 0) > 0) isTriggered = true;
        break;
      case 'sec_millionaire':
        if (saveData.totalCoinsEarned >= 1000000) isTriggered = true;
        break;
      case 'sec_first_deal_blood':
        if ((saveData.dealStats?.dealsWon || 0) >= 1) isTriggered = true;
        break;
      case 'sec_deal_shark_5':
        if ((saveData.dealStats?.dealsWon || 0) >= 5) isTriggered = true;
        break;
      case 'sec_deal_conqueror_10':
        if ((saveData.dealStats?.dealsWon || 0) >= 10) isTriggered = true;
        break;
      case 'sec_deal_penalty_loser':
        if ((saveData.dealStats?.penaltiesPaid || 0) >= 1) isTriggered = true;
        break;
      case 'sec_boss_slayer_1':
        if ((saveData.completedBosses?.length || 0) >= 1) isTriggered = true;
        break;
      case 'sec_boss_slayer_5':
        if ((saveData.completedBosses?.length || 0) >= 5) isTriggered = true;
        break;
      case 'sec_boss_slayer_10':
        if ((saveData.completedBosses?.length || 0) >= 10) isTriggered = true;
        break;
      case 'sec_boss_slayer_20':
        if ((saveData.completedBosses?.length || 0) >= 20) isTriggered = true;
        break;
      case 'sec_level_10':
        if (saveData.level >= 10) isTriggered = true;
        break;
      case 'sec_level_25':
        if (saveData.level >= 25) isTriggered = true;
        break;
      case 'sec_level_50':
        if (saveData.level >= 50) isTriggered = true;
        break;
      case 'sec_level_100':
        if (saveData.level >= 100) isTriggered = true;
        break;
      case 'sec_level_165_end':
        if (saveData.level >= 165) isTriggered = true;
        break;
      case 'sec_first_perk':
        if (Object.values(saveData.perks || {}).reduce((a, b) => a + b, 0) >= 1) isTriggered = true;
        break;
      case 'sec_titan_path':
        if ((saveData.perks['perk_muscle_hypertrophy'] || 0) > 0) isTriggered = true;
        break;
      case 'sec_archmage_path':
        if ((saveData.perks['perk_slime_mutation'] || 0) > 0 || (saveData.perks['perk_archmage_crystal'] || 0) > 0) isTriggered = true;
        break;
      case 'sec_samurai_path':
        if ((saveData.perks['perk_samurai_katana'] || 0) > 0) isTriggered = true;
        break;
      case 'sec_abyss_chaos':
        if ((saveData.perks['perk_skeleton_mutation'] || 0) > 0 || (saveData.perks['perk_abyss_scythe'] || 0) > 0) isTriggered = true;
        break;
      case 'sec_fashion_icon':
        if ((saveData.unlockedSkinIds?.length || 1) >= 3) isTriggered = true;
        break;
      case 'sec_hat_maniac':
        if ((saveData.unlockedHatIds?.length || 1) >= 4) isTriggered = true;
        break;
      case 'sec_seven_day_streak':
        if (saveData.dailyStreak >= 7) isTriggered = true;
        break;
      case 'sec_lucky_seven':
        if (saveData.coins >= 777) isTriggered = true;
        break;
      case 'sec_billionaire_whale':
        if (saveData.totalCoinsEarned >= 1000000000) isTriggered = true;
        break;
      case 'sec_secret_master_50':
        if (alreadyUnlocked.size >= 25) isTriggered = true;
        break;
      default:
        if (event.category === 'tap' && saveData.totalTaps >= event.index * 200) isTriggered = true;
        if (event.category === 'economy' && saveData.totalCoinsEarned >= event.index * 100000) isTriggered = true;
        if (event.category === 'combat' && (saveData.completedBosses?.length || 0) >= Math.floor(event.index / 2)) isTriggered = true;
        break;
    }

    if (isTriggered) {
      newlyUnlocked.push(event);
      if (event.rewardType === 'gems') {
        addedGems += Number(event.rewardValue) || 0;
      } else if (event.rewardType === 'perk_point') {
        addedPerkPoints += Number(event.rewardValue) || 0;
      } else if (event.rewardType === 'hat') {
        addedHats.push(String(event.rewardValue));
      } else if (event.rewardType === 'skin') {
        addedSkins.push(String(event.rewardValue));
      }
    }
  });

  return {
    unlockedEvents: newlyUnlocked,
    newGems: addedGems,
    newPerkPoints: addedPerkPoints,
    newHats: addedHats,
    newSkins: addedSkins,
  };
}
