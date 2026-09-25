import { HamsterCard } from '../types/game';

/**
 * Calculates the exact cost to upgrade an investment card.
 * Progressive scaling:
 * 1. Exponential card level multiplier (baseCost * multiplier^level)
 * 2. Progressive Player Level scaling: as the player ascends levels (especially towards 165+ and beyond),
 *    costs scale higher to prevent trivial maxing out and demand strategic economy management.
 */
export function getCardUpgradeCost(
  card: HamsterCard,
  currentCardLevel: number,
  playerLevel: number = 1
): number {
  // 1. Base card cost
  const baseCost = card.baseCost;

  // 2. Card rank multiplier (steep after rank 5)
  const rankFactor = Math.pow(card.costMultiplier, currentCardLevel) * 
    Math.pow(1.04, Math.max(0, currentCardLevel - 5));

  // 3. Player level inflation multiplier (cost increases with each player level)
  // At level 1: multiplier = 1.0
  // At level 50: multiplier ~ 3.5
  // At level 165: multiplier ~ 22.0
  // At level 265+: multiplier ~ 60.0+
  const playerScale = 1 + (playerLevel - 1) * 0.035 + Math.pow(Math.max(0, playerLevel - 1) / 32, 1.85);

  return Math.round(baseCost * rankFactor * playerScale);
}
